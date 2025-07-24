import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAsyncInfo, setAsyncInfo } from "./AsyncStorageCRUD";

import { getDayInfo, setDayInfo, updateMealById } from "../db/DaySqlLiteCRUD";


const { width, height } = Dimensions.get("window");

interface Ingredient {
  ingName: string;
  quantity: string;
}

interface MealInfo {
  id: number;
  meal: string;
  foodName: string;
  time: number;
  ingredients: Ingredient[];
  completed: number;
  recepy: string;
  comments: string;
}

interface MealCardProps {
  dayInfoKey: string;
  refreshTrigger?: number
}

const meals = ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"];

function sortMealsByOrder(mealInfo: any[]) {
  return mealInfo.slice().sort((a, b) => {
    const indexA = meals.indexOf(a.meal);
    const indexB = meals.indexOf(b.meal);
    return indexA - indexB;
  });
}

export default function MealCard({ dayInfoKey, refreshTrigger }: MealCardProps) {
  const navigation = useNavigation();
  const [mealsArray, setMealsArray] = useState<MealInfo[]>([]);

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    const dayData = await getDayInfo(dayInfoKey);
    if (dayData?.meals) {
      const sorted = sortMealsByOrder(dayData.meals);
      setMealsArray(sorted);
    }
  };

  const toggleCompleted = async (index: number) => {
    const updatedMeals = [...mealsArray];
    const mealToUpdate = updatedMeals[index];

    if (mealToUpdate.id === undefined) {
      console.error("Error: El ID de la comida es undefined.");
      return;
    }
    mealToUpdate.completed = mealToUpdate.completed ? 0 : 1;

    await updateMealById(mealToUpdate.id, {
      ...mealToUpdate,
      completed: mealToUpdate.completed === 1,
    });
    setMealsArray(updatedMeals);
  };

  const handleCardPress = (mealType: string) => {
    (navigation as any).navigate("FoodDetailScreen", { dayInfoKey, mealType });
  };

  const groupedMeals: { [mealType: string]: MealInfo[] } = {};
  mealsArray.forEach((item) => {
    if (!groupedMeals[item.meal]) groupedMeals[item.meal] = [];
    groupedMeals[item.meal].push(item);
  });

  const mealTypesSorted = Object.keys(groupedMeals).sort(
    (a, b) => meals.indexOf(a) - meals.indexOf(b)
  );

  return (
    <>
      {mealTypesSorted.map((mealType) => (
        <View key={mealType} style={styles.cardContainer}>
          <View style={styles.groupCard}>
            <TouchableOpacity onPress={() => handleCardPress(mealType)}>
              <View style={styles.groupCardTitle}>
                <Text style={styles.groupCardTitleText}>{mealType}</Text>
              </View>

              {groupedMeals[mealType].map((mealInf, index) => (
                <View style={styles.groupCardInfo} key={index}>
                  <View style={styles.cardInfo}>
                    <View
                      style={{
                        paddingBottom: 5,
                        borderBottomWidth: 1,
                        borderBottomColor: "rgba(255, 255, 255, 1)",
                      }}
                    >
                      <View style={{ flexDirection: "row" }}>
                        <TouchableOpacity
                          onPress={() =>
                            toggleCompleted(
                              mealsArray.findIndex((meal) => meal.id === mealInf.id)
                            )
                          }
                        >
                          <MaterialCommunityIcons
                            name={mealInf.completed ? "checkbox-marked" : "checkbox-blank-outline"}
                            size={28}
                            color="rgba(255, 200, 0, 1)"
                          />
                        </TouchableOpacity>
                        <Text style={styles.titleText}>
                          {mealInf.foodName}
                        </Text>
                      </View>
                      <Text style={styles.text}>⏱ {mealInf.time} min</Text>
                    </View>

                    <Text
                      style={[styles.text, { marginTop: 10, fontWeight: "600" }]}
                    >
                      Ingredientes:
                    </Text>
                    {mealInf.ingredients.map((ing, i) => (
                      <Text key={i} style={styles.text}>
                        • {ing.ingName} ({ing.quantity})
                      </Text>
                    ))}
                  </View>
                </View>
              ))}
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "rgba(120, 120, 120, 1)",
  },
  container: {
    flex: 1,
    marginTop: 20,
    marginHorizontal: 15,
    flexWrap: "wrap-reverse",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 10,
  },
  cardsContainer: {
    marginTop: 10,
    gap: 10,
    alignItems: "center",
  },
  cardContainer: {
    justifyContent: "center",
    backgroundColor: "rgba(150, 150, 150, 1)",
    borderRadius: 15,
    minWidth: 350,
    maxWidth: 350,
    minHeight: 100,
  },
  groupCard: {
    margin: 10,
    gap: 10,
  },
  groupCardTitle: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  groupCardTitleText: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 24,
    fontWeight: "bold",
    alignSelf: "center",
    margin: 5,
  },
  groupCardInfo: {
    padding: 5,
  },
  cardInfo: {
    width: "100%",
    minHeight: 100,
    backgroundColor: "rgba(35, 80, 120, 1)",
    borderRadius: 10,
    justifyContent: "center",
    padding: 15,
  },
  titleText: {
    fontSize: 20,
    color: "rgba(255, 255, 255, 1)",
    fontWeight: "800",
    width: "85%",
    marginLeft: 10,
  },
  text: {
    fontSize: 18,
    color: "rgb(255, 255, 255)",
  },
});