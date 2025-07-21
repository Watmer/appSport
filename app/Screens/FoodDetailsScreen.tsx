import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useEffect, useLayoutEffect, useState } from "react";
import { getAsyncInfo, removeAsyncInfo } from "../components/AsyncStorageCRUD";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function FoodDetailScreen({ route }: { route: any }) {
  const { dayInfoKey, meal } = route.params || {};
  const [mealData, setMealData] = useState<any[]>([]);

  const [editing, setEditing] = useState(false);

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: 20 }}
          onPress={() => setEditing(!editing)}
        >
          {editing ? <MaterialCommunityIcons name="close" size={30} color="rgba(255, 70, 70, 1)" /> : <MaterialCommunityIcons name="pencil-box-outline" size={30} color="rgba(255, 170, 0, 1)" />}
        </TouchableOpacity>
      ),
    });
  }, [navigation, dayInfoKey, editing]);

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

  const deleteMeal = async (item: any) => {
    await removeAsyncInfo({ keyPath: (dayInfoKey + "") })
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Detalles de {meal}</Text>

        {mealData.map((item, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.arson}>
              <View style={styles.arsonText}>
                <Text style={styles.name}>🍽 {item.foodName}</Text>
                <Text style={styles.text}>⏱ Tiempo: {item.time} min</Text>
              </View>
              {editing && (<TouchableOpacity
                style={{ marginRight: 20 }}
                onPress={() => (navigation as any).navigate("EditFoodScreen", { dayInfoKey: dayInfoKey })}
              >
                <MaterialCommunityIcons name="pencil-box-outline" size={30} color="rgba(255, 170, 0, 1)" />
              </TouchableOpacity>)}
            </View>

            {item.ingredients && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.section}>Ingredientes:</Text>
                {item.ingredients.map((ing: any, i: number) => (
                  <Text style={styles.text} key={i}> • {ing.name} - {ing.quantity}</Text>
                ))}
              </View>
            )}

            {item.recepy && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.section}>📋 Receta:</Text>
                <Text style={styles.text}>{item.recepy}</Text>
              </View>
            )}

            {item.comments && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.section}>💬 Comentarios:</Text>
                <Text style={styles.text}>{item.comments}</Text>
              </View>
            )}

          </View>
        ))}

        {mealData.length === 0 && (
          <Text style={styles.text}>
            No hay comidas registradas para {meal} en esta fecha.
          </Text>
        )}
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
    padding: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 16,
    color: "rgba(255, 255, 255, 1)"
  },
  card: {
    backgroundColor: "rgba(35, 80, 120, 1)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  arson: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 1)"
  },
  arsonText: {
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