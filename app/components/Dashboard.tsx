import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { addFailedDay, addFrozenDay, addStreak, addStreakDay, getDayInfo, getLastFailedDay, getOrderedDays, removeFailedDay } from "../db/DaySqlLiteCRUD";
import { eventBus } from "../utils/EventBus";

const { width, height } = Dimensions.get("window");
const daysOfWeek = ["L", "M", "X", "J", "V", "S", "D"];

export default function Dashboard({ refreshTrigger }: { refreshTrigger: number }) {
  const navigation = useNavigation();
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth());
  const [visibleYear, setVisibleYear] = useState(today.getFullYear());
  const currentDay = today.getDate();
  const [streak, setStreak] = useState(0);

  const startDate = new Date(visibleYear, visibleMonth, 1);
  startDate.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7));

  const dates = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return {
      day,
      month,
      year,
      key: `${day}-${month}-${year}`,
      isCurrentMonth: month === visibleMonth + 1 && year === visibleYear,
      isToday: day === currentDay && month === today.getMonth() + 1 && year === today.getFullYear(),
    };
  });

  const weeks = Array.from({ length: 6 }, (_, i) => dates.slice(i * 7, i * 7 + 7));
  const [streakDays, setStreakDays] = useState<any[]>([]);
  const [failedDays, setFailedDays] = useState<any[]>([]);
  const [frozenDays, setFrozenDays] = useState<any[]>([]);

  useEffect(() => {
    fetchDayInfo();
  }, [visibleMonth, visibleYear]);

  useEffect(() => {
    (async () => {
      await fetchDayInfo();
      await fetchContinuousStreak();
    })();
  }, [refreshTrigger]);

  const fetchDayInfo = async () => {
    const daysStreak: string[] = [];
    const daysFailed: string[] = [];
    const frozen: string[] = [];

    for (const week of weeks) {
      let frozenAdded = false;

      for (const { day, month, year, key, isToday } of week) {
        const dayId = `dayInfo:${key}`;
        const dayData = await getDayInfo(dayId);

        const isStreak = dayIsStreak(dayData?.meals);
        const isFailed = dayIsFailed(dayData?.meals);

        if (isStreak) {
          daysStreak.push(key);
          await addStreakDay(dayId);
          await removeFailedDay(dayId);
        } else if (isFailed) {
          if (!frozenAdded) {
            frozen.push(key);
            frozenAdded = true;
            await addFrozenDay(dayId);
            await removeFailedDay(dayId);
          } else {
            if (!isToday) {
              daysFailed.push(key);
              await addFailedDay(dayId);
            }
          }
        }
      }
    }

    setStreakDays(daysStreak);
    setFailedDays(daysFailed);
    setFrozenDays(frozen);

    eventBus.emit('REFRESH_STREAKDAYS_WIDGET');
  };

  const dayIsStreak = (meals: any[] | undefined): boolean => {
    if (!meals || meals.length === 0) return false;
    return meals.every(meal => meal.completed === 1);
  };

  const dayIsFailed = (meals: any[] | undefined): boolean => {
    if (!meals || meals.length === 0) return false;
    return meals.some(meal => meal.completed === 1) && meals.some(meal => meal.completed === 0);
  };

  const fetchContinuousStreak = async () => {
    const lastFailed = await getLastFailedDay();
    const orderedDays = await getOrderedDays();
    const firstDay = orderedDays[0];

    const referenceId = lastFailed?.id || firstDay?.id;

    if (!referenceId) {
      setStreak(0);
      return;
    }

    const [refDay, refMonth, refYear] = referenceId.replace("dayInfo:", "").split("-").map(Number);
    const referenceDate = new Date(refYear, refMonth - 1, refDay);

    const today = new Date();
    today.setDate(today.getDate() - 1);

    let count = 0;
    let current = new Date(today);
    let exit = false;

    while (!exit && referenceDate <= current) {
      const dayKey = `dayInfo:${current.getDate()}-${current.getMonth() + 1}-${current.getFullYear()}`;
      const dayInfo = await getDayInfo(dayKey);

      if (dayIsStreak(dayInfo?.meals)) {
        count++;
      } else if (dayIsFailed(dayInfo?.meals)) {
        let nFailed = 0;

        const startOfWeek = new Date(current);
        const dayOfWeek = (startOfWeek.getDay() + 6) % 7;
        startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

        const checkDate = new Date(startOfWeek);
        while (checkDate <= current) {
          const checkKey = `dayInfo:${checkDate.getDate()}-${checkDate.getMonth() + 1}-${checkDate.getFullYear()}`;
          const checkInfo = await getDayInfo(checkKey);

          if (checkInfo && dayIsFailed(checkInfo.meals)) {
            nFailed++;
          }

          checkDate.setDate(checkDate.getDate() + 1);
        }

        if (nFailed > 1) {
          exit = true;
        }
      } else {
        exit = true;
      }

      current.setDate(current.getDate() - 1);
    }

    setStreak(count);
    await addStreak(count);
  };

  const handleCurrentDay = () => {
    setVisibleMonth(today.getMonth());
    setVisibleYear(today.getFullYear());
    fetchDayInfo();
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
      <TouchableOpacity onPress={() => handleCurrentDay()}>
        <Text style={styles.dashboardInfo}>{today.toLocaleString("default", {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric",
        })}</Text>
        <Text style={styles.dashboardInfo}>{streak > 1 ? "Dias de racha " + streak : null}</Text>
      </TouchableOpacity>

      <View style={styles.weekRow}>
        {daysOfWeek.map((d, i) => (
          <View key={i} style={styles.dayCell}>
            <Text style={styles.dayLabel}>{d}</Text>
          </View>
        ))}
      </View>

      {weeks.map((week, i) => (
        <View key={i} style={styles.weekRow}>
          {week.find((day) => day.isCurrentMonth) && week.map((dateObj, j) => {
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
                    isFrozen && { backgroundColor: "rgba(80, 225, 255, 1)" },
                    !dateObj.isCurrentMonth && { opacity: 0.35 },
                    dateObj.isToday && styles.todayCircle,
                  ]}
                  onPress={() =>
                    (navigation as any).navigate("FoodListScreen", {
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
  dashboardContainer: {
    flex: 1,
    maxWidth: height / 1.5,
    maxHeight: height / 1,
    backgroundColor: "rgba(60, 60, 60, 1)",
    borderRadius: 15,
    marginBottom: 20,
    padding: 10,
    alignSelf: "flex-end",
  },
  dashboardInfo: {
    fontSize: 17,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
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
    color: "rgba(255, 255, 255, 1)",
    fontWeight: "bold",
  },
  dayCircle: {
    width: "90%",
    height: "90%",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(95, 95, 95, 1)",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.2)"
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