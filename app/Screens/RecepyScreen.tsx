import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useLayoutEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { addRecepy, getAllMealsInRecepys, getAllRecepys, removeRecepy } from "../db/DaySqlLiteCRUD";
import { eventBus } from "../utils/EventBus";

interface Ingredient {
  ingName: string;
  quantity: string;
}

export default function RecepyScreen({ route }: { route: any }) {
  const [mealData, setMealData] = useState<any[]>([]);
  const [recepysArray, setRecepysArray] = useState<any[]>([]);

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity style={{ marginLeft: 20 }} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={30} color="rgba(255, 170, 0, 1)" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const fetchData = async () => {
    try {
      const [meals, recepys] = await Promise.all([
        getAllMealsInRecepys(),
        getAllRecepys(),
      ]);
      setMealData(meals || []);
      setRecepysArray(recepys || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setMealData([]);
      setRecepysArray([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isInRecepys = (mealId: number) => {
    return recepysArray.some((recepy) => recepy.mealId === mealId);
  };

  const toggleInRecepys = async (mealId: number) => {
    try {
      if (isInRecepys(mealId)) {
        await removeRecepy(mealId);
      } else {
        await addRecepy(mealId);
      }
      const updated = await getAllRecepys();
      setRecepysArray(updated || []);
      eventBus.emit('REFRESH_HOME');
    } catch (err) {
      console.error("Error toggling recepy:", err);
    }
  };

  const handleCardPress = (mealId: number) => {
    (navigation as any).navigate("MealDetailsScreen", { mealInfoKey: mealId });
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Recetas guardadas:</Text>

        {mealData.map((mealInf, index) => {
          const isSaved = isInRecepys(mealInf.id);
          return (
            <TouchableOpacity key={index} onPress={() => handleCardPress(mealInf.id)}>
              <View style={styles.groupCardInfo}>
                <View style={styles.cardInfo}>
                  <View
                    style={{
                      paddingBottom: 5,
                      borderBottomWidth: 1,
                      borderBottomColor: "rgba(255, 255, 255, 1)",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <TouchableOpacity
                        onPress={() => {
                          toggleInRecepys(mealInf.id);
                        }}
                      >
                        <MaterialCommunityIcons
                          name={isSaved ? "bookmark" : "bookmark-outline"}
                          size={30}
                          color={isSaved ? "rgba(220, 50, 50, 1)" : "rgba(255, 255, 255, 0.6)"}
                        />
                      </TouchableOpacity>
                      <Text style={styles.titleText}>{mealInf.foodName}</Text>
                    </View>
                    <Text style={styles.text}>⏱ {mealInf.time} min</Text>
                  </View>

                  <Text style={[styles.text, { marginTop: 10, fontWeight: "600" }]}>
                    Ingredientes:
                  </Text>
                  {mealInf.ingredients.map((ing: Ingredient, i: number) => (
                    <Text key={i} style={styles.text}>
                      • {ing.ingName} ({ing.quantity})
                    </Text>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {mealData.length === 0 && (
          <Text style={styles.text}>Todavía no hay recetas guardadas.</Text>
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
    color: "rgba(255, 255, 255, 1)",
  },
  groupCardInfo: {
    padding: 5,
  },
  cardInfo: {
    width: "100%",
    minHeight: 100,
    backgroundColor: "rgba(0, 60, 90, 1)", 
    borderRadius: 10,
    justifyContent: "center",
    padding: 15,
    borderWidth: 0.4,
    borderColor: "rgba(255, 255, 255, 0.3)"
  },
  titleText: {
    fontSize: 20,
    color: "rgba(255, 255, 255, 1)",
    fontWeight: "800",
    width: "85%",
    marginLeft: 10,
  },
  text: {
    fontSize: 18,
    color: "rgb(255, 255, 255)",
  },
});
