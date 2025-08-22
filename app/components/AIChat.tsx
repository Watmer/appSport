import dotenv from "dotenv";
import { AzureOpenAI } from "openai";

dotenv.config();

export async function configureAiChat() {
  // Configuración
  const endpoint =
    process.env["AZURE_OPENAI_ENDPOINT"] ||
    "https://luis-ia-gpt-modelo.openai.azure.com/";
  const apiKey =
    process.env["AZURE_OPENAI_KEY"] ||
    "6BeNNxizarSJhZkFRkwgIXogsXzBP6pxIbQfdDLuQBNB1qDYwFFgJQQJ99BHACfhMk5XJ3w3AAABACOGJ8Sr";
  const apiVersion = "2025-01-01-preview";
  const deployment = "gpt-4.1-mini"; // Este debe coincidir con el nombre de tu deployment en Azure

  // Inicializar cliente
  const client = new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion,
  });

  // Llamada al modelo
  const result = await client.chat.completions.create({
    model: deployment, 
    messages: [
      {
        role: "system",
        content:
          "Estoy siguiendo una dieta, y quiero que en base a la receta que tengo que seguir hoy, me propongas alternativas con valores nutricionales (calorías, proteínas, grasas e hidratos de carbono) similares. Estas alternativas deben tener en cuenta los ingredientes que te indicaré.\nIndica una alternativa de cada vez, y pregunta si  se quiere alguna otra sugerencia. Si no se indican ingredientes de base, propón tú los que consideres, y pregunta si se desea especificar alguno en concreto.",
      },
      {
        role: "user",
        content:
          "Hoy toca comer Espagetis con verduras al estilo chino, cuyos ingredientes son medio brócoli, una cebolla, un diente de ajo, dos zanahorias, 1 cucharadita de salsa de soja y trigo (shoyu), dos cucharadas de aceite de oliva y 200 gramos de pasta. Por favor, que la receta se base en arroz, verduras y filete de ternera.",
      },
    ],
    max_tokens: 1024, 
    temperature: 0.7,
    top_p: 0.95,
  });

  console.log(JSON.stringify(result, null, 2));
}

configureAiChat().catch((err) => {
  console.error("The sample encountered an error:", err);
});
