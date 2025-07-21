import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View, Text } from "react-native";
import { getAsyncInfo, removeAsyncInfo } from "../components/AsyncStorageCRUD";
import MealCard from "../components/MealCard";
import { RefreshControl } from "react-native-gesture-handler";

const { width, height } = Dimensions.get("window");

const meals = ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"];

export default function FoodListScreen({ route }: { route: any }) {
  const today = new Date();
  const currentDay = today.getDate();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDayInfo();
    setRefreshing(false);
  };

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

  const fetchDayInfo = async () => {
    const data = await getAsyncInfo({ keyPath: keyToUse });
    if (data?.length === 0) {
      removeAsyncInfo({ keyPath: keyToUse });
    } else {
      setMealInfo(data);
    }
  };

  useEffect(() => {
    fetchDayInfo();
  }, [keyToUse]);

  const renderMealCards = () => {
    if (!mealInfo) {
      return (
        <View style={styles.cardInfo}>
          <Text style={styles.text}>
            No hay comidas registradas en esta fecha.
          </Text>
        </View>
      );
    };
    console.log(mealInfo);
    return (
      <MealCard
        key={keyToUse}
        dayInfoKey={keyToUse}
        mealInfo={mealInfo}
      />
    );
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
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
});