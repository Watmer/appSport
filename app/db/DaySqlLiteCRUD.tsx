import { desc, eq, notExists } from "drizzle-orm";
import { db } from "./db";
import { aiChatSessionTable, aiMessagesTable, dayTable, ingredientsTable, mealsInAiChat, mealTable, savedRecepyTable, streakTable } from "./schema";

// Obtener info de un día (día + comidas + ingredientes)
export async function getDayInfo(dayId: string) {
  const [day] = await db.select().from(dayTable).where(eq(dayTable.id, dayId)).limit(1);
  const meals = await getMealsDayInfo(dayId);

  return {
    day: day || null,
    meals,
  };
}

export async function getMealWithIngredients(mealId: number) {
  const [meal] = await db.select().from(mealTable).where(eq(mealTable.id, mealId)).limit(1);
  const ingredients = await getMealIngredients(meal.id);
  (meal as any).ingredients = ingredients;

  return meal || null;
}

export async function getMealsDayInfo(dayId: string) {
  const meals = await db.select().from(mealTable).where(eq(mealTable.dayId, dayId));
  for (const meal of meals) {
    const ingredients = await getMealIngredients(meal.id);
    (meal as any).ingredients = ingredients;
  }
  return meals || null;
}

export async function getMealIngredients(mealId: number) {
  const ingredients = await db.select()
    .from(ingredientsTable)
    .where(eq(ingredientsTable.mealId, mealId));
  return ingredients || [];
}

export async function getMealById(mealId: number) {
  const [meal] = await db.select()
    .from(mealTable)
    .where(eq(mealTable.id, mealId));
  const ing = await getMealIngredients(mealId);
  (meal as any).ingredients = ing;
  return meal || null;
}

export async function getAllMeals() {
  const meals = await db.select().from(mealTable);
  for (const meal of meals) {
    const ing = await getMealIngredients(meal.id);
    (meal as any).ingredients = ing;
  }
  return meals || null;
}

export async function getAllDays() {
  const days = await db.select().from(dayTable);
  return days || [];
}

export async function setDayInfo(dayId: string, meals: any[]) {
  await db.insert(dayTable).values({ id: dayId }).onConflictDoNothing();

  for (const meal of meals) {
    const [inserted] = await db.insert(mealTable)
      .values({
        dayId,
        meal: meal.meal,
        foodName: meal.foodName,
        time: meal.time,
        completed: meal.completed,
        recepy: meal.recepy,
        comments: meal.comments,
      })
      .returning();

    const newMealId = inserted.id;

    // Inserta los ingredientes asociados a la nueva comida
    for (const ing of meal.ingredients || []) {
      await db.insert(ingredientsTable).values({
        mealId: newMealId,
        ingName: ing.ingName,
        quantity: ing.quantity,
      });
    }
  }
}

export async function swapDayInfo(day1Id: string, day2Id: string) {
  const day1 = await getDayInfo(day1Id);
  const day2 = await getDayInfo(day2Id);

  await removeDayInfo(day1Id);
  await removeDayInfo(day2Id);

  await setDayInfo(day1Id, day2.meals);
  await setDayInfo(day2Id, day1.meals);
}


// Eliminar info completa de un día
export async function removeDayInfo(dayId: string) {
  const meals = await db.select().from(mealTable).where(eq(mealTable.dayId, dayId));

  for (const meal of meals) {
    await db.delete(ingredientsTable).where(eq(ingredientsTable.mealId, meal.id));
  }

  await db.delete(mealTable).where(eq(mealTable.dayId, dayId));
  await db.delete(dayTable).where(eq(dayTable.id, dayId));
}

export async function removeAllDaysInfo() {
  const meals = await db.select().from(mealTable);
  for (const meal of meals) {
    await db.delete(ingredientsTable).where(eq(ingredientsTable.mealId, meal.id));
  }
  await db.delete(mealTable);
  await db.delete(dayTable);
}

export async function removeMealById(mealId: number) {
  await db.delete(ingredientsTable).where(eq(ingredientsTable.mealId, mealId));
  await db.delete(mealTable).where(eq(mealTable.id, mealId));
}

export async function updateMealById(mealId: number, mealData: {
  meal: string;
  foodName: string;
  time: number;
  completed: boolean;
  recepy: string;
  comments: string;
  ingredients: { ingName: string; quantity: string }[];
}) {
  await db.update(mealTable)
    .set({
      meal: mealData.meal,
      foodName: mealData.foodName,
      time: mealData.time,
      completed: mealData.completed ? 1 : 0,
      recepy: mealData.recepy,
      comments: mealData.comments,
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

export async function updateCompletedMealById(mealId: number, mark: boolean) {
  await db.update(mealTable)
    .set({
      completed: mark ? 1 : 0,
    })
    .where(eq(mealTable.id, mealId));
}

export async function addMealWithIngredients(dayId: string, mealData: {
  meal: string;
  foodName: string;
  time: number;
  completed: boolean;
  recepy: string;
  comments: string;
  ingredients: { ingName: string; quantity: string }[];
}) {
  // Inserta la comida y devuelve el id generado
  const [inserted] = await db.insert(mealTable)
    .values({
      dayId,
      meal: mealData.meal,
      foodName: mealData.foodName,
      time: mealData.time,
      completed: mealData.completed ? 1 : 0,
      recepy: mealData.recepy,
      comments: mealData.comments,
    })
    .returning();

  const mealId = inserted.id;

  // Inserta los ingredientes
  for (const ing of mealData.ingredients) {
    await db.insert(ingredientsTable).values({
      mealId,
      ingName: ing.ingName,
      quantity: ing.quantity,
    });
  }

  return mealId;
}

export async function exportAllInfoString() {
  const days = await db.select().from(dayTable);
  const allData = [];

  for (const day of days) {
    const meals = await getMealsDayInfo(day.id);
    allData.push({
      day,
      meals,
    });
  }

  return JSON.stringify(allData);
}

export async function importAllInfoString(dataString: string) {
  try {
    const parsed = JSON.parse(dataString);

    for (const entry of parsed) {
      const day = entry.day;
      const meals = entry.meals || [];

      await db.insert(dayTable).values(day).onConflictDoNothing();

      for (const meal of meals) {
        const ingredients = meal.ingredients || [];

        if (meal.id) {
          await db.delete(ingredientsTable).where(eq(ingredientsTable.mealId, meal.id));
        }

        await db.insert(mealTable)
          .values({
            id: meal.id,
            dayId: meal.dayId,
            meal: meal.meal,
            foodName: meal.foodName,
            time: meal.time,
            completed: meal.completed,
            recepy: meal.recepy,
            comments: meal.comments,
          })
          .onConflictDoNothing();

        for (const ing of ingredients) {
          await db.insert(ingredientsTable).values({
            mealId: meal.id,
            ingName: ing.ingName,
            quantity: ing.quantity,
          }).onConflictDoNothing();
        }
      }
    }

    return true;
  } catch (error) {
    console.error("Error al importar datos:", error);
    return false;
  }
}

export async function getAllRecepys() {
  const recepys = await db.select().from(savedRecepyTable);
  return recepys || [];
}

export async function getAllMealsInRecepys() {
  const recepys = await getAllRecepys();
  let meals = [];
  for (const recepy of recepys) {
    const meal = await getMealWithIngredients(recepy.mealId || 0);
    meals.push(meal);
  }
  return meals;
}

export async function addRecepy(mealId: number) {
  await db.insert(savedRecepyTable)
    .values({
      mealId: mealId,
    });
}

export async function removeRecepy(mealId: number) {
  await db.delete(savedRecepyTable)
    .where(eq(savedRecepyTable.mealId, mealId));
}

export async function getOrderedDays() {
  const result = await db.select({ id: dayTable.id }).from(dayTable);

  const ordered = result.sort((a, b) => {
    const parseDateFromId = (id: string) => {
      const datePart = id.replace("dayInfo:", "").trim();
      const [dayStr, monthStr, yearStr] = datePart.split("-");

      const day = parseInt(dayStr, 10);
      const month = parseInt(monthStr, 10);
      const year = parseInt(yearStr, 10);

      return Date.UTC(year, month - 1, day);
    };

    return parseDateFromId(a.id) - parseDateFromId(b.id);
  });
  return ordered;
}

export async function getLastFailedDay() {
  const result = await db.select({ id: dayTable.id })
    .from(dayTable)
    .where(eq(dayTable.isFailed, 1))
    .orderBy(desc(dayTable.id))
    .limit(1)
  return result[0] || null;
}

export async function getAllFailedDays() {
  return await db.select()
    .from(dayTable)
    .where(eq(dayTable.isFailed, 1));
}

export async function addFailedDay(dayId: string) {
  await db.update(dayTable).set({
    isFailed: 1,
    isFrozen: 0,
    isStreak: 0,
  }).where(eq(dayTable.id, dayId));
}

export async function removeFailedDay(dayId: string) {
  await db.update(dayTable).set({
    isFailed: 0,
  }).where(eq(dayTable.id, dayId));
}

export async function addStreakDay(dayId: string) {
  await db.update(dayTable).set({
    isStreak: 1,
    isFailed: 0,
    isFrozen: 0,
  }).where(eq(dayTable.id, dayId));
}

export async function removeStreakDay(dayId: string) {
  await db.update(dayTable).set({
    isStreak: 0,
  }).where(eq(dayTable.id, dayId));
}

export async function addFrozenDay(dayId: string) {
  await db.update(dayTable).set({
    isFrozen: 1,
    isFailed: 0,
    isStreak: 0,
  }).where(eq(dayTable.id, dayId));
}

export async function removeFrozenDay(dayId: string) {
  await db.update(dayTable).set({
    isFrozen: 0,
  }).where(eq(dayTable.id, dayId));
}

export async function addStreak(count: number) {
  await db.insert(streakTable).values({ id: 1, streak: count })
    .onConflictDoUpdate({
      target: streakTable.id,
      set: { streak: count }
    });
}

export async function getStreakInfo() {
  const streakResult = await db.select().from(streakTable).limit(1);
  const streak = streakResult[0]?.streak ?? 0;

  const days = await db.select().from(dayTable);

  const streakDays = days.filter(d => d.isStreak === 1).map(d => d.id);
  const frozenDays = days.filter(d => d.isFrozen === 1).map(d => d.id);
  const failedDays = days.filter(d => d.isFailed === 1).map(d => d.id);

  return {
    streak,
    streakDays,
    frozenDays,
    failedDays,
  };
}

export async function clearStreakTable() {
  await db.delete(streakTable).run();
}

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
  }));

  const messagesArray = messageRows.map(row => ({
    id: row.id,
    role: row.role as "system" | "user" | "assistant",
    content: row.content,
    jsonParsed: row.jsonParsed ?? null,
  }));

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