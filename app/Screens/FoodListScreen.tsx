import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect } from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import MealCard from "../components/MealCard";

const { width, height } = Dimensions.get("window");

const meals = ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"];

export default function FoodListScreen({ route }: { route: any }) {
  const { key } = route.params || {};

  useEffect(() => {
    const fetchDayInfo = async () => {
      const data = await AsyncStorage.getItem(`${key.toString()}`);
      console.log("Fetched day info:", data);
    };
    if (key) fetchDayInfo();
  }, [key]);

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.cardsContainer}>
          <MealCard
            meal="Desayuno"
            foodName="Tostada con Aguacate"
            time="10"
            ingredients={[
              { name: "Pan", quantity: "2" },
              { name: "Aguacate", quantity: "1" },
            ]}
            key={key.toString()}
          />
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