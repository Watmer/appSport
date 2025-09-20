import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Zoomable } from "@likashefqet/react-native-image-zoom";
import { useNavigation } from "@react-navigation/native";
import * as Clipboard from 'expo-clipboard';
import LottieView from 'lottie-react-native';
import { AzureOpenAI } from "openai";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Alert, BackHandler, Dimensions, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import loadingDots from '../../assets/animations/loadingDots.json';
import { addAiResponse, addAskAboutMessage, addUserMessage, createAiSession, deleteAiSession, deleteMessageById, getAiSessionMessages, getAllAiSessions, removeMessageImageUrl, setMessageImageUrl, updateAiChatMealById } from "../db/CRUD/AiChatCRUD";
import { addMealWithIngredients } from "../db/CRUD/DayMealsCRUD";
import { eventBus } from "../utils/EventBus";
import { renderImage, sendImagePrompt } from "./AiImageGenerator";

const { width, height } = Dimensions.get("window");

export default function AiChatScreen({ route }: { route: any }) {
  const { mealInfo } = route.params || {};

  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);

  const today = new Date();
  const currentDay = today.getDate();
  const dayId = `dayInfo:${currentDay}-${today.getMonth() + 1}-${today.getFullYear()}`;

  const [client, setClient] = useState<AzureOpenAI>();
  const [deployment, setDeployment] = useState("");
  const [currentIdChat, setCurrentIdChat] = useState(-1);

  const [showModalImage, setShowModalImage] = useState(false);
  const [showingMsgImage, setShowingMsgImage] = useState("");
  const scale = useSharedValue(1);

  const [chatMessages, setChatMessages] = useState<{
    id: number;
    role: string;
    content: string;
    jsonParsed?: string | null;
    imageUrl?: string | null;
  }[]>([]);

  const [inputMessage, setInputMessage] = useState("");
  const [storedChats, setStoredChats] = useState<{
    id: number;
    createdAt: number | null;
    systemRole: string;
    systemMessage: string;
    hasMessages: boolean;
  }[]>([]);

  const [showingChats, setShowingChats] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(-1);
  const [selectedMessages, setSelectedMessages] = useState<number[]>([])

  const [selectingMessageContent, setSelectingMessageContent] = useState(false);
  const [enabledSelection, setEnabledSelection] = useState(false);
  const [enableSelectingMessages, setEnableSelectingMessages] = useState(false);
  const [showSelectedMessageOptions, setShowSelectedMessageOptions] = useState(false);
  const [showingChatOptions, setShowingChatOptions] = useState(false);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [fetchingMessages, setFetchingMessages] = useState(true);

  const [useRefPositionMessage, setUseRefPositionMessage] = useState({
    x: 0,
    y: 0,
  });
  const [useRefPositionChatOptions, setUseRefPositionChatOptions] = useState({
    x: 0,
    y: 0,
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          style={{ marginLeft: 20 }}
          onPress={() => {
            if (!loadingResponse) {
              setShowingChats(!showingChats);
            } else {
              setShowingChats(false);
            }
          }}
        >
          <MaterialCommunityIcons
            name="view-headline"
            size={30}
            color="rgba(255, 170, 0, 1)"
          />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: 20 }}
          onPress={(event) => {
            setShowingChatOptions(true);
            setUseRefPositionChatOptions({
              x: event.nativeEvent.pageX,
              y: event.nativeEvent.pageY,
            });
          }}
        >
          <MaterialCommunityIcons
            name="dots-vertical"
            size={30}
            color="rgba(255, 170, 0, 1)"
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, showingChats]);

  useEffect(() => {
    {/* Si se está seleccionando msg y realiza acción se volver, cancela el estado de selección */ }
    const backAction = () => {
      if (enableSelectingMessages) {
        setEnableSelectingMessages(false);
        setSelectedMessages([]);
        return true;
      } else {
        return false;
      }
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [enableSelectingMessages]);

  useEffect(() => {
    {/* Al cargar los mensajes del chat, hace scroll hasta el final */ }
    if (!fetchingMessages) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [fetchingMessages]);

  useEffect(() => {
    {/* Al montar la pantalla, configura un nuevo chat y carga el 
      resto de sesiones y los mensajes del chat */ }
    configureAiChat();
    fetchStoredChats();
  }, []);

  useEffect(() => {
    {/* Al cambiar de chat carga las sesiones y los mensajes del chat */ }
    if (currentIdChat > 0) {
      fetchStoredChats();
    }
  }, [currentIdChat]);

  /*
    Pone las variables a su valor inicial, carga los mensajes del 
    chat actual y carga los id de las sesiones
  */
  async function fetchStoredChats() {
    (navigation as any).setParams({ mealInfo: undefined });

    setFetchingMessages(true);
    setChatMessages([]);
    setInputMessage("");
    setShowingChats(false);
    setSelectedMessageId(-1);
    setShowSelectedMessageOptions(false);
    setSelectingMessageContent(false);
    setEnabledSelection(false);
    setEnableSelectingMessages(false);
    setSelectedMessages([]);
    setShowingChatOptions(false);
    setLoadingResponse(false);

    const sessions = await getAllAiSessions();
    setStoredChats(sessions);
    const currentMessages = (await getAiSessionMessages(currentIdChat)).filter((msg) => msg.role !== "system");
    setChatMessages(currentMessages);
    setFetchingMessages(false);
  }

  /*
    Crea una nueva sesion y establece los valores para la 
    conexion con la api
  */
  async function configureAiChat() {
    const endpoint = "https://luis-ia-gpt-modelo.openai.azure.com/";
    const apiKey = "6BeNNxizarSJhZkFRkwgIXogsXzBP6pxIbQfdDLuQBNB1qDYwFFgJQQJ99BHACfhMk5XJ3w3AAABACOGJ8Sr";
    const apiVersion = "2025-01-01-preview";
    const initDeployment = "gpt-4.1-mini";

    setDeployment(initDeployment);

    const initClient = new AzureOpenAI({
      endpoint,
      apiKey,
      apiVersion,
    });
    const sessionId = await createAiSession();
    setCurrentIdChat(sessionId);
    setClient(initClient);
    if (mealInfo) {
      await addMealToChat(sessionId, mealInfo)
    }
  }

  /*
    Crea una nueva sesion y carga las sesiones y los mensajes del chat
  */
  async function createNewSession() {
    const newSessionId = await createAiSession();
    setCurrentIdChat(newSessionId);
    fetchStoredChats();
  }

  /*
    Borra la sesion actual, crea una nueva y carga las sesiones y 
    los mensajes del chat
  */
  async function deleteSession() {
    await deleteAiSession(currentIdChat);
    await configureAiChat();
    await fetchStoredChats();
  }

  /*
    Añade al chat el plato sobre el que se va preguntar
  */
  async function addMealToChat(sessionId: number, mealData: any) {
    await addAskAboutMessage(sessionId, mealData);
    const updatedMessages = await getAiSessionMessages(sessionId);
    setChatMessages(updatedMessages.filter(msg => msg.role !== "system"));
  }

  /*
    Funcion para mandar los mensajes a la ia
  */
  async function sendMessage(message: string) {
    if (!client) return;

    setLoadingResponse(true);
    setShowingChats(false);

    {/* Primero se añade el mensaje del usuario para verlo en el chat, 
      y se hace scroll hasta el final */}
    await addUserMessage(currentIdChat, message);

    let sessionMessages = await getAiSessionMessages(currentIdChat);
    setChatMessages(sessionMessages.filter(m => m.role !== "system"));

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    {/* Se crea un id temporal y se inician variables */ }
    const tempId = Date.now();
    setChatMessages(prev => [...prev, { id: tempId, role: "assistant", content: "" }]);

    let fullText = "";
    let pending = "";
    let currentVisible = "";
    let hideRest = false;

    const interval = setInterval(async () => {
      if (pending.length > 0) {
        const char = pending[0];
        pending = pending.slice(1);
        currentVisible += char;

        {/* Limpia el prefijo [RESPUESTA] y corta a partir de [JSON] */ }
        let visible = currentVisible.replace(/\[RESPUESTA\][^\S\r\n]*\r?\n?/, "");
        if (!hideRest && visible.includes("[JSON]")) {
          visible = visible.split("[JSON]")[0].trim();
          hideRest = true;
        }

        setChatMessages(prev =>
          prev.map(msg => (msg.id === tempId ? { ...msg, content: visible } : msg))
        );

        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }

      {/* Si ya no muestra más mensaje, detiene el intervalo */ }
      if (hideRest) {
        clearInterval(interval);
      }
    }, 10);

    try {
      const stream = await client.chat.completions.stream({
        model: deployment,
        messages: sessionMessages,
        max_tokens: 1024,
        temperature: 0.7,
        top_p: 0.95,
      });

      {/* Añade el contenido del stream y los va acumulando*/ }
      for await (const event of stream) {
        const chunk = event.choices?.[0]?.delta?.content;
        if (chunk) {
          fullText += chunk;
          if (!hideRest) {
            pending += chunk;
          }
        }
      }

      {/* Al final añade la respuesta al chat*/ }
      await addAiResponse(currentIdChat, fullText);
      const updated = (await getAiSessionMessages(currentIdChat)).filter(m => m.role !== "system");
      setChatMessages(updated);
      setLoadingResponse(false);

    } catch (err) {
      clearInterval(interval);
      console.error("Error en streaming:", err);
      setLoadingResponse(false);
    }
  }

  /* 
    Maneja el envio del mensaje y carga los mensajes
  */
  async function handleSendMessage() {
    if (inputMessage !== "") {
      sendMessage(inputMessage);
      setInputMessage("");
      const updatedMessages = (await getAiSessionMessages(currentIdChat)).filter((msg) => msg.role !== "system");
      setChatMessages(updatedMessages);
    }
  }

  /*
    Añade el plato creado por la ia al las comidas del dia
  */
  async function addMealFromChat(mealData: any, dayId?: string) {
    try {
      if (Object.keys(mealData).length > 0) {
        if (dayId) {
          await addMealWithIngredients(dayId, mealData);
        } else {
          await addMealWithIngredients(mealData.dayId, mealData);
        }

        {/* Emite un evento para acutalizar Home */ }
        eventBus.emit("REFRESH_HOME");
        Alert.alert("Comida añadida", "Se ha añadido correctamente.");
      }
    } catch (e) {
      console.error("Error al guardar receta:", e);
    }
  };

  /*
    Actualiza el plato creado por la ia a las comida del chat
  */
  async function updateMealFromChat(mealData: any, dayId?: string) {
    try {
      if (dayId) {
        await updateAiChatMealById(mealData.id, mealData, dayId);
      } else {
        await updateAiChatMealById(mealData.id, mealData, mealData.dayId);
      }

      {/* Emite un evento para acutalizar Home */ }
      eventBus.emit("REFRESH_HOME");
      Alert.alert("Comida actualizada", "Se ha actualizado correctamente.");
    } catch (e) {
      console.error("Error al guardar receta:", e);
    }
  };

  /*
    Maneja el envio del prompt para la generacion de imagen
  */
  async function handleSendImagePrompt(prompt: string) {
    await setMessageImageUrl(selectedMessageId, "loading");
    let sessionMessages = await getAiSessionMessages(currentIdChat);
    setChatMessages(sessionMessages?.filter(m => m.role !== "system") ?? []);

    sessionMessages = await sendImagePrompt(prompt, selectedMessageId, currentIdChat) ?? [];
    setChatMessages(sessionMessages?.filter(m => m.role !== "system"));
  };

  /*
    Devuelve como se van a mostrar la seccion de chats guardados
  */
  const renderStoredChats = () => {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{
          flex: 1,
          paddingTop: 5,
          paddingHorizontal: 15,
          backgroundColor: "rgba(40, 40, 40, 1)",
        }}
      >
        {/* Boton de crear nueva sesion */}
        <TouchableOpacity
          style={{
            padding: 10,
            borderRadius: 10,
            marginVertical: 5,
            alignContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(100, 0, 200, 0.5)",
          }}
          onPress={async () => {
            await createNewSession();
          }}
        >
          <MaterialCommunityIcons
            name="plus"
            size={20}
            color="rgba(255, 255, 255, 1)"
          />
        </TouchableOpacity>

        {/* Muestra todos los chats que hay */}
        {storedChats.map((chat) => (

          /* Boton para cargar la info del chat seleccionado */
          <TouchableOpacity
            key={chat.id}
            style={{
              backgroundColor: chat.id === currentIdChat ? "rgba(100, 0, 200, 1)" : "rgba(70, 70, 70, 1)",
              padding: 15,
              borderRadius: 10,
              marginVertical: 5,
            }}
            onPress={async () => {
              setCurrentIdChat(chat.id);
              const messages = (await getAiSessionMessages(chat.id)).filter(
                (msg) => msg.role !== "system"
              );
              setChatMessages(messages);
              setShowingChats(false);
            }}
          >
            {chat.hasMessages || (chat.id === currentIdChat && chatMessages.length > 0) ? (
              <Text style={{ color: "white" }}>
                {new Date(chat.createdAt ?? Date.now()).toLocaleString("default", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  weekday: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </Text>
            ) : (
              <Text style={{ color: "white" }}>Nuevo Chat</Text>)
            }
          </TouchableOpacity>

        ))}
      </ScrollView>
    );
  };

  /*
    Devuelve las opciones que se mostraran para el mensaje seleccionado
  */
  const renderOptionsForSelectedMessage = () => {
    const width_size = 180;

    const top = Math.min(useRefPositionMessage.y, height - width_size);
    const left = Math.min(useRefPositionMessage.x, width - width_size);

    return (
      <Modal
        visible={showSelectedMessageOptions}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowSelectedMessageOptions(false);
          setSelectedMessageId(-1);
          setSelectingMessageContent(false);
        }}
      >
        {/* Al pulsar fuera del contenedor se cierra el modal */}
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => {
            setShowSelectedMessageOptions(false);
            setSelectedMessageId(-1);
            setSelectingMessageContent(false);
          }}
        >
          <View
            style={{
              position: "absolute",
              top,
              left,
              backgroundColor: "rgba(40, 40, 40, 1)",
              padding: 10,
              borderRadius: 10,
              width: width_size,
            }}
          >

            {/* Boton para copiar el texto del mensaje */}
            <TouchableOpacity
              onPress={() => {
                if (selectedMessageId !== -1) {
                  const messageToCopy = chatMessages.find(
                    (msg) => msg.id === selectedMessageId
                  );
                  if (messageToCopy) {
                    Clipboard.setStringAsync(messageToCopy.content);
                  }
                }
                setShowSelectedMessageOptions(false);
                setSelectedMessageId(-1);
                setSelectingMessageContent(false);
              }}
              style={{ padding: 5, flexDirection: 'row', alignItems: 'center', maxWidth: "85%" }}
            >
              <MaterialCommunityIcons style={{ paddingRight: 5 }} name="content-copy" size={20} color={"white"} />
              <Text style={{ color: "white" }}>Copiar</Text>
            </TouchableOpacity>

            {/* Boton para seleccionar texto del mensaje */}
            <TouchableOpacity
              onPress={() => {
                setSelectingMessageContent(true);
                setShowSelectedMessageOptions(false);
                setEnabledSelection(true);
              }}
              style={{ padding: 5, flexDirection: 'row', alignItems: 'center', maxWidth: "85%" }}
            >
              <MaterialCommunityIcons style={{ paddingRight: 5 }} name="selection" size={20} color={"white"} />
              <Text style={{ color: "white" }}>Seleccionar texto</Text>
            </TouchableOpacity>

            {/* Boton para generar o eliminar la imagen generada */}
            {chatMessages.find(
              (msg) => msg.id === selectedMessageId && msg.imageUrl !== 'loading'
            )?.imageUrl ? (

              /* Si ya hay imagen, al pulsar elimina la imagen */
              <TouchableOpacity
                onPress={async () => {
                  if (selectedMessageId !== -1) {
                    const message = chatMessages.find(
                      (msg) => msg.id === selectedMessageId
                    );
                    if (message) {
                      await removeMessageImageUrl(message.id);

                      const updatedMessages = (await getAiSessionMessages(currentIdChat)).filter((msg) => msg.role !== "system");
                      setChatMessages(updatedMessages);
                    }
                  }
                  setShowSelectedMessageOptions(false);
                  setSelectedMessageId(-1);
                  setSelectingMessageContent(false);
                }}
                style={{ padding: 5, flexDirection: 'row', alignItems: 'center', maxWidth: "85%" }}
              >
                <MaterialCommunityIcons style={{ paddingRight: 5 }} name="image-off-outline" size={20} color={"red"} />
                <Text style={{ color: "red" }}>Eliminar imagen</Text>
              </TouchableOpacity>
            ) : (

              /* Si no hay imagen permite generar una */
              <TouchableOpacity
                onPress={() => {
                  if (selectedMessageId !== -1) {
                    const messagePrompt = chatMessages.find(
                      (msg) => msg.id === selectedMessageId
                    );
                    if (messagePrompt) {
                      handleSendImagePrompt(messagePrompt.content);
                    }
                  }
                  setShowSelectedMessageOptions(false);
                  setSelectedMessageId(-1);
                  setSelectingMessageContent(false);
                }}
                style={{ padding: 5, flexDirection: 'row', alignItems: 'center', maxWidth: "85%" }}
              >
                <MaterialCommunityIcons style={{ paddingRight: 5 }} name="palette" size={20} color={"white"} />
                <Text style={{ color: "white" }}>Convertir a imagen</Text>
              </TouchableOpacity>
            )}

            {/* Boton para eliminar el mensaje seleccionado */}
            < TouchableOpacity
              onPress={async () => {
                if (selectedMessageId !== -1) {
                  await deleteMessageById(selectedMessageId);
                  const updatedMessages = (await getAiSessionMessages(currentIdChat)).filter((msg) => msg.role !== "system");
                  setChatMessages(updatedMessages);
                }
                setShowSelectedMessageOptions(false);
                setSelectedMessageId(-1);
                setSelectingMessageContent(false);
              }}
              style={{ padding: 5, flexDirection: 'row', alignItems: 'center', maxWidth: "85%" }}
            >
              <MaterialCommunityIcons style={{ paddingRight: 5 }} name="trash-can-outline" size={20} color={"red"} />
              <Text style={{ color: "red" }}>Eliminar mensaje</Text>
            </TouchableOpacity>

          </View>
        </TouchableOpacity >
      </Modal >
    );
  };

  /*
    Devuelve las opciones del chat que se mostraran
   */
  const renderChatOptions = () => {
    const width_size = 180;
    const left = Math.min(useRefPositionChatOptions.x, width - width_size);

    return (
      <Modal
        visible={showingChatOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowingChatOptions(false)}
      >
        {/* Al pulsar fuera del contenedor se cierra el modal */}
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => setShowingChatOptions(false)}
        >
          <View
            style={{
              position: "absolute",
              top: 50,
              left,
              backgroundColor: "rgba(40, 40, 40, 1)",
              padding: 15,
              borderRadius: 10,
              width: width_size,
            }}
          >
            {!enableSelectingMessages ? (
              /* Muestra las opciones para el chat si no está en modo seleccionar mensajes */
              <View>

                {/* Boton para seleccionar mensajes */}
                <TouchableOpacity
                  onPress={() => {
                    if (enableSelectingMessages) {
                      setSelectedMessages([]);
                    }
                    setEnableSelectingMessages(true);
                    setShowingChatOptions(false);
                    setSelectingMessageContent(false);
                    setEnabledSelection(false);
                    setShowSelectedMessageOptions(false);
                    setSelectedMessageId(-1);
                  }}
                  style={{ padding: 5, flexDirection: 'row', alignItems: 'center', maxWidth: "85%" }}
                >
                  <MaterialCommunityIcons style={{ paddingRight: 5 }} name="selection-multiple" size={20} color={"white"} />
                  <Text style={{ color: "white" }}>Seleccionar mensajes</Text>
                </TouchableOpacity>

                {/* Boton para eliminar el chat */}
                <TouchableOpacity
                  onPress={async () => {
                    await deleteSession();
                    setShowingChatOptions(false);
                  }}
                  style={{ padding: 5, flexDirection: 'row', alignItems: 'center', maxWidth: "85%" }}
                >
                  <MaterialCommunityIcons style={{ paddingRight: 5 }} name="trash-can-outline" size={20} color={"red"} />
                  <Text style={{ color: "red" }}>Eliminar chat</Text>
                </TouchableOpacity>

              </View>
            ) : (
              /* Muestra las opciones para los mensajes seleccionados */
              <View>

                {/* Boton para copiar el texto de los mensajes seleccionados */}
                <TouchableOpacity
                  onPress={() => {
                    if (selectedMessages.length > 0) {
                      const messagesToCopy = chatMessages.filter(
                        (msg) => selectedMessages.includes(msg.id)
                      );
                      if (messagesToCopy.length > 0) {
                        const combinedContent = messagesToCopy.map(msg => `[${msg.role === 'assistant' ? 'Ai' : 'User'}] ` + msg.content).join('\n\n');
                        Clipboard.setStringAsync(combinedContent);
                      }
                    }
                    setEnableSelectingMessages(false);
                    setSelectedMessages([]);
                    setEnableSelectingMessages(false);
                    setShowingChatOptions(false);
                  }}
                  style={{ padding: 5, flexDirection: 'row', alignItems: 'center', maxWidth: "85%" }}
                >
                  <MaterialCommunityIcons style={{ paddingRight: 5 }} name="content-copy" size={20} color={"white"} />
                  <Text style={{ color: "white" }}>Copiar mensajes</Text>
                </TouchableOpacity>

                {/* Boton para eliminar los mensajes seleccionados */}
                <TouchableOpacity
                  onPress={async () => {
                    if (selectedMessages.length > 0) {
                      for (const messageId of selectedMessages) {
                        await deleteMessageById(messageId);
                      }
                      const updatedMessages = (await getAiSessionMessages(currentIdChat)).filter((msg) => msg.role !== "system");
                      setChatMessages(updatedMessages);
                    }
                    setSelectedMessages([]);
                    setEnableSelectingMessages(false);
                    setEnableSelectingMessages(false);
                    setShowingChatOptions(false);
                  }}
                  style={{ padding: 5, flexDirection: 'row', alignItems: 'center', maxWidth: "85%" }}
                >
                  <MaterialCommunityIcons style={{ paddingRight: 5 }} name="trash-can-outline" size={20} color={"red"} />
                  <Text style={{ color: "red" }}>Eliminar mensajes</Text>
                </TouchableOpacity>

                {/* Boton para cancelar el estado de seleccion de mensajes */}
                <TouchableOpacity
                  onPress={() => {
                    setSelectedMessages([]);
                    setEnableSelectingMessages(false);
                    setEnableSelectingMessages(false);
                    setShowingChatOptions(false);
                  }}
                  style={{ padding: 5, flexDirection: 'row', alignItems: 'center', maxWidth: "85%" }}
                >
                  <MaterialCommunityIcons style={{ paddingRight: 5 }} name="close" size={20} color={"white"} />
                  <Text style={{ color: "white" }}>Cancelar</Text>
                </TouchableOpacity>

              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  /*
    Devuelve las opciones que se verán si el mensaje tiene json
   */
  const renderJsonOptions = (messageId: number, role: string) => {
    const msg = chatMessages.find(msg => msg.id === messageId);

    let parsed: any = {};
    try {
      parsed = msg?.jsonParsed ? JSON.parse(msg.jsonParsed) : {};
    } catch (e) {
      console.error("Error al parsear JSON:", e);
    }

    return (
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          maxWidth: 250,
          alignSelf: role === "assistant" ? "flex-start" : "flex-end",
        }}
      >
        {/* Muestra el boton para añadir la receta si es generada por la ia */}
        {role === "assistant" && (
          < TouchableOpacity
            onPress={async () => {
              await addMealFromChat(parsed, dayId);
            }}
            style={{
              padding: 5,
              marginRight: 10,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <MaterialCommunityIcons
              name="text-box-plus-outline"
              size={20}
              color="rgba(255, 255, 255, 1)"
            />
            <Text style={{ color: "white", paddingLeft: 5 }}>Añadir receta</Text>
          </TouchableOpacity>
        )}

        {/* Boton para ver la receta generada */}
        <TouchableOpacity
          onPress={() => {
            (navigation as any).navigate("MealDetailsScreen", { mealJson: parsed });
          }}
          style={{ padding: 5, flexDirection: "row", alignItems: "center" }}
        >
          <MaterialCommunityIcons
            name="view-dashboard-variant"
            size={20}
            color="rgba(255, 255, 255, 1)"
          />
          <Text style={{ color: "white", paddingLeft: 5 }}>Ver</Text>
        </TouchableOpacity>

        {/* Muestra el boton para actualizar la receta si tiene id */}
        {parsed?.id && (
          <TouchableOpacity
            onPress={async () => {
              await updateMealFromChat(parsed);
            }}
            style={{
              padding: 5,
              marginRight: 10,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <MaterialCommunityIcons
              name="reload"
              size={20}
              color="rgba(255, 255, 255, 1)"
            />
            <Text style={{ color: "white", paddingLeft: 5 }}>Actualizar receta</Text>
          </TouchableOpacity>
        )}
      </View >
    );
  };

  /*
    Devuelve como se mostraran los mensajes del chat
   */
  const renderChatMessages = () => {
    return (
      <View style={{ flex: 1, }}>
        <ScrollView ref={scrollViewRef} style={styles.scrollContainer}>

          {chatMessages.length > 0 ? (
            /* Si hay mensajes los muestra */
            chatMessages.map((message, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={enableSelectingMessages ? 0.5 : 1}
                style={{
                  backgroundColor: enableSelectingMessages && selectedMessages.includes(message.id) ? "rgba(250, 170, 0, 0.3)" : "transparent",
                  paddingHorizontal: 15,
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 1,
                }}
                onPress={() => {
                  {/* Alterna a la seleccion el mensaje pulsado */ }
                  if (enableSelectingMessages) {
                    if (selectedMessages.includes(message.id)) {
                      setSelectedMessages(selectedMessages.filter(id => id !== message.id));
                    } else {
                      setSelectedMessages([...selectedMessages, message.id]);
                    }

                    {/* Si no está en modo seleccion, cierra las opciones del mensaje */ }
                  } else {
                    setSelectedMessages([]);
                    setSelectedMessageId(-1);
                    setShowSelectedMessageOptions(false);
                    setSelectingMessageContent(false);
                    setEnabledSelection(false);
                  }
                }}
                onLongPress={() => {
                  {/* Al mantener pulsado fuera de los mensajes, se actuva la seleccion de mensajes */ }
                  if (!enableSelectingMessages) {
                    setEnableSelectingMessages(true);
                    setSelectedMessages([message.id]);
                    setSelectedMessageId(-1);
                    setShowSelectedMessageOptions(false);
                    setSelectingMessageContent(false);
                    setEnabledSelection(false);
                  }
                }}
              >
                {/* Muestra un checkbox si esta en modo seleccion de mensajes */}
                {enableSelectingMessages &&
                  <MaterialCommunityIcons
                    name={selectedMessages.includes(message.id) ? "checkbox-marked" : "checkbox-blank-outline"}
                    size={24}
                    color="rgba(255, 170, 0, 1)"
                    style={{ position: "fixed", paddingRight: 15 }}
                  />
                }

                {/* Mensajes */}
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <TouchableOpacity
                    activeOpacity={1}
                    disabled={enableSelectingMessages}
                    style={[message.role === "assistant" ?
                      styles.aiResponses : styles.userMessages,
                    message.id === selectedMessageId && { borderColor: "rgba(255, 170, 0, 0.7)" }]
                    }
                    onLongPress={(event) => {
                      {/* Si esta seleccionando texto de un mensaje luego lo desactiva */ }
                      if (selectingMessageContent && message.id === selectedMessageId) {
                        setSelectingMessageContent(false);
                      } else {
                        {/* Si no se está seleccionando texto, muestra las opciones del mensaje */ }
                        setEnabledSelection(false);
                        setSelectedMessageId(message.id);
                        setUseRefPositionMessage({
                          x: event.nativeEvent.pageX,
                          y: event.nativeEvent.pageY,
                        });
                        setShowSelectedMessageOptions(true);
                        setSelectingMessageContent(false);
                      }
                    }}
                  >
                    {message.content !== "" ? (
                      /* Si hay texto en el mensaje lo muestra */
                      <Text
                        selectable={message.id === selectedMessageId && enabledSelection}
                        selectionColor={"rgba(255, 170, 0, 0.5)"}
                        style={styles.messageText}
                      >
                        {message.content}
                      </Text>
                    ) : (
                      /* Si no hay texto aun en el mensaje, muestra una animacion */
                      <LottieView
                        source={loadingDots}
                        autoPlay
                        loop
                        style={{ width: 50, height: 35 }}
                      />
                    )}

                    {/* Imagen */}
                    {message.imageUrl &&
                      <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => {
                          {/* Al pulsar la imagen, lo muestra en grande */ }
                          setShowModalImage(true);
                          message.imageUrl &&
                            setShowingMsgImage(message.imageUrl)
                        }}
                        onLongPress={(event) => {
                          {/* Si esta seleccionando texto de un mensaje luego lo desactiva */ }
                          if (selectingMessageContent && message.id === selectedMessageId) {
                            setSelectingMessageContent(false);

                          } else {
                            {/* Si no se está seleccionando texto, muestra las opciones del mensaje */ }
                            setEnabledSelection(false);
                            setSelectedMessageId(message.id);
                            setUseRefPositionMessage({
                              x: event.nativeEvent.pageX,
                              y: event.nativeEvent.pageY,
                            });
                            setShowSelectedMessageOptions(true);
                            setSelectingMessageContent(false);
                          }
                        }}
                      >
                        {/* Muestra la imagen del mensaje, si hay */}
                        {renderImage(message.imageUrl)}
                      </TouchableOpacity>}

                  </TouchableOpacity>

                  {/* Muestra las opciones de json si ahy json */}
                  {message.jsonParsed && renderJsonOptions(message.id, message.role)}

                </View>
              </TouchableOpacity>
            ))
          ) : (
            /* Si no hay mensajes muestra texto */
            <View
              style={{
                alignItems: "center",
                marginTop: 50,
                paddingHorizontal: 5,
              }}
            >
              <Text style={{ color: "gray", textAlign: 'center' }}>
                No hay mensajes aún. ¡Empieza la conversación!
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Muestra la barra para escribir y enviar mensajes */}
        <View style={styles.writeMessageContainer}>
          <TextInput
            style={styles.input}
            placeholder="Pregunta..."
            placeholderTextColor="gray"
            value={inputMessage}
            onChangeText={setInputMessage}
            onFocus={() => setShowingChats(false)}
            selectionColor={"rgba(255, 170, 0, 0.5)"}
            selectionHandleColor={"rgba(255, 170, 0, 1)"}
            cursorColor={"rgba(255, 170, 0, 1)"}
            multiline
          />

          <TouchableOpacity
            disabled={loadingResponse}
            onPress={handleSendMessage}
            style={[styles.sendButton, loadingResponse && { opacity: 0.4 }]}
          >
            <MaterialCommunityIcons
              name="send"
              size={20}
              color={"rgba(255, 255, 255, 1)"}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /*
    Funcion que devuelve como se mostrará la imagen al pulsarla
  */
  function renderModalImage() {
    return (
      <Modal
        visible={showModalImage}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowModalImage(false);
          setShowingMsgImage("");
        }}
      >
        {/* Captura los gestos de la pantalla */}
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)' }}>
          {/* Permite hacer zoom en la imagen */}
          <Zoomable
            minScale={0.5}
            maxScale={5}
            scale={scale}
            isDoubleTapEnabled
            style={{ justifyContent: 'center' }}
          >
            {renderImage(showingMsgImage)}
          </Zoomable>
        </GestureHandlerRootView>
      </Modal>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={{
          flex: 1,
          justifyContent: "space-between",
          flexDirection: "row",
        }}
      >
        {showingChats && renderStoredChats()}
        {renderChatMessages()}
      </View>
      {showSelectedMessageOptions && renderOptionsForSelectedMessage()}
      {showingChatOptions && renderChatOptions()}
      {renderModalImage()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(30, 30, 30, 1)",
  },
  scrollContainer: {
    flex: 1,
    marginTop: 5,
  },
  aiResponses: {
    backgroundColor: "rgba(80, 80, 80, 1)",
    maxWidth: 250,
    borderRadius: 10,
    borderBottomLeftRadius: 0,
    marginVertical: 5,
    alignSelf: "flex-start",
    borderWidth: 2,
    borderColor: "rgba(80, 80, 80, 1)",
  },
  userMessages: {
    backgroundColor: "rgba(100, 0, 200, 1)",
    maxWidth: 250,
    borderRadius: 10,
    borderBottomRightRadius: 0,
    marginVertical: 5,
    alignSelf: "flex-end",
    borderWidth: 2,
    borderColor: "rgba(100, 0, 200, 1)"
  },
  messageText: {
    color: "white",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  sendButton: {
    padding: 10,
    backgroundColor: "rgba(100, 0, 255, 1)",
    borderColor: "rgba(70, 0, 175, 1)",
    borderWidth: 1,
    borderRadius: 50,
    marginRight: 5,
    right: 0,
    position: 'fixed',
  },
  input: {
    maxHeight: 100,
    flex: 1,
    margin: 5,
    color: "white",
  },
  writeMessageContainer: {
    backgroundColor: "rgba(70, 70, 70, 1)",
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 7,
    alignItems: 'center',
  },
  modalOverlay: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomableModal: {
    width: "100%",
    height: "100%",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
});
