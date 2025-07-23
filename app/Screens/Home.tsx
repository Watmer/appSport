import { useEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { RefreshControl } from "react-native-gesture-handler";
import { getAsyncInfo } from "../components/AsyncStorageCRUD";
import Dashboard from "../components/Dashboard";
import MealCard from "../components/MealCard";

const { width, height } = Dimensions.get("window");

export default function Home() {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const today = new Date();
  const currentDay = today.getDate();
  const defaultKey = `dayInfo:${currentDay}-${today.getMonth()}-${today.getFullYear()}`;


  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    setRefreshing(false);
  };

  const renderMealCards = () => {
    return <MealCard dayInfoKey={defaultKey} refreshTrigger={refreshTrigger} />;
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          progressBackgroundColor="rgba(70, 70, 70, 1)"
          colors={["rgba(255, 170, 0, 1)"]}
        />
      }
    >
      <View style={styles.container}>
        <View style={styles.cardsContainer}>{renderMealCards()}</View>
        <Dashboard refreshTrigger={refreshTrigger} />
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
    rowGap: 10,
  },
  cardsContainer: {
    marginTop: 10,
    gap: 10,
    alignItems: "center",
  },
});