import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useLayoutEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAsyncInfo, setAsyncInfo } from "../components/AsyncStorageCRUD";
import { getDayInfo, removeMealById } from "../db/DaySqlLiteCRUD";

export default function FoodDetailScreen({ route }: { route: any }) {
  const { dayInfoKey, mealType } = route.params || {};
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
          {editing ? (
            <MaterialCommunityIcons
              name="close"
              size={30}
              color="rgba(255, 70, 70, 1)"
            />
          ) : (
            <MaterialCommunityIcons
              name="pencil-box-outline"
              size={30}
              color="rgba(255, 170, 0, 1)"
            />
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, dayInfoKey, editing]);

  const fetchMealData = async () => {
    try {
      const dayInfo = await getDayInfo(dayInfoKey);
      if (dayInfo && dayInfo.meals) {
        const filtered = dayInfo.meals.filter(day => day.meal === mealType);
        setMealData(filtered);
        console.log("mealIds:", filtered.map(m => m.id));
      } else {
        setMealData([]);
      }
    } catch (error) {
      console.error("Error fetching meals:", error);
      setMealData([]);
    }
  };

  useEffect(() => {
    fetchMealData();
  }, [dayInfoKey, mealType]);

  const deleteMeal = async (mealToDelete: any) => {
    try {
      await removeMealById(mealToDelete.id);
      // Refrescar lista después de borrar
      fetchMealData();
    } catch (err) {
      console.error("Error deleting meal:", err);
    }
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Detalles de {mealType}</Text>

        {mealData.map((item, index) => (
          <View key={item.id ?? index} style={styles.card}>
            <View style={styles.arson}>
              <View style={styles.arsonText}>
                <Text style={styles.name}>🍽 {item.foodName}</Text>
                <Text style={styles.text}>⏱ Tiempo: {item.time} min</Text>
              </View>
              {editing && (
                <View style={{ flexDirection: "row" }}>
                  <TouchableOpacity
                    style={{ marginRight: 20 }}
                    onPress={() =>
                      (navigation as any).navigate("EditFoodScreen", {
                        mealId: item.id,
                      })
                    }
                  >
                    <MaterialCommunityIcons
                      name="pencil-box-outline"
                      size={30}
                      color="rgba(255, 170, 0, 1)"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ marginRight: 20 }}
                    onPress={() => deleteMeal(item)}
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={30}
                      color="rgba(255, 0, 0, 1)"
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {item.ingredients && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.section}>Ingredientes:</Text>
                {item.ingredients.map((ing: any, i: number) => (
                  <Text style={styles.text} key={i}>
                    • {ing.ingName} - {ing.quantity}
                  </Text>
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
            No hay comidas registradas para {mealType} en esta fecha.
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