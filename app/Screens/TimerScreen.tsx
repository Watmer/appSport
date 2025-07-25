import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import CircleTimeComponent from "../components/CircleTimeComponent";

export default function TimerScreen() {
  const navigation = useNavigation();

  const [inputSeconds, setInputSeconds] = useState(0);
  const [inputMinutes, setInputMinutes] = useState(0);
  const [inputHours, setInputHours] = useState(0);

  const [inputTitle, setInputTitle] = useState("");

  const [addingCrono, setAddingCrono] = useState(false);
  const [addingTimer, setAddingTimer] = useState(false);
  const [timers, setTimers] = useState<{ id: string; title: string; remaining: number; startTime: number; up: boolean, paused: boolean }[]>([]);
 
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center", marginRight: 20 }}>
          <TouchableOpacity style={{ marginRight: 20 }} onPress={() => setAddingCrono(true)} onLongPress={() => addCrono()}>
            <MaterialCommunityIcons name="timer" size={30} color="rgba(255, 170, 0, 1)" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setAddingTimer(true)}>
            <MaterialCommunityIcons name="timer-sand" size={30} color="rgba(255, 170, 0, 1)" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  const addTimer = async () => {
    const id = `timer_${Date.now()}`;
    const inputTotalSeconds = inputHours * 3600 + inputMinutes * 60 + inputSeconds;

    const newTimer = { id, remaining: inputSeconds, title: inputTitle, startTime: inputTotalSeconds, up: false, paused: false };

    setTimers((prev) => [...prev, newTimer]);
    await AsyncStorage.setItem(id, JSON.stringify(newTimer));
    setInputSeconds(0);
    setInputMinutes(0);
    setInputHours(0);
    setInputTitle("");
  };

  const addCrono = async () => {
    const id = `timer_${Date.now()}`;
    const newTimer = { id, remaining: 0, title: inputTitle, startTime: 0, up: true, paused: false };

    setTimers((prev) => [...prev, newTimer]);
    await AsyncStorage.setItem(id, JSON.stringify(newTimer));
    setInputTitle("");
  };

  const loadTimers = async () => {
    const keys = await AsyncStorage.getAllKeys();
    const timerKeys = keys.filter((key) => key.startsWith("timer_"));
    const data = await AsyncStorage.multiGet(timerKeys);

    const loaded = data
      .map(([, value]) => (value ? JSON.parse(value) : null))
      .filter(Boolean);
    setTimers(loaded);
  };

  useEffect(() => {
    loadTimers();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) =>
        prev.map((timer) => {
          if (timer.paused) return timer;
          const nextTime = timer.up ? timer.remaining + 1 : timer.remaining - 1;
          return {
            ...timer,
            remaining: Math.max(nextTime, 0),
          };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    timers.forEach((timer) => {
      AsyncStorage.setItem(timer.id, JSON.stringify(timer));
    });
  }, [timers]);

  const renderModalTimer = () => (
    <Modal
      animationType="fade"
      transparent
      visible={addingTimer}
      onRequestClose={() => setAddingTimer(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Introduce el tiempo:</Text>
          <TextInput
            style={styles.inputTitle}
            placeholder="Titulo del temporizador"
            onChangeText={setInputTitle}
          /><View style={{ flexDirection: "row", gap: 10 }}>
            <TextInput
              style={styles.inputTime}
              placeholder="horas"
              keyboardType="numeric"
              onChangeText={(text) => setInputHours(parseInt(text) || 0)}
            />
            <TextInput
              style={styles.inputTime}
              placeholder="minutos"
              keyboardType="numeric"
              onChangeText={(text) => setInputMinutes(parseInt(text) || 0)}
            />
            <TextInput
              style={styles.inputTime}
              placeholder="segundos"
              keyboardType="numeric"
              onChangeText={(text) => setInputSeconds(parseInt(text) || 0)}
            />
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                addTimer();
                setAddingTimer(false);
              }}
            >
              <Text style={styles.buttonText}>Iniciar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setAddingTimer(false);
                setInputSeconds(0);
              }}
            >
              <Text style={styles.modalCancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderModalCrono = () => (
    <Modal
      animationType="fade"
      transparent
      visible={addingCrono}
      onRequestClose={() => setAddingCrono(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Introduce el tiempo:</Text>
          <TextInput
            style={styles.inputTitle}
            placeholder="Titulo del cronometro"
            onChangeText={setInputTitle}
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                addCrono();
                setAddingCrono(false);
              }}
            >
              <Text style={styles.buttonText}>Iniciar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setAddingCrono(false);
                setInputTitle("");
              }}
            >
              <Text style={styles.modalCancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderTimers = () => {
    return (
      timers.length > 0 ? (
        timers.map((timer) => (
          <View key={timer.id} style={styles.timerContainer}>
            <View style={styles.timerTextContainer}>
              {timer.up ? (
                <MaterialCommunityIcons name="timer" size={30} color="rgba(255, 255, 255, 1)" />
              ) : (
                <MaterialCommunityIcons name="timer-sand" size={30} color="rgba(255, 255, 255, 1)" />
              )}
              <Text style={styles.timerText}>{timer.title}</Text>
            </View>
            <CircleTimeComponent
              startTime={timer.startTime}
              currentTime={timer.remaining}
              up={timer.up}
              paused={timer.paused}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => handlePauseTimer(timer.id)}
              >
                <MaterialCommunityIcons
                  name={timer.paused ? "play" : "pause"} size={30} color="rgba(255, 255, 255, 1)"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteTimer(timer.id)}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={30} color="rgba(255, 50, 50, 1)" />
              </TouchableOpacity>
            </View>
          </View >
        ))
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={styles.timerText}>No hay temporizadores</Text>
        </View>
      )
    );
  };

  const handleDeleteTimer = async (id: string) => {
    await AsyncStorage.removeItem(id);
    setTimers((prev) => prev.filter((timer) => timer.id !== id));
  }

  const handlePauseTimer = (id: string) => {
    setTimers((prev) =>
      prev.map((timer) =>
        timer.id === id ? { ...timer, paused: !timer.paused } : timer
      )
    );
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        {renderModalCrono()}
        {renderModalTimer()}
        {renderTimers()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "rgba(120, 120, 120, 1)",
    width: "100%",
  },
  container: {
    flex: 1,
    marginTop: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 15,
    alignItems: "baseline",
    gap: 15,
  },
  inputTitle: {
    borderColor: "rgba(200, 200, 200, 1)",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    color: "rgba(0, 0, 0, 1)",
    height: 40,
    width: 290,
  },
  inputTime: {
    borderColor: "rgba(200, 200, 200, 1)",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    color: "rgba(0, 0, 0, 1)",
    height: 40,
    width: 90,
  },
  timerContainer: {
    backgroundColor: "rgba(0, 85, 160, 1)",
    borderRadius: 15,
    marginBottom: 10,
    justifyContent: "center",
    padding: 10,
    width: 173,
    minHeight: 173,
  },
  timerText: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "rgba(0, 0, 0, 1)",
    borderRadius: 15,
    padding: 10,
    alignItems: "center",
    overflow: "hidden",
    width: "85%",
  },
  modalButton: {
    backgroundColor: "rgba(60, 80, 145, 1)",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: "47%",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
  },
  modalCancelButton: {
    backgroundColor: "rgba(250, 50, 50, 1)",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: "47%",
  },
  modalCancelButtonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
  },
  scrollModalContainer: {
    width: "100%",
  },
  modalText: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 18,
    marginBottom: 10,
  },
  modalButtonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
  },
  modalButtonButton: {
    backgroundColor: "rgba(200, 200, 200, 1)",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  modalButtonButtonText: {
    color: "black",
    textAlign: "center",
    fontSize: 16,
  },
  timerTextContainer: {
    flexDirection: "row",
    width: "80%",
    paddingHorizontal: 10,
    gap: 10,
  },
});
