import { Text, View, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from "react-native";

const { width, height } = Dimensions.get("window");

const meals = ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"];

const createCard = (title: string, info: string) => (
  <View style={styles.cardContainer}>
    <View style={styles.groupCard}>
      <Text style={styles.groupCardTitle}>{title}</Text>
      <View style={styles.cardInfo}>
        <Text style={styles.text}>{info}</Text>
      </View>
    </View>
  </View>
);

export default function DayInfoScreen() {
  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.cardsContainer}>
          {createCard("Desayuno", "Información sobre el desayuno")}
          {createCard("Almuerzo", "Información sobre el almuerzo")}
          {createCard("Comida", "Información sobre la comida")}
          {createCard("Merienda", "Información sobre la merienda")}
          {createCard("Cena", "Información sobre la cena")}
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