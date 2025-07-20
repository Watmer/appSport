import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { getAsyncInfo } from "../components/AsyncStorageCRUD";
import MealCard from "../components/MealCard";

const { width, height } = Dimensions.get("window");

const meals = ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"];

export default function FoodListScreen({ route }: { route: any }) {
  const today = new Date();
  const currentDay = today.getDate();

  const { dayInfoKey } = route.params || {};
  const defaultKey = `dayInfo:${currentDay}-${today.getMonth()}-${today.getFullYear()}`;
  const keyToUse = dayInfoKey || defaultKey;

  const navigation = useNavigation();
  const [mealInfo, setMealInfo] = useState<any>();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: 20 }}
          onPress={() => (navigation as any).navigate("AddFoodScreen", { dayInfoKey: keyToUse })}
        >
          <MaterialCommunityIcons name="plus" size={30} color="rgba(255, 170, 0, 1)" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, keyToUse]);

  useEffect(() => {
    const fetchDayInfo = async () => {
      const data = await getAsyncInfo({ keyPath: keyToUse });
      console.log("Fetched day info:", data);
      console.log(keyToUse);
      setMealInfo(data);
    };

    fetchDayInfo();
  }, [keyToUse]);

  const renderMealCard = () => {
    if (!mealInfo) return null;
    return (
      <MealCard
        meal="Desayuno"
        foodName={mealInfo.foodName}
        time={mealInfo.time}
        ingredients={mealInfo.ingredients}
        dayInfoKey={keyToUse}
      />
    );
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.cardsContainer}>
          {renderMealCard()}
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
  dashboardContainer: {
    flex: 1,
    width: width - 30,
    backgroundColor: "rgba(100, 100, 100, 1)",
    borderRadius: 15,
    marginBottom: 20,
    padding: 10,
    paddingBottom: 0,
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
    color: "rgba(255, 255, 255, 1)",
    fontSize: 24,
    fontWeight: "bold",
    alignSelf: "center",
    margin: 5,
  },
  cardInfo: {
    width: "100%",
    minHeight: 100,
    backgroundColor: "rgba(200, 160, 70, 1)",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 20,
    color: "rgb(255, 255, 255)",
  },
});