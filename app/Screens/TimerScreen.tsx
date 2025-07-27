import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import CircleTimeComponent from "../components/CircleTimeComponent";
import * as Notifications from 'expo-notifications';
import { handleTimerNotifResponse, scheduleNotifAsync } from '../utils/Notification';

export default function TimerScreen() {
  const navigation = useNavigation();

  const [inputSeconds, setInputSeconds] = useState(0);
  const [inputMinutes, setInputMinutes] = useState(0);
  const [inputHours, setInputHours] = useState(0);

  const [inputTitle, setInputTitle] = useState("");

  const [addingCrono, setAddingCrono] = useState(false);
  const [addingTimer, setAddingTimer] = useState(false);
  const [timers, setTimers] =
    useState<{
      id: string;
      title: string;
      remaining: number;
      startTime: number;
      up: boolean;
      paused: boolean;
      sentNotif: boolean;
      addedTime: number;
    }[]>([]);

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

    const newTimer = {
      id,
      remaining: inputTotalSeconds,
      title: inputTitle,
      startTime: inputTotalSeconds,
      up: false,
      paused: false,
      sentNotif: false,
      addedTime: 0
    };

    setTimers((prev) => [...prev, newTimer]);
    await AsyncStorage.setItem(id, JSON.stringify(newTimer));
    setInputSeconds(0);
    setInputMinutes(0);
    setInputHours(0);
    setInputTitle("");
  };

  const addCrono = async () => {
    const id = `timer_${Date.now()}`;
    const newTimer = {
      id,
      remaining: -1,
      title: inputTitle,
      startTime: 0,
      up: true,
      paused: false,
      sentNotif: false,
      addedTime: 0
    };

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

          if (nextTime <= 0 && !timer.up && !timer.sentNotif) {
            scheduleNotifAsync(
              timer.title,
              "El temporizador ha terminado",
              { timer: { id: timer.id } },
              'default',
              'timer-actions'
            );
            return {
              ...timer,
              remaining: nextTime,
              sentNotif: true,
            };
          }

          return {
            ...timer,
            remaining: nextTime,
          };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = handleTimerNotifResponse(async (action, timerData, notificationId) => {
      if (!timerData?.id) return;

      await Notifications.dismissNotificationAsync(notificationId);

      setTimers((prev) =>
        prev.map((timer) => {
          if (timer.id !== timerData.id) return timer;

          if (action === 'DISMISS_ONE_TIMER') {
            return {
              ...timer,
              remaining: 60,
              addedTime: 60,
              sentNotif: false,
            };
          }

          if (action === 'DISMISS_FIVE_TIMER') {
            return {
              ...timer,
              remaining: 300,
              addedTime: 300,
              sentNotif: false,
            };
          }

          if (action === 'STOP_TIMER') {
            return {
              ...timer,
              paused: true,
            };
          }

          return timer;
        })
      );
    });

    return unsubscribe;
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
            placeholderTextColor={"rgba(255, 255, 255, 0.7)"}
            onChangeText={setInputTitle} />
          <View style={{ flexDirection: "row", }}>
            <TextInput
              style={styles.inputTime}
              placeholder="00"
              placeholderTextColor={"rgba(255, 255, 255, 0.7)"}
              keyboardType="numeric"
              onChangeText={(text) => setInputHours(parseInt(text) || 0)}
            />
            <Text style={styles.inputSep}>:</Text>
            <TextInput
              style={styles.inputTime}
              placeholder="00"
              placeholderTextColor={"rgba(255, 255, 255, 0.7)"}
              keyboardType="numeric"
              onChangeText={(text) => setInputMinutes(parseInt(text) || 0)}
            />
            <Text style={styles.inputSep}>:</Text>
            <TextInput
              style={styles.inputTime}
              placeholder="00"
              placeholderTextColor={"rgba(255, 255, 255, 0.7)"}
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
            placeholderTextColor={"rgba(255, 255, 255, 0.7)"}

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
              addedTime={timer.addedTime}
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
                onPress={() => timer.paused ? handleDeleteTimer(timer.id) : handleRestartTime(timer.id)}
              >
                <MaterialCommunityIcons name={timer.paused ? "trash-can-outline" : "restart"} size={30} color={timer.paused ? "rgba(255, 50, 50, 1)" : "rgba(255, 255, 255, 1)"} />
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

  const handleRestartTime = (id: string) => {
    setTimers((prev) =>
      prev.map((timer) =>
        timer.id === id ? {
          ...timer,
          remaining: timer.startTime,
          addedTime: 0,
          sentNotif: false
        } : timer
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
    paddingHorizontal: 10,
    color: "rgba(255, 255, 255, 1)",
    fontWeight: "bold",
    fontSize: 16,
    height: 40,
    width: 290,
  },
  inputTime: {
    color: "rgba(255, 255, 255, 1)",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 20,
    alignSelf: "center",
    width: 75,
    marginHorizontal: 10,
  },
  inputSep: {
    color: "rgba(255, 255, 255, 1)",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 20,
    alignSelf: "center",
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
    backgroundColor: "rgba(100, 100, 100, 0.9)",
  },
  modalView: {
    backgroundColor: "rgba(55, 55, 55, 1)",
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
    color: "rgba(255, 255, 255, 1)",
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
    color: "rgba(255, 255, 255, 1)",
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
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 1)",
    paddingVertical: 10,
    textAlign: "center",
    width: "100%"
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
