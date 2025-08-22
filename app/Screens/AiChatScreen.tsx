import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AzureOpenAI } from "openai";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { addAiResponse, addUserMessage, createAiSession, getAiSessionMessages } from "../db/DaySqlLiteCRUD";

export default function AiChatScreen() {
  const [client, setClient] = useState<AzureOpenAI>();
  const [deployment, setDeployment] = useState('');
  const [currentIdChat, setCurrentIdChat] = useState(-1);
  const [chatMessages, setChatMessages] = useState<{ role: string, content: string }[]>([]);
  const [inputMessage, setInputMessage] = useState('');

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
  }

  useEffect(() => {
    configureAiChat();
  }, []);

  async function sendMessage(message: string) {
    if (client) {
      await addUserMessage(currentIdChat, message);
      const sessionMessages = await getAiSessionMessages(currentIdChat);
      console.log(currentIdChat);

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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {chatMessages.map((message, i) => (
          <View
            key={i}
            style={message.role === 'assistant' ? styles.aiResponses : styles.userMessages}
          >
            <Text style={styles.messageText}>{message.content}</Text>
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
    width: "70%",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    borderBottomLeftRadius: 0,
    marginVertical: 5,
  },
  userMessages: {
    backgroundColor: "rgba(50, 50, 50, 1)",
    width: "70%",
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
    right: 0,
  },
  input: {
    maxHeight: 100,
    width: "85%",
    margin: 5,
    color: "white",
  },
  writeMessageContainer: {
    backgroundColor: "rgba(70, 70, 70, 1)",
    borderRadius: 20,
    flexDirection: 'row',
    margin: 7,
    alignItems: 'center',
  }
});
