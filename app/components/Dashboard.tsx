import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const { width, height } = Dimensions.get("window");
const daysOfWeek = ["L", "M", "X", "J", "V", "S", "D"];

export default function Dashboard() {
  const navigation = useNavigation();
  const today = new Date();
  const currentDay = today.getDate();
  const startWeekday = (new Date(today.getFullYear(), today.getMonth(), 1).getDay() + 6) % 7;
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const days = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (days.length % 7 !== 0) days.push(null);
  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, i) => days.slice(i * 7, i * 7 + 7));

  const [streakDays, setStreakDays] = useState<any[]>([]);

  useEffect(() => {
    const fetchDayInfo = async () => {
      const results = [];

      for (let i = 1; i <= daysInMonth; i++) {
        const dayInfoKey = `dayInfo:${i}-${today.getMonth()}-${today.getFullYear()}`;
        const saved = await AsyncStorage.getItem(dayInfoKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.isStreak) {
            results.push({ day: i, ...parsed });
          }
        }
      }
      setStreakDays(results);
    };
    fetchDayInfo();
  }, [currentDay]);


  return (
    <View style={styles.dashboardContainer}>
      <Text style={styles.dashboardTitle}>Calendario</Text>
      <Text style={styles.dashboardInfo}>Información general de la semana</Text>

      <View style={styles.weekRow}>
        {daysOfWeek.map((d, i) => (
          <View key={i} style={styles.dayCell}>
            <Text style={styles.dayLabel}>{d}</Text>
          </View>
        ))}
      </View>

      {weeks.map((week, i) => (
        <View key={i} style={styles.weekRow}>
          {week.map((day, j) => (
            <View key={j} style={styles.dayCell}>
              {day && (
                <TouchableOpacity
                  style={[
                    styles.dayCircle,
                    day === currentDay && styles.todayCircle,
                    streakDays[day]?.isStreak && { backgroundColor: "rgba(70, 115, 200, 1)" },
                  ]}
                  onPress={() => navigation.getParent()?.navigate("FoodListScreen", { dayInfoKey: `dayInfo:${day}-${today.getMonth()}-${today.getFullYear()}` })}>
                  <Text style={styles.dayText}>{day}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      ))
      }
    </View >
  );
};

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