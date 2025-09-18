import { desc, eq, notExists } from "drizzle-orm";
import { db } from "../db";
import { aiChatSessionTable, aiImagesTable, aiMessagesTable, ingredientsTable, mealsInAiChat, mealTable } from "../schema";

export async function createAiSession() {
  await db.delete(aiChatSessionTable).where(
    notExists(
      db.select()
        .from(aiMessagesTable)
        .where(eq(aiMessagesTable.aiChatId, aiChatSessionTable.id))
    )
  );

  const [initialMessage] = await db.insert(aiChatSessionTable).values({
    createdAt: Date.now(),
    systemRole: 'system',
    systemMessage: `
Eres un asistente nutricional.

Objetivo:
- A partir de una receta indicada por el usuario, sugiere alternativas con valores nutricionales (calorías, proteínas, grasas e hidratos de carbono) similares.  
- Si no se indican ingredientes base, proponlos tú. Pregunta si el usuario quiere concretar alguno.  
- El usuario puede darte ingredientes disponibles o prohibidos: respétalo en las siguientes sugerencias.  

Formato de salida (OBLIGATORIO):
1. Cada respuesta debe contener dos partes diferenciadas:
   - [RESPUESTA] → Texto normal para el usuario.  
   - [JSON] → Objeto JSON válido.

Reglas JERÁRQUICAS (cumple en este orden de prioridad):  
1. Si el **usuario envía un JSON en su mensaje**, RESPONDE usando **EXACTAMENTE los mismos campos que aparezcan en ese JSON** (aunque no coincidan con el formato estándar).
   - No incluyas el bloque [JSON] si no has proporcionado una receta, o si el json que vas a dar no podria considerarse una receta, por ejemplo que solo tuviera comentario y nada mas, en esos casos no mandes ningun [JSON].
   - Mantén los nombres de los campos y los valores que te mande el usuario.  
   - Si hay un campo id, repite el mismo valor.  
   - No inventes campos que no estaban en el JSON del usuario.  
   - Cuando termines esa respuesta, vuelve a usar el formato estándar en los siguientes mensajes.  
   
2. Si el usuario **no envía JSON**, usa SIEMPRE el formato estándar siguiente:  
   [JSON] 
   { 
   "meal": string, // Desayuno, Almuerzo, Comida, Merienda, Cena. Pero no uses Almuerzo a menos que el usuario lo pida expresamente. 
   "foodName": string, 
   "time": number, // en minutos 
   "completed": 0 | 1, 
   "recepy": string, 
   "comments": string, 
   "ingredients": [
    { 
      "ingName": string, 
      "quantity": string 
    }
   ] 
  }

Reglas adicionales:
- No mezcles el JSON con el texto.  
- No uses negritas ni otro formato en [RESPUESTA].  
- El bloque [JSON] debe ser válido, sin comas finales.  
- No incluyas el bloque [JSON] si no hay receta, si todos los campos serían null, o si has dado varias opciones y no sabes cuál elige el usuario.
- Si falta un dato, usa null.  
- En [RESPUESTA], si das receta incluye lista de ingredientes y resumen nutricional.
- Solo se permiten estos valores para meal: Desayuno, Almuerzo, Comida, Merienda, Cena.  
- No inventes otros valores de meal aunque el usuario escriba algo distinto.  
- Usa Almuerzo únicamente si el usuario lo pide explícitamente.

Ejemplos de salida:

Ejemplo 1 → El usuario pide una receta concreta (sin id):  
[RESPUESTA]  
Una alternativa saludable puede ser una ensalada de garbanzos con verduras frescas. 
Suele prepararse en unos 60 minutos y es una opción ligera, rica en proteínas y con bajo contenido en grasas.

Ingredientes necesarios:
- 150g de garbanzos cocidos
- 100g de tomate
- 80g de pepino
Valor nutricional aproximado:
- Calorías: 420 kcal
- Proteínas: 21g
- Grasas: 8g
- Hidratos de carbono: 60g

Para prepararla, mezcla los garbanzos cocidos con las verduras frescas y aliña al gusto.
Si quieres, puedo sugerirte más recetas similares.
¿Quieres que te sugiera alguna otra receta?  

[JSON]  
{
  "meal": "Comida",
  "foodName": "Ensalada de garbanzos",
  "time": 60,
  "completed": 0,
  "recepy": "Mezclar garbanzos cocidos con verduras frescas y aliñar al gusto",
  "comments": "Opción ligera, rica en proteínas y con bajo contenido en grasas",
  "ingredients": [
    { "ingName": "Garbanzos cocidos", "quantity": "150g" },
    { "ingName": "Tomate", "quantity": "100g" },
    { "ingName": "Pepino", "quantity": "80g" }
  ]
}

Ejemplo 2 → El usuario envía un JSON con id:  
[RESPUESTA]  
Una opción deliciosa es la ensalada de pasta con tomate y espinaca.  
Se prepara en unos 15 minutos y combina carbohidratos complejos con proteínas magras y grasas saludables.  
Es un plato equilibrado para una cena ligera.

Ingredientes necesarios:
- 140g de pasta integral  
- 1 tomate  
- 50g de espinaca fresca  
- 2 cucharadas de albahaca fresca  
- 25g de aceitunas  
- 20g de pepinillos  
- 1 cucharada de orégano seco  
- 1 cucharada de aceite de oliva  
- 1/2 cucharadita de vinagre de vino  
- 150g de pechuga de pollo  

Valor nutricional aproximado:
- Calorías: 620 kcal  
- Proteínas: 45g  
- Grasas: 16g  
- Hidratos de carbono: 72g  

Para prepararla, cocina la pasta, enfríala bajo el grifo y mézclala con los ingredientes frescos.  
¿Quieres que te sugiera otra alternativa similar?  

[JSON]  
{
  "id": 462,
  "dayId": "dayInfo:2-9-2025",
  "meal": "Cena",
  "foodName": "Ensalada de pasta con tomate y espinaca",
  "time": 15,
  "completed": 0,
  "recepy": "1. Hervir la pasta con sal y un chorrito de aceite.\\n2. Mezclar los tomates picados, albahaca, aceitunas, pepinillos, espinaca, orégano, aceite y vinagre.\\n3. Enfriar la pasta bajo el grifo y mezclar con lo anterior.",
  "comments": "Se cambia rúcula por espinaca, similar sabor y nutrientes",
  "ingredients": [
    { "id": 1193, "mealId": 462, "ingName": "Pasta integral", "quantity": "140gr" },
    { "id": 1194, "mealId": 462, "ingName": "Tomate", "quantity": "1" },
    { "id": 1195, "mealId": 462, "ingName": "Espinaca fresca", "quantity": "50gr" },
    { "id": 1196, "mealId": 462, "ingName": "Albahaca fresca", "quantity": "2 cucharadas" },
    { "id": 1197, "mealId": 462, "ingName": "Aceitunas", "quantity": "25gr" },
    { "id": 1198, "mealId": 462, "ingName": "Pepinillos", "quantity": "20gr" },
    { "id": 1199, "mealId": 462, "ingName": "Orégano seco", "quantity": "1 cucharada" },
    { "id": 1200, "mealId": 462, "ingName": "Aceite de oliva", "quantity": "1 cucharada" },
    { "id": 1201, "mealId": 462, "ingName": "Vinagre de vino", "quantity": "1/2 cucharadita" },
    { "id": 1202, "mealId": 462, "ingName": "Pechuga de pollo", "quantity": "150gr" }
  ]
}

Ejemplo 3 → El usuario no pide receta, solo consejos:  
[RESPUESTA]  
Claro, puedes mantener una buena hidratación, hacer ejercicio moderado 3 veces por semana y seguir una dieta variada. ¿Quieres que te sugiera algunas recetas saludables?
`
  }).returning();
  return initialMessage.id;
}

export async function deleteAiSession(id: number) {
  await db.delete(aiChatSessionTable).where(eq(aiChatSessionTable.id, id));
  await db.delete(aiMessagesTable).where(eq(aiMessagesTable.aiChatId, id));
}

export async function deleteSelectedMessages(messageIds: number[]) {
  for (const messageId of messageIds) {
    await db.delete(aiMessagesTable).where(eq(aiMessagesTable.id, messageId));
  }
}

export async function deleteMessageById(messageId: number) {
  await db.delete(aiMessagesTable).where(eq(aiMessagesTable.id, messageId));
}

export async function addUserMessage(chatId: number, message: string, mealInfo?: any) {
  let jsonMessage = null;
  if (mealInfo) {
    jsonMessage = `${JSON.stringify(mealInfo)}`

    console.log(jsonMessage);
  }
  const [messageInfo] = await db.insert(aiMessagesTable).values({
    aiChatId: chatId,
    role: 'user',
    message: message,
    jsonParsed: jsonMessage
  }).returning();

  return messageInfo;
}

export async function addAiResponse(chatId: number, response: string) {
  const responseText = response.split('[JSON]')[0]?.replace('[RESPUESTA]', '').trim() || response;
  const responseJson = response.split('[JSON]')[1]?.trim() || null;

  console.log("\nAI Response Text:", responseText);
  console.log("\nAI Response JSON:", responseJson);
  console.log("\nFull AI Response:", response);

  await db.insert(aiMessagesTable).values({
    aiChatId: chatId,
    role: 'assistant',
    message: responseText,
    jsonParsed: responseJson,
  })

  const savedResponse = await db.select().from(aiMessagesTable).where(eq(aiMessagesTable.aiChatId, chatId)).orderBy(desc(aiMessagesTable.id)).limit(1);
  console.log("Saved AI Response:", savedResponse);
}

export async function addAskAboutMessage(chatId: number, mealInfo: any) {
  let messageToAsk = "";
  messageToAsk = `
Detalles de la receta:
#${mealInfo.meal}
- ${mealInfo.foodName}
- Tiempo de preparación: 
${mealInfo.time ? mealInfo.time % 60 + " minutos" : "No disponible"}
${mealInfo.comments ? `- Comentarios: ${mealInfo.comments}\n` : ''}
Ingredientes necesarios:
${mealInfo.ingredients && mealInfo.ingredients.map((ing: any) => `- ${ing.ingName}: ${ing.quantity}`).join("\n")}
${mealInfo.recepy ? `\n- Preparacion:\n${mealInfo.recepy}` : ''}
`;

  const messageInfo = await addUserMessage(chatId, messageToAsk.trim(), mealInfo);
  await addMealIdToChat(mealInfo.id, chatId, messageInfo.id);
}

export async function getMessageImageUrl(messageId: number) {
  const images = await db
    .select({ imageUrl: aiImagesTable.imageUrl })
    .from(aiImagesTable)
    .where(eq(aiImagesTable.messageId, messageId))
    .orderBy(desc(aiImagesTable.id))
    .limit(1);

  return images.length > 0 ? images[0].imageUrl : null;
}

export async function setMessageImageUrl(messageId: number, imageUrl: string) {
  await db.insert(aiImagesTable).values({
    messageId: messageId,
    imageUrl: imageUrl,
  })
}

export async function removeMessageImageUrl(messageId: number) {
  await db.delete(aiImagesTable)
    .where(eq(aiImagesTable.messageId, messageId));
};

export async function getAiSessionMessages(id: number) {
  const systemRows = await db
    .select({
      id: aiChatSessionTable.id,
      role: aiChatSessionTable.systemRole,
      content: aiChatSessionTable.systemMessage,
    })
    .from(aiChatSessionTable)
    .where(eq(aiChatSessionTable.id, id));

  const messageRows = await db
    .select({
      id: aiMessagesTable.id,
      role: aiMessagesTable.role,
      content: aiMessagesTable.message,
      jsonParsed: aiMessagesTable.jsonParsed,
    })
    .from(aiMessagesTable)
    .where(eq(aiMessagesTable.aiChatId, id))
    .orderBy(aiMessagesTable.id)
    .limit(100);

  const systemArray = systemRows.map(row => ({
    id: row.id,
    role: row.role as "system" | "user" | "assistant",
    content: row.content,
    jsonParsed: null,
    imageUrl: null,
  }));

  const messagesArray = [];
  for (const row of messageRows) {
    const lastImageUrl = await getMessageImageUrl(row.id);

    messagesArray.push({
      id: row.id,
      role: row.role as "system" | "user" | "assistant",
      content: row.content,
      jsonParsed: row.jsonParsed ?? null,
      imageUrl: lastImageUrl,
    });
  }

  return [...systemArray, ...messagesArray];
}

export async function getAllAiSessions() {
  const sessions = await db
    .select()
    .from(aiChatSessionTable)
    .orderBy(desc(aiChatSessionTable.id));

  if (!sessions) return [];

  const sessionsWithHasMessages = [];
  for (const session of sessions) {
    const messages = await getAiSessionMessages(session.id);
    sessionsWithHasMessages.push({
      ...session,
      hasMessages: messages.some(msg => msg.role !== "system"),
    });
  }

  return sessionsWithHasMessages;
}

export async function updateAiChatMealById(mealId: number, mealData: {
  meal: string;
  foodName: string;
  time: number;
  completed: boolean;
  recepy: string;
  comments: string;
  ingredients: { ingName: string; quantity: string }[];
}, dayId?: string) {
  await db.update(mealTable)
    .set({
      meal: mealData.meal,
      foodName: mealData.foodName,
      time: mealData.time,
      completed: mealData.completed ? 1 : 0,
      recepy: mealData.recepy,
      comments: mealData.comments,
      dayId: dayId
    })
    .where(eq(mealTable.id, mealId));

  // Borrar ingredientes anteriores y agregar los nuevos
  await db.delete(ingredientsTable).where(eq(ingredientsTable.mealId, mealId));

  for (const ing of mealData.ingredients || []) {
    await db.insert(ingredientsTable).values({
      mealId,
      ingName: ing.ingName,
      quantity: ing.quantity,
    });
  }
  return mealId;
}

export async function addMealIdToChat(mealId: number, aiChatId: number, messageId: number) {
  await db.insert(mealsInAiChat).values({
    mealId: mealId,
    aiChatId: aiChatId,
    messageId: messageId
  })
}

export async function removeMealIdFromChat(mealId: number, aiChatId: number, messageId: number) {
  await db.delete(mealsInAiChat).where(eq(mealsInAiChat.mealId, mealId) && eq(mealsInAiChat.aiChatId, aiChatId) && eq(mealsInAiChat.messageId, messageId));
}