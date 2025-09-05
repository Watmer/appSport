import LottieView from "lottie-react-native";
import { AzureOpenAI } from "openai";
import { Image, View } from "react-native";
import loadingBrush from '../../assets/animations/loaderDrawBrush.json';
import loadingCat from '../../assets/animations/loaderCat.json';
import { getAiSessionMessages, setMessageImageUrl } from "../db/DaySqlLiteCRUD";

let imageClient: AzureOpenAI | null = null;
let imageDeployment: string | null = null;

const imageEndpoint = "https://dall-e-luis.openai.azure.com/";
const initImageDeployment = "dall-e-3-luis";
const imageApiVersion = "2024-04-01-preview";
const imageApiKey = "5re46PKdKPoWzNxJveD3XHqIUwo7mAQfOFCR23Y18lqGOAfLwwypJQQJ99BIACfhMk5XJ3w3AAABACOGVi4I";

export function getImageClient() {
  if (!imageClient) {
    imageClient = new AzureOpenAI({
      apiKey: imageApiKey,
      endpoint: imageEndpoint,
      deployment: initImageDeployment,
      apiVersion: imageApiVersion,
    });
    imageDeployment = initImageDeployment;
  }
  return { imageClient, imageDeployment };
}

export async function sendImagePrompt(
  prompt: string,
  selectedMessageId: number,
  currentIdChat: number,
) {
  const { imageClient } = getImageClient();

  await setMessageImageUrl(selectedMessageId, "loading");

  const results = await imageClient!.images.generate({
    prompt: "Crea una imagen basandote en el contenido de este mensaje:\n" + prompt,
    size: "1024x1024",
    style: "natural",
    quality: "standard",
    n: 1,
  });

  if (results.data) {
    for (const image of results.data) {
      if (image.url) {
        console.log("Image URL: " + image.url);
        await setMessageImageUrl(selectedMessageId, image.url);
        const sessionMessages = await getAiSessionMessages(currentIdChat);
        return (sessionMessages.filter(m => m.role !== "system"));
      }
    }
  } else {
    return null;
  }
}

export function renderImage(url: string) {
  if (url === "loading") {
    return (
      <View style={{
        width: "40%",
        aspectRatio: 1,
        alignSelf: "center"
      }}>
        <LottieView
          source={loadingBrush}
          autoPlay
          loop
          style={{ width: "100%", height: "100%" }}
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: url }}
      style={{
        width: "95%",
        aspectRatio: 1,
        borderRadius: 10,
        marginTop: 5,
        margin: 10,
        alignSelf: "center",
        borderColor: "rgba(255, 255, 255, 0.5)",
        borderWidth: 1,
      }}
      resizeMode="contain"
    />
  );
}
