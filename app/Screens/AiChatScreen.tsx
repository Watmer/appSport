import { AzureOpenAI } from "openai";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { addAiResponse, addUserMessage, createAiSession, getAiSessionMessages } from "../db/DaySqlLiteCRUD";

export default function AiChatScreen() {
  const [client, setClient] = useState<AzureOpenAI>();
  const [deployment, setDeployment] = useState('');
  const [currentIdChat, setCurrentIdChat] = useState(-1);
  const [assistantMessage, setAssistantMessage] = useState('');

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
  }

  useEffect(() => {
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
        setAssistantMessage(assistantMessage);
      }
    }
  }

  return (
    <ScrollView>
      <View>
        <TouchableOpacity onPress={() => sendMessage("dime que puedo cambiar en una ensalada con arroz y calabacin, que ingrediente puedo usar en vez del calabacin.")} style={{ padding: 10, backgroundColor: "rgba(50, 0, 255, 1)" }}>
          <Text>Enviar mensaje</Text>
        </TouchableOpacity>
        <Text>{assistantMessage}</Text>
      </View>
    </ScrollView>
  );
}

const style = StyleSheet.create({
  scrollContainer: {
  },
});