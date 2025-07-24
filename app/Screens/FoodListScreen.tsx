import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View, Text, Alert, Modal } from "react-native";
import { getAsyncInfo, removeAsyncInfo } from "../components/AsyncStorageCRUD";
import MealCard from "../components/MealCard";
import { RefreshControl, TextInput } from "react-native-gesture-handler";
import { getDayInfo, setDayInfo } from "../db/DaySqlLiteCRUD";

const { width, height } = Dimensions.get("window");

const meals = ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"];

export default function FoodListScreen({ route }: { route: any }) {
  const today = new Date();
  const currentDay = today.getDate();

  const [selectedDaysToRepeat, setSelectedDaysToRepeat] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDayInfo();
    setRefreshTrigger((prev) => prev + 1);
    setRefreshing(false);
  };

  const { dayInfoKey } = route.params || {};
  const defaultKey = `dayInfo:${currentDay}-${today.getMonth()}-${today.getFullYear()}`;
  const keyToUse = dayInfoKey || defaultKey;

  const navigation = useNavigation();
  const [mealInfo, setMealInfo] = useState<any[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          style={{ marginLeft: 20 }}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={30} color="rgba(255, 170, 0, 1)" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={{ marginRight: 20 }}
            onPress={() => setIsModalVisible(true)}
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
    console.log(mealInfo);
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
      console.log("Data to repeat:", selectedDateKeys);

      for (const dateKey of selectedDateKeys) {
        await setDayInfo(`dayInfo:${dateKey}`, data.meals);
        console.log(`Meals repeated for ${dateKey}, data:`, data.meals);
      }

      Alert.alert("Comidas repetidas correctamente.");
    } catch (error) {
      console.error("Error repitiendo comidas:", error);
      Alert.alert("Error repitiendo comidas.");
    }
  };

  const renderRepeatMealsModal = () => {
    const [day, month, year] = keyToUse.replace("dayInfo:", "").split("-").map(Number);
    const startDate = new Date(year, month, day - 7);

    const dates = Array.from({ length: 38 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const day = date.getDate();
      const month = date.getMonth();
      const year = date.getFullYear();
      return {
        day,
        month,
        year,
        weekday: (date.getDay() + 6) % 7, // Lunes = 0
        key: `${day}-${month}-${year}`,
      };
    });

    // Alinear la primera semana con null al inicio
    const firstWeekday = dates[0].weekday;
    const paddedDates = [...Array(firstWeekday).fill(null), ...dates];

    // Rellenar al final con nulls para completar la última fila de 7
    while (paddedDates.length % 7 !== 0) {
      paddedDates.push(null);
    }

    // Dividir en semanas
    const weeks = Array.from({ length: paddedDates.length / 7 }, (_, i) =>
      paddedDates.slice(i * 7, i * 7 + 7)
    );

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Selecciona los días:</Text>

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
                {week.map((diaObj, colIndex) => {
                  if (!diaObj) return <View key={colIndex} style={[styles.dayCell]} />;
                  const isSelected = selectedDaysToRepeat.includes(diaObj.key);
                  const isToday = diaObj.day === day && diaObj.month === month && diaObj.year === year;
                  if (isToday) {
                    return (
                      <View key={colIndex} style={styles.dayCell}>
                        <View key={colIndex} style={[styles.dayCircle, styles.todayCircle]}>
                          <Text style={styles.dayLabel}>{day}</Text>
                        </View>
                      </View>);
                  }

                  return (
                    <View key={colIndex} style={styles.dayCell}>
                      <TouchableOpacity
                        style={[
                          styles.dayCircle,
                          (diaObj.month !== month || diaObj.year !== year) && styles.otherMonthCircle,
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
                  setIsModalVisible(false);
                  setSelectedDaysToRepeat([]);
                }}
              >
                <Text style={styles.buttonText}>Repetir Comidas</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setIsModalVisible(false);
                  setSelectedDaysToRepeat([]);
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} progressBackgroundColor="rgba(70, 70, 70, 1)" colors={["rgba(255, 170, 0, 1)"]} />
      }>
      {renderRepeatMealsModal()}
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
    backgroundColor: "rgba(120, 120, 120, 1)",
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "rgba(0, 0, 0, 1)",
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
    backgroundColor: "rgba(70, 70, 70, 1)",
  },
  todayCircle: {
    backgroundColor: "rgba(255, 170, 0, 1)",
  },
  otherMonthCircle: {
    backgroundColor: "rgba(35, 35, 35, 1)",
  },
  dayText: {
    color: "white",
    fontWeight: "bold",
  },

});