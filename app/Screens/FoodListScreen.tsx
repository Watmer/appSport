import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { Alert, Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { RefreshControl } from "react-native-gesture-handler";
import MealCard from "../components/MealCard";
import { getDayInfo, setDayInfo, swapDayInfo } from "../db/DaySqlLiteCRUD";
import { eventBus } from "../utils/EventBus";

const { width, height } = Dimensions.get("window");

const meals = ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"];

export default function FoodListScreen({ route }: { route: any }) {
  const { dayInfoKey } = route.params || {};
  const navigation = useNavigation();

  const [selectedDaysToRepeat, setSelectedDaysToRepeat] = useState<string[]>([]);
  const [selectedDayToSwap, setSelectedDayToSwap] = useState<string>();
  const [selectedFoods, setSelectedFoods] = useState<number[]>([]);

  const [isRepeatModalVisible, setIsRepeatModalVisible] = useState(false);
  const [isSwapModalVisible, setIsSwapModalVisible] = useState(false);

  const [mealInfo, setMealInfo] = useState<any[]>([]);
  const [mealSwapInfo, setMealSwapInfo] = useState<any>(null)

  const today = new Date();
  const currentDay = today.getDate();

  const defaultKey = `dayInfo:${currentDay}-${today.getMonth() + 1}-${today.getFullYear()}`;
  const keyToUse: string = dayInfoKey || defaultKey;

  const [useDay, useMonth, useYear] = keyToUse.slice().replace(`dayInfo:`, "").split("-");

  const [visibleMonth, setVisibleMonth] = useState(parseInt(useMonth) - 1);
  const [visibleYear, setVisibleYear] = useState(parseInt(useYear));
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const startDate = new Date(visibleYear, visibleMonth, 1);
  startDate.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7));

  const dates = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return {
      day,
      month,
      year,
      key: `${day}-${month}-${year}`,
      isCurrentMonth: month === visibleMonth + 1 && year === visibleYear,
      isToday: day === parseInt(useDay) && month === parseInt(useMonth) && year === parseInt(useYear),
    };
  });

  const weeks = Array.from({ length: 6 }, (_, i) => dates.slice(i * 7, i * 7 + 7));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDayInfo();
    setRefreshTrigger((prev) => prev + 1);
    setRefreshing(false);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={{ marginLeft: 20 }}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={30} color="rgba(255, 170, 0, 1)" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginLeft: 20 }}
            onPress={() => setIsSwapModalVisible(true)}
          >
            <MaterialCommunityIcons name="swap-horizontal" size={30} color="rgba(255, 170, 0, 1)" />
          </TouchableOpacity>
        </View>
      ),
      headerRight: () => (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={{ marginRight: 20 }}
            onPress={() => setIsRepeatModalVisible(true)}
          >
            <MaterialCommunityIcons name="repeat-variant" size={30} color="rgba(255, 170, 0, 1)" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginRight: 20 }}
            onPress={() => (navigation as any).navigate("AddFoodScreen", { dayInfoKey: keyToUse })}
          >
            <MaterialCommunityIcons name="plus" size={30} color="rgba(255, 170, 0, 1)" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, keyToUse]);

  const fetchDayInfo = async () => {
    try {
      const data = await getDayInfo(keyToUse);
      if (!data) {
        setMealInfo([]);
      } else {
        setMealInfo(data.meals);
      }
    } catch (error) {
      console.error("Error fetching meals from DB:", error);
      setMealInfo([]);
    }
  };

  useEffect(() => {
    fetchDayInfo();
  }, [keyToUse]);

  const renderMealCards = () => {
    if (!mealInfo[0]) {
      return (
        <View style={styles.cardInfo}>
          <Text style={styles.text}>
            No hay comidas registradas en esta fecha.
          </Text>
        </View>
      );
    };
    return (
      <MealCard
        key={keyToUse}
        dayInfoKey={keyToUse}
        refreshTrigger={refreshTrigger}
      />
    );
  };

  const repeatMeals = async (selectedDateKeys: string[]) => {
    try {
      const data = await getDayInfo(keyToUse);

      const filteredMeals = data.meals.filter(meal =>
        selectedFoods.includes(meal.id)
      );

      for (const dateKey of selectedDateKeys) {
        await setDayInfo(`dayInfo:${dateKey}`, filteredMeals);
      }

      eventBus.emit('REFRESH_HOME');

      Alert.alert("Comidas repetidas correctamente.");
    } catch (error) {
      console.error("Error repitiendo comidas:", error);
      Alert.alert("Error repitiendo comidas.");
    }
  };

  const swapDays = async (selectedDateKey: string) => {
    try {
      await swapDayInfo(keyToUse, `dayInfo:${selectedDateKey}`);
      onRefresh();
      eventBus.emit('REFRESH_HOME');

      Alert.alert("Comidas intercambiadas correctamente.");
    } catch (error) {
      console.error("Error intercambiando comidas:", error);
      Alert.alert("Error intercambiando comidas.");
    }
  };

  const renderSwapMealsModal = () => {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={isSwapModalVisible}
        onRequestClose={() => setIsSwapModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Selecciona el día:</Text>
            <TouchableOpacity
              onPress={() => {
                setVisibleMonth(parseInt(useMonth) - 1);
                setVisibleYear(parseInt(useYear));
              }}
            >
              <Text style={styles.dashboardInfo}>{(new Date(parseInt(useYear), parseInt(useMonth) - 1, parseInt(useDay))).toLocaleString("default", {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}</Text>
            </TouchableOpacity>

            <View style={styles.monthHeader}>
              <TouchableOpacity onPress={() => {
                if (visibleMonth === 0) {
                  setVisibleMonth(11);
                  setVisibleYear(visibleYear - 1);
                } else {
                  setVisibleMonth(visibleMonth - 1);
                }
              }}>
                <MaterialCommunityIcons name="arrow-left" size={30} color={"rgba(255, 255, 255, 1)"} />
              </TouchableOpacity>


              <Text style={styles.monthTitle}>
                {new Date(visibleYear, visibleMonth).toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>

              <TouchableOpacity onPress={() => {
                if (visibleMonth === 11) {
                  setVisibleMonth(0);
                  setVisibleYear(visibleYear + 1);
                } else {
                  setVisibleMonth(visibleMonth + 1);
                }
              }}>
                <MaterialCommunityIcons name="arrow-right" size={30} color={"rgba(255, 255, 255, 1)"} />
              </TouchableOpacity>
            </View>


            {/* Cabecera de días */}
            <View style={styles.weekRow}>
              {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
                <View key={i} style={styles.dayCell}>
                  <Text style={styles.dayLabel}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Cuadrícula de días */}
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekRow}>
                {week.find((day) => day.isCurrentMonth) && week.map((diaObj, colIndex) => {
                  if (!diaObj) return <View key={colIndex} style={[styles.dayCell]} />;
                  const isSelected = selectedDayToSwap === diaObj.key;
                  if (diaObj.isToday) {
                    return (
                      <View key={colIndex} style={styles.dayCell}>
                        <View key={colIndex} style={[styles.dayCircle, styles.todayCircle]}>
                          <Text style={styles.dayLabel}>{diaObj.day}</Text>
                        </View>
                      </View>);
                  }

                  return (
                    <View key={colIndex} style={styles.dayCell}>
                      <TouchableOpacity
                        style={[
                          styles.dayCircle,
                          (!diaObj.isCurrentMonth) && [styles.otherMonthCircle, { opacity: 0.4 }],
                          isSelected && {
                            borderWidth: 4,
                            borderColor: "rgba(0, 195, 255, 1)",
                          },
                        ]}
                        onPress={() => {
                          setSelectedDayToSwap(diaObj.key);
                        }}
                      >
                        <Text style={styles.dayText}>{diaObj.day}</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ))}

            {/* Botones */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={async () => {
                  await swapDays(selectedDayToSwap || "");
                  setIsSwapModalVisible(false);
                  setSelectedDayToSwap("");
                  setSelectedFoods([]);
                  setMealSwapInfo(null);
                }}
              >
                <Text style={styles.buttonText}>Intercambiar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setIsSwapModalVisible(false);
                  setSelectedDayToSwap("");
                  setSelectedFoods([]);
                  setMealSwapInfo(null);
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
          {renderSwapFood()}
        </View>
      </Modal>
    );
  };

  const fetchSwapInfo = async () => {
    if (selectedDayToSwap) {
      setMealSwapInfo(await getDayInfo(`dayInfo:${selectedDayToSwap}`));
    }
  };

  useEffect(() => {
    fetchSwapInfo();
  }, [selectedDayToSwap])

  const renderSwapFood = () => {
    const sortedCurrent = [...mealInfo].sort(
      (a, b) => meals.indexOf(a.meal) - meals.indexOf(b.meal)
    );

    const sortedSelected = [...(mealSwapInfo?.meals || [])].sort(
      (a, b) => meals.indexOf(a.meal) - meals.indexOf(b.meal)
    );

    const n = Math.max(sortedCurrent.length, sortedSelected.length);

    return (
      <ScrollView style={styles.scrollFoodInfo}>
        <View style={styles.viewFoodInfo}>
          {Array.from({ length: n }).map((_, index) => (
            <View key={sortedCurrent[index]?.id || index} style={styles.selectFoodCard}>
              <View style={styles.selectFoodTextContainer}>
                <Text style={styles.selectFoodType}>
                  {sortedCurrent[index]?.meal || "-"}
                </Text>
                <Text style={styles.selectFoodName}>
                  {sortedCurrent[index]?.foodName || "-"}
                </Text>
              </View>

              <MaterialCommunityIcons
                style={{ paddingRight: 10 }}
                name="swap-horizontal"
                size={30}
                color={"rgba(150, 150, 150, 1)"}
              />
              <View style={styles.selectFoodTextContainer}>
                <Text style={styles.selectFoodType}>
                  {sortedSelected[index]?.meal || "-"}
                </Text>
                <Text style={styles.selectFoodName}>
                  {sortedSelected[index]?.foodName || "-"}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderRepeatMealsModal = () => {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={isRepeatModalVisible}
        onRequestClose={() => setIsRepeatModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Selecciona el día:</Text>
            <TouchableOpacity
              onPress={() => {
                setVisibleMonth(parseInt(useMonth) - 1);
                setVisibleYear(parseInt(useYear));
              }}
            >
              <Text style={styles.dashboardInfo}>{(new Date(parseInt(useYear), parseInt(useMonth) - 1, parseInt(useDay))).toLocaleString("default", {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}</Text>
            </TouchableOpacity>

            <View style={styles.monthHeader}>
              <TouchableOpacity onPress={() => {
                if (visibleMonth === 0) {
                  setVisibleMonth(11);
                  setVisibleYear(visibleYear - 1);
                } else {
                  setVisibleMonth(visibleMonth - 1);
                }
              }}>
                <MaterialCommunityIcons name="arrow-left" size={30} color={"rgba(255, 255, 255, 1)"} />
              </TouchableOpacity>

              <Text style={styles.monthTitle}>
                {new Date(visibleYear, visibleMonth).toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>

              <TouchableOpacity onPress={() => {
                if (visibleMonth === 11) {
                  setVisibleMonth(0);
                  setVisibleYear(visibleYear + 1);
                } else {
                  setVisibleMonth(visibleMonth + 1);
                }
              }}>
                <MaterialCommunityIcons name="arrow-right" size={30} color={"rgba(255, 255, 255, 1)"} />
              </TouchableOpacity>
            </View>

            {/* Cabecera de días */}
            <View style={styles.weekRow}>
              {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
                <View key={i} style={styles.dayCell}>
                  <Text style={styles.dayLabel}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Cuadrícula de días */}
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekRow}>
                {week.find((day) => day.isCurrentMonth) && week.map((diaObj, colIndex) => {
                  if (!diaObj) return <View key={colIndex} style={[styles.dayCell]} />;
                  const isSelected = selectedDaysToRepeat.includes(diaObj.key);
                  if (diaObj.isToday) {
                    return (
                      <View key={colIndex} style={styles.dayCell}>
                        <View key={colIndex} style={[styles.dayCircle, styles.todayCircle]}>
                          <Text style={styles.dayLabel}>{diaObj.day}</Text>
                        </View>
                      </View>);
                  }

                  return (
                    <View key={colIndex} style={styles.dayCell}>
                      <TouchableOpacity
                        style={[
                          styles.dayCircle,
                          (!diaObj.isCurrentMonth) && [styles.otherMonthCircle, { opacity: 0.4 }],
                          isSelected && {
                            borderWidth: 4,
                            borderColor: "rgba(0, 195, 255, 1)",
                          },
                        ]}
                        onPress={() => {
                          setSelectedDaysToRepeat(prev =>
                            isSelected ? prev.filter(k => k !== diaObj.key)
                              : [...prev, diaObj.key]
                          );
                        }}
                      >
                        <Text style={styles.dayText}>{diaObj.day}</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ))}

            {/* Botones */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={async () => {
                  await repeatMeals(selectedDaysToRepeat);
                  setIsRepeatModalVisible(false);
                  setSelectedDaysToRepeat([]);
                  setSelectedFoods([]);
                }}
              >
                <Text style={styles.buttonText}>Repetir Comidas</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setIsRepeatModalVisible(false);
                  setSelectedDaysToRepeat([]);
                  setSelectedFoods([]);
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
          {renderSelectFood()}
        </View>
      </Modal>
    );
  };

  const toggleSelectFood = (mealId: number) => {
    if (selectedFoods.includes(mealId)) {
      setSelectedFoods(prev => prev.filter(id => id !== mealId));
    } else {
      setSelectedFoods(prev => [...prev, mealId]);
    }
  };

  const renderSelectFood = () => {
    const mealTypesSorted = [...mealInfo].sort(
      (a, b) => meals.indexOf(a.meal) - meals.indexOf(b.meal)
    );

    return (
      <ScrollView style={styles.scrollFoodInfo}>
        <View style={styles.viewFoodInfo}>
          {mealTypesSorted.map((meal) => (
            <TouchableOpacity
              onPress={() => toggleSelectFood(meal.id)}
              key={meal.id} style={styles.selectFoodCard}
            >
              {selectedFoods.includes(meal.id) ?
                <MaterialCommunityIcons name="checkbox-marked" size={30} color={"rgba(255, 170, 0, 1)"} />
                : <MaterialCommunityIcons name="checkbox-blank-outline" size={30} color={"rgba(155,155,155,1)"} />}
              <View style={styles.selectFoodTextContainer}>
                <Text style={styles.selectFoodType}>{meal.meal}</Text>
                <Text style={styles.selectFoodName}>{meal.foodName}</Text>
              </View>
            </TouchableOpacity>

          ))}
        </View>
      </ScrollView >
    );
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          progressBackgroundColor="rgba(90, 90, 90, 1)"
          colors={["rgba(255, 170, 0, 1)"]} />
      }
    >
      {renderRepeatMealsModal()}
      {renderSwapMealsModal()}
      <View style={styles.container}>
        <View style={styles.cardsContainer}>
          {renderMealCards()}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "rgba(30, 30, 30, 1)",
  },
  container: {
    flex: 1,
    marginTop: 20,
    marginHorizontal: 15,
    flexWrap: "wrap-reverse",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  cardsContainer: {
    marginTop: 10,
    gap: 10,
    alignItems: "center",
  },
  cardInfo: {
    justifyContent: "center",
    padding: 10,
  },
  text: {
    fontSize: 20,
    color: "rgb(255, 255, 255)",
  },
  input: {
    borderColor: "rgba(200, 200, 200, 1)",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    color: "black",
    height: 40,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(30, 30, 30, 0.95)",
  },
  modalView: {
    backgroundColor: "rgba(70, 70, 70, 1)",
    borderRadius: 15,
    padding: 10,
    alignItems: "center",
    overflow: "hidden",
    width: "85%",
  },
  modalButton: {
    backgroundColor: "rgba(60, 80, 145, 1)",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: "47%",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
  },
  modalCancelButton: {
    backgroundColor: "rgba(250, 50, 50, 1)",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: "47%",
  },
  modalCancelButtonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
  },
  scrollModalContainer: {
    width: "100%",
  },
  modalText: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 18,
    marginBottom: 10,
  },
  modalButtonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
  },
  modalButtonButton: {
    backgroundColor: "rgba(200, 200, 200, 1)",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  modalButtonButtonText: {
    color: "black",
    textAlign: "center",
    fontSize: 16,
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
    backgroundColor: "rgba(95, 95, 95, 1)",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  todayCircle: {
    backgroundColor: "rgba(255, 170, 0, 1)",
  },
  otherMonthCircle: {
    backgroundColor: "rgba(20, 20, 20, 1)",
  },
  dayText: {
    color: "white",
    fontWeight: "bold",
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    width: "100%"
  },
  monthTitle: {
    fontSize: 15,
    color: "white",
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  scrollFoodInfo: {
    marginTop: 10,
    width: "100%",
    maxHeight: "35%",
  },
  viewFoodInfo: {
    alignItems: "center",
  },
  selectFoodCard: {
    marginBottom: 10,
    minHeight: 60,
    width: "85%",
    backgroundColor: "rgba(70, 70, 70, 1)",
    borderRadius: 15,
    padding: 10,
    alignItems: "center",
    flexDirection: "row",
  },
  selectFoodTextContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  selectFoodType: {
    color: "rgba(170, 170, 170, 1)",
    fontWeight: "bold",
  },
  selectFoodName: {
    color: "rgba(250, 250, 250, 1)"
  },
  dashboardInfo: {
    fontSize: 17,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
});