import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import { getAsyncInfo } from "../components/AsyncStorageCRUD";

export default function FoodDetailScreen({ route }: { route: any }) {
  const { dayInfoKey, meal } = route.params || {};
  const [mealData, setMealData] = useState<any[]>([]);

  useEffect(() => {
    const fetchMealData = async () => {
      const allMeals = await getAsyncInfo({ keyPath: dayInfoKey });
      console.log("Fetched meals:", allMeals);
      if (allMeals && Array.isArray(allMeals)) {
        const filtered = allMeals.filter((item) => item.meal === meal);
        setMealData(filtered);
      }
    };

    fetchMealData();
  }, [dayInfoKey, meal]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Detalles de {meal}</Text>

      {mealData.map((item, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.name}>🍽 {item.foodName}</Text>
          <Text>⏱ Tiempo: {item.time} min</Text>

          {item.ingredients && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.section}>Ingredientes:</Text>
              {item.ingredients.map((ing: any, i: number) => (
                <Text key={i}> • {ing.name} - {ing.quantity}</Text>
              ))}
            </View>
          )}

          {item.recepy && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.section}>📋 Receta:</Text>
              <Text>{item.recepy}</Text>
            </View>
          )}

          {item.comments && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.section}>💬 Comentarios:</Text>
              <Text>{item.comments}</Text>
            </View>
          )}
        </View>
      ))}

      {mealData.length === 0 && (
        <Text style={{ marginTop: 20, textAlign: 'center' }}>
          No hay comidas registradas para {meal} en esta fecha.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "rgba(120, 120, 120, 1)",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 16,
    color: "rgba(255, 255, 255, 1)"
  },
  card: {
    backgroundColor: "rgba(150, 160, 160, 1)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
  },
  section: {
    fontWeight: "600",
    marginBottom: 4,
  },
});