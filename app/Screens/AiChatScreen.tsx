import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Clipboard from 'expo-clipboard';
import LottieView from 'lottie-react-native';
import { AzureOpenAI } from "openai";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Alert, BackHandler, Dimensions, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import loadingDots from '../../assets/animations/loadingDots.json';
import { addAiResponse, addAskAboutMessage, addMealWithIngredients, addUserMessage, createAiSession, deleteAiSession, deleteMessageById, getAiSessionMessages, getAllAiSessions, setMessageImageUrl, updateAiChatMealById } from "../db/DaySqlLiteCRUD";
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

  async function addMealToChat(sessionId: number, mealData: any) {
    await addAskAboutMessage(sessionId, mealData);
    const updatedMessages = await getAiSessionMessages(sessionId);
    setChatMessages(updatedMessages.filter(msg => msg.role !== "system"));
  }

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

  useEffect(() => {
    if (!fetchingMessages) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [fetchingMessages]);

  useEffect(() => {
    configureAiChat();
    fetchStoredChats();
  }, []);

  useEffect(() => {
    if (currentIdChat > 0) fetchStoredChats();
  }, [currentIdChat]);

  async function createNewSession() {
    const newSessionId = await createAiSession();
    setCurrentIdChat(newSessionId);
    fetchStoredChats();
  }

  async function deleteSession() {
    await deleteAiSession(currentIdChat);
    await configureAiChat();
    await fetchStoredChats();
  }

  async function sendMessage(message: string) {
    if (!client) return;

    setLoadingResponse(true);
    setShowingChats(false);

    await addUserMessage(currentIdChat, message);

    let sessionMessages = await getAiSessionMessages(currentIdChat);
    setChatMessages(sessionMessages.filter(m => m.role !== "system"));

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    const tempId = Date.now();

    setChatMessages(prev => [...prev, { id: tempId, role: "assistant", content: "" }]);

    let fullText = "";
    let buffer = "";
    let currentVisible = "";
    let hideRest = false;
    let streamDone = false;

    const interval = setInterval(async () => {
      if (buffer.length === 0) {
        if (streamDone) {
          clearInterval(interval);
          await addAiResponse(currentIdChat, fullText);
          const updated = (await getAiSessionMessages(currentIdChat)).filter(m => m.role !== "system");
          setChatMessages(updated);
          setLoadingResponse(false);
        }
        return;
      }

      const ch = buffer[0];
      buffer = buffer.slice(1);
      currentVisible += ch;

      let visible = currentVisible.replace(/\[RESPUESTA\][^\S\r\n]*\r?\n?/, "");
      if (!hideRest && visible.includes("[JSON]")) {
        visible = visible.split("[JSON]")[0].trim();
        hideRest = true;
      }

      setChatMessages(prev =>
        prev.map(m => (m.id === tempId ? { ...m, content: visible } : m))
      );

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    }, 30);

    try {
      const stream = await client.chat.completions.stream({
        model: deployment,
        messages: sessionMessages,
        max_tokens: 1024,
        temperature: 0.7,
        top_p: 0.95,
      });

      for await (const event of stream) {
        const chunk = event.choices?.[0]?.delta?.content;
        if (!chunk) continue;
        fullText += chunk;
        if (!hideRest) buffer += chunk;
      }

      streamDone = true;
    } catch (err) {
      clearInterval(interval);
      console.error("Error en streaming:", err);
      setLoadingResponse(false);
    }
  }

  async function handleSendMessage() {
    if (inputMessage !== "") {
      sendMessage(inputMessage);
      setInputMessage("");
      const updatedMessages = (await getAiSessionMessages(currentIdChat)).filter((msg) => msg.role !== "system");
      setChatMessages(updatedMessages);
    }
  }

  useEffect(() => {
    const backAction = () => {
      if (enableSelectingMessages) {
        setEnableSelectingMessages(false);
        setSelectedMessages([]);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [enableSelectingMessages]);

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
        {storedChats.map((chat) => (
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
            ) : (<Text style={{ color: "white" }}>Nuevo Chat</Text>)
            }
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

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

            <TouchableOpacity
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
        </TouchableOpacity>
      </Modal>
    );
  };

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
              <View>
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
              <View>
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
        {role === "assistant" && (
          <>
            <TouchableOpacity
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

          </>
        )}

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
      </View>
    );
  };

  async function addMealFromChat(mealData: any, dayId?: string) {
    try {
      if (Object.keys(mealData).length > 0) {
        if (dayId) {
          await addMealWithIngredients(dayId, mealData);
        } else {
          await addMealWithIngredients(mealData.dayId, mealData);
        }
        eventBus.emit("REFRESH_HOME");
        Alert.alert("Comida añadida", "Se ha añadido correctamente.");
      }
    } catch (e) {
      console.error("Error al guardar receta:", e);
    }
  };

  async function updateMealFromChat(mealData: any, dayId?: string) {
    try {
      if (dayId) {
        await updateAiChatMealById(mealData.id, mealData, dayId);
      } else {
        await updateAiChatMealById(mealData.id, mealData, mealData.dayId);
      }

      eventBus.emit("REFRESH_HOME");
      Alert.alert("Comida actualizada", "Se ha actualizado correctamente.");
    } catch (e) {
      console.error("Error al guardar receta:", e);
    }
  };

  const renderChatMessages = () => {
    return (
      <View style={{ flex: 1, }}>
        <ScrollView ref={scrollViewRef} style={styles.scrollContainer}>
          {chatMessages.length > 0 ? (
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
                  if (enableSelectingMessages) {
                    if (selectedMessages.includes(message.id)) {
                      setSelectedMessages(selectedMessages.filter(id => id !== message.id));
                    } else {
                      setSelectedMessages([...selectedMessages, message.id]);
                    }
                  } else {
                    setSelectedMessages([]);
                    setSelectedMessageId(-1);
                    setShowSelectedMessageOptions(false);
                    setSelectingMessageContent(false);
                    setEnabledSelection(false);
                  }
                }}
                onLongPress={() => {
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
                {enableSelectingMessages &&
                  <MaterialCommunityIcons
                    name={selectedMessages.includes(message.id) ? "checkbox-marked" : "checkbox-blank-outline"}
                    size={24}
                    color="rgba(255, 170, 0, 1)"
                    style={{ position: "fixed", paddingRight: 15 }}
                  />
                }
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <TouchableOpacity
                    activeOpacity={1}
                    disabled={enableSelectingMessages}
                    style={[message.role === "assistant" ?
                      styles.aiResponses : styles.userMessages,
                    message.id === selectedMessageId && { borderColor: "rgba(255, 170, 0, 0.7)" }]
                    }
                    onLongPress={(event) => {
                      if (selectingMessageContent && message.id === selectedMessageId) {
                        setSelectingMessageContent(false);
                      } else {
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
                      <Text
                        selectable={message.id === selectedMessageId && enabledSelection}
                        selectionColor={"rgba(255, 170, 0, 0.5)"}
                        style={styles.messageText}
                      >
                        {message.content}
                      </Text>
                    ) : (
                      <LottieView
                        source={loadingDots}
                        autoPlay
                        loop
                        style={{ width: 50, height: 35 }}
                      />
                    )}
                    {message.imageUrl && renderImage(message.imageUrl)}

                  </TouchableOpacity>

                  {message.jsonParsed && renderJsonOptions(message.id, message.role)}

                </View>
              </TouchableOpacity>
            ))
          ) : (
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

  async function handleSendImagePrompt(prompt: string) {
    await setMessageImageUrl(selectedMessageId, "loading");
    let sessionMessages = await getAiSessionMessages(currentIdChat);
    setChatMessages(sessionMessages?.filter(m => m.role !== "system") ?? []);

    sessionMessages = await sendImagePrompt(prompt, selectedMessageId, currentIdChat) ?? [];
    setChatMessages(sessionMessages?.filter(m => m.role !== "system"));
  };

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
  }
});
