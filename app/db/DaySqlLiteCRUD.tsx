import { get } from "http";
import { db } from "./db";
import { dayTable, mealTable, ingredientsTable } from "./schema";
import { eq } from "drizzle-orm";

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
  const ingredients = await db
    .select()
    .from(ingredientsTable)
    .where(eq(ingredientsTable.mealId, mealId));
  return ingredients || [];
}

export async function getAllDays() {
  const days = await db.select().from(dayTable);
  return days || [];
}

// Guardar info de un día con comidas e ingredientes
export async function setDayInfo(dayId: string, meals: any[]) {
  // Asegura que el día exista en la tabla de días (no lo sobrescribe si ya existe)
  await db.insert(dayTable).values({ id: dayId }).onConflictDoNothing();

  for (const meal of meals) {
    // Inserta siempre una nueva comida con el dayId correcto
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


// Eliminar info completa de un día
export async function removeDayInfo(dayId: string) {
  const meals = await db.select().from(mealTable).where(eq(mealTable.dayId, dayId));

  for (const meal of meals) {
    await db.delete(ingredientsTable).where(eq(ingredientsTable.mealId, meal.id));
  }

  await db.delete(mealTable).where(eq(mealTable.dayId, dayId));
  await db.delete(dayTable).where(eq(dayTable.id, dayId));
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
