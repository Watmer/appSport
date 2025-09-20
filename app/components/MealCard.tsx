import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { requestWidgetUpdate } from "react-native-android-widget";
import { getDayInfo, updateMealById } from "../db/CRUD/DayMealsCRUD";
import { addRecepy, getAllRecepys, removeRecepy } from "../db/CRUD/RecepyMealsCRUD";

import { eventBus } from "../utils/EventBus";
import { TodayMealsWidget } from "../utils/Widget";

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
  refreshTrigger?: number;
  isTodayMeal?: boolean;
}

const meals = ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"];

function sortMealsByOrder(mealInfo: any[]) {
  return mealInfo.slice().sort((a, b) => meals.indexOf(a.meal) - meals.indexOf(b.meal));
}

export default function MealCard({ dayInfoKey, refreshTrigger, isTodayMeal }: MealCardProps) {
  const navigation = useNavigation();
  const [mealsArray, setMealsArray] = useState<MealInfo[]>([]);
  const [recepysArray, setRecepysArray] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    const dayData = await getDayInfo(dayInfoKey);
    if (dayData?.meals) {
      const sorted = sortMealsByOrder(dayData.meals);
      setMealsArray(sorted);
    }
    setRecepysArray(await getAllRecepys());

    if (isTodayMeal) {
      await updateWidgetInfo();
    }
  };

  async function updateWidgetInfo() {
    await requestWidgetUpdate({
      widgetName: 'TodayMeals',
      renderWidget: () => <TodayMealsWidget widgetInfo={{ meals: mealsArray }} />,
      widgetNotFound: () => { },
    });
  }

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
    eventBus.emit('REFRESH_HOME');

    if (isTodayMeal) {
      updateWidgetInfo();
    }
  };

  const handleCardPress = (mealType: string) => {
    (navigation as any).navigate("FoodDetailScreen", { dayInfoKey, mealType });
  };

  const isInRecepys = (mealId: number) => {
    return recepysArray.find((recepy) => recepy.mealId === mealId);
  };

  const toggleInRecepys = async (mealId: number) => {
    if (isInRecepys(mealId)) {
      await removeRecepy(mealId);
    } else {
      await addRecepy(mealId);
    }
    loadData();
    eventBus.emit('REFRESH_HOME');
  };

  const renderMealGroup = (title: string, items: MealInfo[]) => (
    <View key={title} style={styles.cardContainer}>
      <View style={styles.groupCard}>
        <TouchableOpacity activeOpacity={0.6} onPress={() => handleCardPress(title)}>
          <View style={styles.groupCardTitle}>
            <Text style={styles.groupCardTitleText}>{title}</Text>
          </View>

          {items.map((mealInf) => (
            <View style={styles.groupCardInfo} key={mealInf.id}>
              <View style={styles.cardInfo}>
                <View
                  style={{
                    paddingBottom: 5,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(255, 255, 255, 1)",
                  }}
                >
                  <View style={{ flexDirection: "row", marginRight: 25 }}>
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
                    <Text style={styles.titleText}>{mealInf.foodName}</Text>
                    <TouchableOpacity
                      onPress={() => toggleInRecepys(mealInf.id)}
                    >
                      <MaterialCommunityIcons
                        name={isInRecepys(mealInf.id) ? "bookmark" : "bookmark-outline"}
                        size={30}
                        color={
                          isInRecepys(mealInf.id)
                            ? "rgba(220, 50, 50, 1)"
                            : "rgba(255, 255, 255, 0.6)"
                        }
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.text}>⏱ {mealInf.time} min</Text>
                </View>

                <Text style={[styles.text, { marginTop: 10, fontWeight: "600" }]}>
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
  );

  const uncompleted = mealsArray.filter((m) => !m.completed);
  const completed = mealsArray.filter((m) => m.completed);

  return (
    <>
      {meals.map((mealType) => {
        const uncompletedMeals = uncompleted.filter((m) => m.meal === mealType);
        return uncompletedMeals.length > 0 && renderMealGroup(mealType, uncompletedMeals);
      })}
      {meals.map((mealType) => {
        const completedMeals = completed.filter((m) => m.meal === mealType);
        return completedMeals.length > 0 && renderMealGroup(mealType, completedMeals);
      })}
    </>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    justifyContent: "center",
    backgroundColor: "rgba(90, 90, 90, 1)",
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
    backgroundColor: "rgba(0, 60, 90, 1)",
    borderRadius: 10,
    justifyContent: "center",
    padding: 15,
    borderWidth: 0.4,
    borderColor: "rgba(0, 0, 0, 0.4)",
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