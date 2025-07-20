import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Dashboard from "../components/Dashboard";

const { width, height } = Dimensions.get("window");

const meals = ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"];

export default function Home() {
  const [completed, setCompleted] = useState(false);
  const title = "FoodList";
  const ingredients = "This is a sample food list for the week.";

  useEffect(() => {
    const fetchStatus = async () => {
      const saved = await AsyncStorage.getItem(`comida:${title}`);
      setCompleted(saved === 'true');
    };
    fetchStatus();
  }, []);

  const toggleCompleted = async () => {
    const newValue = !completed;
    setCompleted(newValue);
    await AsyncStorage.setItem(`comida:${title}`, newValue.toString());
  };

  const createCard = (
    meal: string,
    foodName: string,
    time: string,
    ingredients: { name: string; quantity: string }[]
  ) => {
    return (
      <View key={meal} style={styles.cardContainer}>
        <View style={styles.groupCard}>
          <View style={styles.groupCardTitle}>
            <TouchableOpacity onPress={toggleCompleted}>
              <MaterialCommunityIcons
                name={completed ? "checkbox-marked" : "checkbox-blank-outline"}
                size={25}
                color="rgba(255, 200, 0, 1)"
              />
            </TouchableOpacity>

            <Text style={styles.groupCardTitleText}>{meal}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.titleText}>{foodName}</Text>
            <Text style={styles.text}>Tiempo: {time} min</Text>

            <Text style={[styles.text, { marginTop: 10 }]}>Ingredientes:</Text>
            {ingredients.map((ing, i) => (
              <Text key={i} style={styles.text}>
                • {ing.name} ({ing.quantity})
              </Text>
            ))}

          </View>
        </View>
      </View>
    );
  };


  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.cardsContainer}>
          {createCard(meals[0], "Tortilla", "10", [
            { name: "Huevo", quantity: "2" },
            { name: "Patata", quantity: "100g" },
          ])}
        </View>
        <Dashboard />
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