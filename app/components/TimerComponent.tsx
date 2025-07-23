import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, ScrollView, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TimerComponent() {
  const [inputTime, setInputTime] = useState(0);
  const [timers, setTimers] = useState<{ id: string; remaining: number }[]>([]);

  // Añadir nuevo temporizador
  const addTimer = async () => {
    const seconds = inputTime;
    const id = `timer_${Date.now()}`;
    const newTimer = { id, remaining: seconds };

    setTimers((prev) => [...prev, newTimer]);
    await AsyncStorage.setItem(id, JSON.stringify(newTimer));
    setInputTime(0);
  };

  // Cargar temporizadores guardados
  useEffect(() => {
    const loadTimers = async () => {
      const keys = await AsyncStorage.getAllKeys();
      const timerKeys = keys.filter((key) => key.startsWith("timer_"));
      const data = await AsyncStorage.multiGet(timerKeys);
      const loadedTimers = data
        .map(([, value]) => (value ? JSON.parse(value) : null))
        .filter((t) => t && t.remaining > 0);
      setTimers(loadedTimers);
    };
    loadTimers();
  }, []);

  // Contador cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) =>
        prev.map((timers) => ({ ...timers, remaining: timers.remaining - 1 }))
          .filter((timer) => timer.remaining > 0)
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Actualizar almacenamiento
  useEffect(() => {
    timers.forEach((timer) => {
      AsyncStorage.setItem(timer.id, JSON.stringify(timer));
    });
  }, [timers]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <ScrollView style={{ padding: 20 }}>

      <TextInput
        value={inputTime.toString()}
        onChangeText={(text) => setInputTime(parseInt(text))}
        placeholder="Tiempo en segundos"
        keyboardType="numeric"
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <Button title="Iniciar Temporizador" onPress={addTimer} />
      <Text style={{ marginTop: 20, fontSize: 18, fontWeight: "bold" }}>
        Temporizadores activos:
      </Text>
      {timers.map((timers) => (
        <View key={timers.id} style={{ marginVertical: 10 }}>
          <Text style={styles.timerCard}>
            ⏱ {formatTime(timers.remaining)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  timerContainer: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    marginBottom: 10,
  },
  timerText: {
    fontSize: 16,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  timerCard: {
    backgroundColor: "rgba(35, 80, 120, 1)",
    borderRadius: 10,
    padding: 15,
    color: "rgba(255, 255, 255, 1)",
    fontSize: 18,
    textAlign: "center",
  },
});
