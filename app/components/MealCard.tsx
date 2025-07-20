import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAsyncInfo, setAsyncInfo } from "./AsyncStorageCRUD";

const { width, height } = Dimensions.get("window");

interface Ingredient {
  name: string;
  quantity: string;
}

interface MealCardProps {
  dayInfoKey: string;
  mealInfo: MealInfo[];
}

interface MealInfo {
  meal: string;
  foodName: string;
  time: number;
  ingredients: Ingredient[];
  completed: boolean;
}

const meals = ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"];

function sortMealsByOrder(mealInfo: MealInfo[]) {
  return mealInfo.slice().sort((a, b) => {
    const indexA = meals.indexOf(a.meal);
    const indexB = meals.indexOf(b.meal);
    return indexA - indexB;
  });
}

export default function MealCard({ dayInfoKey, mealInfo }: MealCardProps) {
  const navigation = useNavigation();

  const mealsArray = Array.isArray(mealInfo) ? sortMealsByOrder(mealInfo) : [mealInfo];
  const [completedStates, setCompletedStates] = useState<boolean[]>(() =>
    mealsArray.map(m => m.completed)
  );

  const toggleCompleted = async (index: number) => {
    try {
      const saved = await getAsyncInfo({ keyPath: dayInfoKey });
      if (!saved) {
        console.warn("No hay comidas guardadas para actualizar.");
        return;
      }

      const mealsArray: MealInfo[] = Array.isArray(saved) ? saved : JSON.parse(saved);
      const sortedMeals = sortMealsByOrder(mealsArray);
      sortedMeals[index].completed = !sortedMeals[index].completed;

      setCompletedStates(sortedMeals.map(m => m.completed));
      await setAsyncInfo({ keyPath: dayInfoKey, info: sortedMeals });

    } catch (err) {
      console.error("Error updating completion status:", err);
    }
  };

  const handleCardPress = async (meal: any) => {
    (navigation as any).navigate("FoodDetailScreen", { dayInfoKey, meal });
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
            <TouchableOpacity
              key={mealType}
              onPress={() => handleCardPress(mealType)}
            >
              <View style={styles.groupCardTitle}>
                <Text style={styles.groupCardTitleText}>{mealType}</Text>
              </View>

              {groupedMeals[mealType].map((mealInf, index) => (
                <View style={styles.groupCardInfo} key={index}>
                  <View style={styles.cardInfo}>
                    <View style={{ flexDirection: "row", marginBottom: 5 }}>
                      <TouchableOpacity onPress={() => toggleCompleted(index)}>
                        <MaterialCommunityIcons
                          name={completedStates[index] ? "checkbox-marked" : "checkbox-blank-outline"}
                          size={25}
                          color="rgba(255, 200, 0, 1)"
                        />
                      </TouchableOpacity>
                      <Text style={[styles.titleText, { marginLeft: 10 }]}>
                        {mealInf.foodName}
                      </Text>
                    </View>

                    <Text style={styles.text}>⏱ {mealInf.time} min</Text>

                    <Text style={[styles.text, { marginTop: 10 }]}>Ingredientes:</Text>
                    {mealInf.ingredients.map((ing, i) => (
                      <Text key={i} style={styles.text}>
                        • {ing.name} ({ing.quantity})
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
  dashboardContainer: {
    flex: 1,
    maxWidth: height / 1.5,
    maxHeight: height / 1,
    backgroundColor: "rgba(100, 100, 100, 1)",
    borderRadius: 15,
    marginBottom: 20,
    padding: 10,
    alignSelf: "flex-end",
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "rgba(255, 255, 255, 1)",
    textAlign: "center",
    marginBottom: 10,
  },
  dashboardInfo: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
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
    maxWidth: 500,
    minHeight: 100,
    maxHeight: 400,
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
    backgroundColor: "rgba(60, 80, 145, 1)",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  titleText: {
    fontSize: 20,
    color: "rgba(255, 255, 255, 1)",
    fontWeight: "bold",
    textAlign: "center",
  },
  text: {
    fontSize: 20,
    color: "rgb(255, 255, 255)",
  },


  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dayLabel: {
    color: "white",
    fontWeight: "bold",
  },
  dayCircle: {
    width: "90%",
    height: "90%",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(70, 70, 70, 1)",
  },
  todayCircle: {
    backgroundColor: "orange",
  },
  dayText: {
    color: "white",
    fontWeight: "bold",
  },
});