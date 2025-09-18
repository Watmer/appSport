import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useLayoutEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getMealById } from "../db/CRUD/DayMealsCRUD";

export default function MealDetailScreen({ route }: { route: any }) {
  const { mealInfoKey } = route.params || {};
  const { mealJson } = route.params || {};
  const [mealData, setMealData] = useState<any>(null);

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          style={{ marginLeft: 20 }}
          onPress={() => navigation.canGoBack() ? navigation.goBack() : null}
        >
          <MaterialCommunityIcons name="arrow-left" size={30} color="rgba(255, 170, 0, 1)" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, mealInfoKey]);

  const fetchMealData = async () => {
    try {
      if (mealJson) {
        setMealData(mealJson);
        return;
      } else if (!mealInfoKey) {
        setMealData(null);
        return;
      }

      const mealInfo = await getMealById(mealInfoKey);
      if (mealInfo) {
        setMealData(mealInfo);
      } else {
        setMealData(null);
      }
    } catch (error) {
      console.error("Error fetching meals:", error);
      setMealData(null);
    }
  };

  useEffect(() => {
    fetchMealData();
  }, [mealInfoKey]);

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.arson}>
            <View style={styles.arsonText}>
              <Text style={{
                marginVertical: 5,
                color: "rgba(255, 255, 255, 1)",
                fontSize: 20,
              }}>{mealData?.meal}</Text>
              <Text style={styles.name}>🍽 {mealData?.foodName}</Text>
              <Text style={styles.text}>⏱ Tiempo: {mealData?.time} min</Text>
            </View>
          </View>

          {mealData?.ingredients && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.section}>Ingredientes:</Text>
              {mealData.ingredients.map((ing: any, i: number) => (
                <Text style={styles.text} key={i}>
                  • {ing.ingName} - {ing.quantity}
                </Text>
              ))}
            </View>
          )}

          {mealData?.recepy && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.section}>📋 Receta:</Text>
              <Text style={styles.text}>{mealData.recepy}</Text>
            </View>
          )}

          {mealData?.comments && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.section}>💬 Comentarios:</Text>
              <Text style={styles.text}>{mealData.comments}</Text>
            </View>
          )}
        </View>

        {mealData?.length === 0 && (
          <Text style={styles.text}>
            No hay comida registrada.
          </Text>
        )}
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
    padding: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 16,
    color: "rgba(255, 255, 255, 1)"
  },
  card: {
    backgroundColor: "rgba(0, 60, 90, 1)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 0.4,
    borderColor: "rgba(255, 255, 255, 0.3)"
  },
  arson: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 1)"
  },
  arsonText: {
    flex: 3,
  },
  name: {
    fontSize: 23,
    fontWeight: "900",
    color: "rgba(255, 255, 255, 1)",
  },
  text: {
    fontSize: 17,
    color: "rgba(255, 255, 255, 1)",
  },
  section: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
    color: "rgba(255, 255, 255, 1)",
  },
});