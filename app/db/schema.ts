import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const dayTable = sqliteTable("day_table", {
  id: text().primaryKey(),
});

export const mealTable = sqliteTable("meal_table", {
  id: int().primaryKey({ autoIncrement: true }),
  dayId: text().references(() => dayTable.id),
  meal: text(),
  foodName: text(),
  time: int(),
  completed: int(),
  recepy: text(),
  comments: text(),
});

export const ingredientsTable = sqliteTable("ingredients_table", {
  id: int().primaryKey({ autoIncrement: true }),
  mealId: int().references(() => mealTable.id),
  ingName: text(),
  quantity: text(),
});

export const savedRecepyTable = sqliteTable("savedRecepy_table", {
  id: int().primaryKey({ autoIncrement: true }),
  mealId: int().references(() => mealTable.id),
});

export const shopListTable = sqliteTable("shopList_table", {
  id: int().primaryKey({ autoIncrement: true }),
});

export const shopItemTable = sqliteTable("shopItem_table", {
  id: int().primaryKey({ autoIncrement: true }),
  shopListId: int().references(() => shopListTable.id),
  itemName: text(),
  completed: int(),
});
