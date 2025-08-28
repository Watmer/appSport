import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AzureOpenAI } from "openai";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { addAiResponse, addUserMessage, createAiSession, getAiSessionMessages, getAllAiSessions } from "../db/DaySqlLiteCRUD";

export default function AiChatScreen() {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);

  const [client, setClient] = useState<AzureOpenAI>();
  const [deployment, setDeployment] = useState('');
  const [currentIdChat, setCurrentIdChat] = useState(-1);
  const [chatMessages, setChatMessages] = useState<{ role: string, content: string }[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [storedChats, setStoredChats] = useState<{ id: number }[]>([]);
  const [showingChats, setShowingChats] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity style={{ marginLeft: 20 }} onPress={() => setShowingChats(!showingChats)}>
          <MaterialCommunityIcons name="view-headline" size={30} color="rgba(255, 170, 0, 1)" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, showingChats]);

  async function configureAiChat() {
    const endpoint =
      process.env["AZURE_OPENAI_ENDPOINT"] ||
      "https://luis-ia-gpt-modelo.openai.azure.com/";
    const apiKey =
      process.env["AZURE_OPENAI_KEY"] ||
      "6BeNNxizarSJhZkFRkwgIXogsXzBP6pxIbQfdDLuQBNB1qDYwFFgJQQJ99BHACfhMk5XJ3w3AAABACOGJ8Sr";
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

    setInputMessage('');
  };

  async function fetchStoredChats() {
    const sessions = await getAllAiSessions();
    setStoredChats(sessions);
  };

  useEffect(() => {
    fetchStoredChats();
    configureAiChat();
  }, []);

  async function sendMessage(message: string) {
    if (client) {
      await addUserMessage(currentIdChat, message);
      const sessionMessages = await getAiSessionMessages(currentIdChat);

      const result = await client.chat.completions.create({
        model: deployment,
        messages: sessionMessages,
        max_tokens: 1024,
        temperature: 0.7,
        top_p: 0.95,
      });

      const assistantMessage = result.choices[0]?.message?.content;
      if (assistantMessage) {
        await addAiResponse(currentIdChat, assistantMessage);
      }

      const updatedMessages = (await getAiSessionMessages(currentIdChat)).filter(msg => msg.role !== 'system');
      setChatMessages(updatedMessages);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }

  async function handleSendMessage() {
    if (inputMessage !== '') {
      sendMessage(inputMessage);
      setInputMessage('');
      const updatedMessages = (await getAiSessionMessages(currentIdChat)).filter(msg => msg.role !== 'system');
      setChatMessages(updatedMessages);
    }
  }

  const renderStoredChats = () => {
    return (
      <ScrollView showsVerticalScrollIndicator={false}
        style={{
          flex: 1,
          paddingTop: 5,
          paddingHorizontal: 15,
          backgroundColor: "rgba(40, 40, 40, 1)",
        }}
      >
        {storedChats.map((chat) => (
          <TouchableOpacity
            key={chat.id}
            style={{
              backgroundColor: "rgba(70, 70, 70, 1)",
              padding: 15,
              borderRadius: 10,
              marginVertical: 5,
            }}
            onPress={async () => {
              setCurrentIdChat(chat.id);
              const messages = (await getAiSessionMessages(chat.id)).filter(msg => msg.role !== 'system');
              setChatMessages(messages);
              setShowingChats(false);
            }}
          >
            <Text style={{ color: "white" }}>Chat ID: {chat.id}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={{
        flex: 1,
        justifyContent: 'space-between',
        flexDirection: 'row',
      }}>
        {showingChats && renderStoredChats()}
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollContainer}>
            {chatMessages.map((message, i) => (
              <View
                key={i}
                style={message.role === 'assistant' ? styles.aiResponses : styles.userMessages}
              >
                <Text
                  selectable
                  selectionColor={"rgba(255, 170, 0, 0.5)"}
                  style={styles.messageText}>{message.content}</Text>
              </View>
            ))}
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
              multiline={true}
            >
            </TextInput>

            <TouchableOpacity
              onPress={() => handleSendMessage()}
              style={styles.sendButton}
            >
              <MaterialCommunityIcons name="send" size={20} color={"rgba(255, 255, 255, 1)"} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    marginHorizontal: 15,
  },
  aiResponses: {
    backgroundColor: "rgba(80, 80, 80, 1)",
    maxWidth: "70%",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    borderBottomLeftRadius: 0,
    marginVertical: 5,
  },
  userMessages: {
    backgroundColor: "rgba(100, 0, 200, 1)",
    maxWidth: "70%",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    borderBottomRightRadius: 0,
    marginVertical: 5,
    alignSelf: "flex-end",
  },
  messageText: {
    color: "white",
  },
  sendButton: {
    padding: 10,
    backgroundColor: "rgba(100, 0, 255, 1)",
    borderColor: "rgba(70, 0, 175, 1)",
    borderWidth: 1,
    borderRadius: 50,
    marginRight: 5,
    right: 0,
    position: 'absolute',
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
