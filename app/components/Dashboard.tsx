import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getDayInfo } from "../db/DaySqlLiteCRUD";

const { width, height } = Dimensions.get("window");
const daysOfWeek = ["L", "M", "X", "J", "V", "S", "D"];

export default function Dashboard({ refreshTrigger }: { refreshTrigger: number }) {
  const navigation = useNavigation();
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth());
  const [visibleYear, setVisibleYear] = useState(today.getFullYear());
  const currentDay = today.getDate();

  const startDate = new Date(visibleYear, visibleMonth, 1);
  startDate.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7));

  const dates = Array.from({ length: 35 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    return {
      day,
      month,
      year,
      key: `${day}-${month}-${year}`,
      isCurrentMonth: month === visibleMonth && year === visibleYear,
      isToday: day === currentDay && month === today.getMonth() && year === today.getFullYear(),
    };
  });

  const weeks = Array.from({ length: 6 }, (_, i) => dates.slice(i * 7, i * 7 + 7));
  const [streakDays, setStreakDays] = useState<any[]>([]);
  const [failedDays, setFailedDays] = useState<any[]>([]);
  const [frozenDays, setFrozenDays] = useState<any[]>([]);

  useEffect(() => {
    const fetchDayInfo = async () => {
      const daysStreak = [];
      const daysFailed = [];
      const frozen = [];

      for (const week of weeks) {
        let frozenAdded = false;

        for (const { day, month, year, key } of week) {
          const dayInfoKey = `dayInfo:${day}-${month}-${year}`;
          const dayData = await getDayInfo(dayInfoKey);

          const isStreak = dayIsStreak(dayData?.meals);
          const isFailed = dayIsFailed(dayData?.meals);

          if (isStreak) {
            daysStreak.push(key);
          } else if (isFailed) {
            if (!frozenAdded) {
              frozen.push(key);
              frozenAdded = true;
            } else {
              daysFailed.push(key);
            }
          }
        }
      }

      setStreakDays(daysStreak);
      setFailedDays(daysFailed);
      setFrozenDays(frozen);
    };

    fetchDayInfo();
  }, [refreshTrigger, visibleMonth, visibleYear]);

  const dayIsStreak = (meals: any[] | undefined): boolean => {
    if (!meals || meals.length === 0) return false;
    return meals.every(meal => meal.completed === 1);
  };

  const dayIsFailed = (meals: any[] | undefined): boolean => {
    if (!meals || meals.length === 0) return false;
    return meals.some(meal => meal.completed === 1) && meals.some(meal => meal.completed === 0);
  };

  const nContinuousStreak = () => {
    let count = 0;
    const today = new Date();
    const formatKey = (date: Date) => `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;

    for (let i = 1; i <= 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const key = formatKey(date);

      if (frozenDays.includes(key)) {
        continue;
      } else if (streakDays.includes(key)) {
        count++;
      } else {
        break;
      }
    }

    return count;
  };

  return (
    <View style={styles.dashboardContainer}>
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={() => {
          if (visibleMonth === 0) {
            setVisibleMonth(11);
            setVisibleYear(visibleYear - 1);
          } else {
            setVisibleMonth(visibleMonth - 1);
          }
        }}>
          <MaterialCommunityIcons name="arrow-left" size={30} color={"rgba(255, 255, 255, 1)"} />
        </TouchableOpacity>

        <Text style={styles.monthTitle}>
          {new Date(visibleYear, visibleMonth).toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </Text>

        <TouchableOpacity onPress={() => {
          if (visibleMonth === 11) {
            setVisibleMonth(0);
            setVisibleYear(visibleYear + 1);
          } else {
            setVisibleMonth(visibleMonth + 1);
          }
        }}>
          <MaterialCommunityIcons name="arrow-right" size={30} color={"rgba(255, 255, 255, 1)"} />
        </TouchableOpacity>
      </View>
      <Text style={styles.dashboardInfo}>{today.toLocaleString("default", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      })}</Text>
      <Text style={styles.dashboardInfo}>{nContinuousStreak() > 1 ? "Dias de racha " + nContinuousStreak() : null}</Text>

      <View style={styles.weekRow}>
        {daysOfWeek.map((d, i) => (
          <View key={i} style={styles.dayCell}>
            <Text style={styles.dayLabel}>{d}</Text>
          </View>
        ))}
      </View>

      {weeks.map((week, i) => (
        <View key={i} style={styles.weekRow}>
          {week.map((dateObj, j) => {
            const isStreak = streakDays.includes(dateObj.key);
            const isFailed = failedDays.includes(dateObj.key);
            const isFrozen = frozenDays.includes(dateObj.key);

            return (
              <View key={j} style={styles.dayCell}>
                <TouchableOpacity
                  style={[
                    styles.dayCircle,
                    isStreak && { backgroundColor: "rgba(70, 115, 200, 1)" },
                    isFailed && { backgroundColor: "rgba(255, 50, 50, 1)" },
                    isFrozen && { backgroundColor: "rgba(80, 185, 255, 1)" },
                    !dateObj.isCurrentMonth && { opacity: 0.4 },
                    dateObj.isToday && styles.todayCircle,
                  ]}
                  onPress={() =>
                    navigation.getParent()?.navigate("FoodListScreen", {
                      dayInfoKey: `dayInfo:${dateObj.day}-${dateObj.month}-${dateObj.year}`,
                    })
                  }
                >
                  <Text style={styles.dayText}>{dateObj.day}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ))}
    </View>
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
    fontSize: 17,
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
    backgroundColor: "rgba(255, 170, 0, 1)",
  },
  dayText: {
    color: "white",
    fontWeight: "bold",
  },

  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  monthTitle: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
    textTransform: "capitalize",
  },
});