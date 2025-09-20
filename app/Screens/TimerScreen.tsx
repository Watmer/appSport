import { MaterialCommunityIcons } from "@expo/vector-icons";
import notifee from '@notifee/react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import CircleTimeComponent from "../components/CircleTimeComponent";
import { eventBus } from "../utils/EventBus";
import { cancelNotifAsync, handleTimerNotifResponse, scheduleNotifAsync } from '../utils/Notification';

export default function TimerScreen() {
  const navigation = useNavigation();

  const [inputSeconds, setInputSeconds] = useState(0);
  const [inputMinutes, setInputMinutes] = useState(0);
  const [inputHours, setInputHours] = useState(0);

  const [inputTitle, setInputTitle] = useState("");

  const [addingCrono, setAddingCrono] = useState(false);
  const [addingTimer, setAddingTimer] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [editingTime, setEditingTime] = useState(false);

  interface Timer {
    id: string;
    remaining: number;
    totalDuration: number;
    initialDuration: number;
    title: string;
    startTime: Date;
    up: boolean;
    paused: boolean;
    sentNotif: boolean;
    notificationId: string | null;
  }

  const [timers, setTimers] =
    useState<Timer[]>([]);

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
    const startTime = new Date();

    let notificationId: string | null = null;

    notificationId = await createNotifAsync(inputTitle, id, inputTotalSeconds);

    const newTimer: Timer = {
      id,
      remaining: inputTotalSeconds,
      totalDuration: inputTotalSeconds,
      initialDuration: inputTotalSeconds,
      title: inputTitle,
      startTime,
      up: false,
      paused: false,
      sentNotif: false,
      notificationId: notificationId ?? null,
    };

    setTimers((prev) => [...prev, newTimer]);

    await AsyncStorage.setItem(
      id,
      JSON.stringify({
        ...newTimer,
        startTime: startTime.toISOString(),
      })
    );

    setInputSeconds(0);
    setInputMinutes(0);
    setInputHours(0);
    setInputTitle("");
  };

  const addCrono = async () => {
    const id = `timer_${Date.now()}`;

    const startTime = new Date();

    const newCrono = {
      id,
      remaining: 0,
      totalDuration: 0,
      initialDuration: 0,
      title: inputTitle,
      startTime: startTime,
      up: true,
      paused: false,
      sentNotif: false,
      notificationId: null,
    };

    setTimers((prev) => [...prev, newCrono]);
    await AsyncStorage.setItem(id, JSON.stringify({
      ...newCrono,
      startTime: newCrono.startTime.toISOString()
    }));
    setInputTitle("");
  };

  const handleUpdateTimerTitle = async (id: string, newTitle: string) => {
    setTimers((prevTimers) =>
      prevTimers.map((timer) =>
        timer.id === id ?
          { ...timer, title: newTitle }
          : timer
      )
    );

    try {
      const existing = await AsyncStorage.getItem(id);
      if (existing) {
        const timerData = JSON.parse(existing);
        timerData.title = newTitle;
        await AsyncStorage.setItem(id, JSON.stringify(timerData));
      }
    } catch (error) {
      console.error("Error actualizando título en AsyncStorage:", error);
    }
  };

  const handleUpdateTimerDuration = async (id: string) => {
    if (inputHours !== 0 || inputMinutes !== 0 || inputSeconds !== 0) {
      const newDuration = inputHours * 3600 + inputMinutes * 60 + inputSeconds;
      const now = new Date();

      const oldTimer = timers.find((timer) => timer.id === id);
      if (oldTimer?.notificationId) {
        await cancelNotifAsync(oldTimer.notificationId);
      }
      let newNotificationId = null;
      if (oldTimer?.paused) {
        newNotificationId = await createNotifAsync(oldTimer?.title, oldTimer?.id, newDuration);
      }

      setTimers((prevTimers) =>
        prevTimers.map((timer) =>
          timer.id === id
            ? {
              ...timer,
              totalDuration: newDuration,
              remaining: newDuration,
              initialDuration: newDuration,
              startTime: now,
              notificationId: newNotificationId ?? null,
              sentNotif: false,
            }
            : timer
        )
      );

      await AsyncStorage.setItem(
        id,
        JSON.stringify({
          ...oldTimer,
          totalDuration: newDuration,
          remaining: newDuration,
          initialDuration: newDuration,
          startTime: now.toISOString(),
          notificationId: newNotificationId ?? null,
        })
      );
    }
    setEditingTime(false);
    setInputHours(0);
    setInputMinutes(0);
    setInputSeconds(0);
  };

  const createNotifAsync = async (
    title: string,
    id: string,
    remaining?: number
  ) => {
    return await scheduleNotifAsync(
      title,
      "El temporizador ha terminado",
      { timer: { id } },
      "timersound",
      remaining
    );
  };

  const loadTimers = async () => {
    const keys = await AsyncStorage.getAllKeys();
    const timerKeys = keys.filter((key) => key.startsWith("timer_"));
    const data = await AsyncStorage.multiGet(timerKeys);

    const loaded = data.map(([, value]) => {
      if (!value) return null;
      const parsed = JSON.parse(value);
      return {
        ...parsed,
        startTime: new Date(parsed.startTime),
      };
    });
    setTimers(loaded.slice().sort((a, b) => {
      return a.remaining - b.remaining;
    }));
  };

  useEffect(() => {
    const handler = () => {
      loadTimers();
    };
    eventBus.on('timersUpdated', handler);

    return () => {
      eventBus.off('timersUpdated', handler);
    };
  }, []);

  useEffect(() => {
    loadTimers();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const sortedTimers = [...prev].sort((a, b) => a.remaining - b.remaining);
        return sortedTimers.map((timer) => {
          if (timer.paused) return timer;

          const now = new Date();
          const elapsed = (now.getTime() - new Date(timer.startTime).getTime()) / 1000;

          const currentRemaining = timer.up
            ? elapsed
            : Math.max(timer.totalDuration - elapsed, 0);

          if (currentRemaining <= 0 && !timer.up && !timer.sentNotif) {
            return {
              ...timer,
              remaining: 0,
              sentNotif: true,
            };
          }

          return {
            ...timer,
            remaining: currentRemaining,
          };
        });
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = handleTimerNotifResponse(
      async (action, timerData, notificationId) => {
        if (!timerData?.id) return;

        await notifee.cancelNotification(notificationId);

        const timer = timers.find((timer) => timer.id === timerData.id);
        if (!timer) return;

        if (action === "DISMISS_ONE_TIMER") {
          if (timer.notificationId) {
            await cancelNotifAsync(timer.notificationId);
          }
          const newNotificationId = await createNotifAsync(timer.title, timer.id, 60);
          setTimers((prev) =>
            prev.map((timer) =>
              timer.id === timerData.id
                ? {
                  ...timer,
                  startTime: new Date(),
                  totalDuration: 60,
                  remaining: 60,
                  sentNotif: false,
                  notificationId: newNotificationId ?? null,
                }
                : timer
            )
          );
        }

        else if (action === "DISMISS_FIVE_TIMER") {
          if (timer.notificationId) {
            await cancelNotifAsync(timer.notificationId);
          }
          const newNotificationId = await createNotifAsync(timer.title, timer.id, 300);
          setTimers((prev) =>
            prev.map((timer) =>
              timer.id === timerData.id
                ? {
                  ...timer,
                  startTime: new Date(),
                  totalDuration: 300,
                  remaining: 300,
                  sentNotif: false,
                  notificationId: newNotificationId ?? null,
                }
                : timer
            )
          );
        }

        else if (action === "STOP_TIMER") {
          setTimers((prev) =>
            prev.map((timer) =>
              timer.id === timerData.id ? { ...timer, paused: true } : timer
            )
          );
        }

        else {
          (navigation as any).navigate("TimerScreen");
        }
      }
    );

    return unsubscribe;
  }, [timers, navigation]);

  useEffect(() => {
    timers.forEach(async (timer) => {
      await AsyncStorage.setItem(timer.id, JSON.stringify(timer));
    });
  }, [timers]);

  const renderModalTimer = () => (
    <Modal
      animationType="fade"
      transparent
      visible={addingTimer}
      onRequestClose={() => setAddingTimer(false)}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setAddingTimer(false)}
        style={styles.modalContainer}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Introduce el tiempo:</Text>
          <TextInput
            style={styles.inputTitle}
            placeholder="Titulo del temporizador"
            placeholderTextColor={"rgba(255, 255, 255, 0.7)"}
            onChangeText={setInputTitle}
            selectionColor={"rgba(255, 170, 0, 0.5)"}
            selectionHandleColor={"rgba(255, 170, 0, 1)"}
            cursorColor={"rgba(255, 170, 0, 1)"}
          />
          <View style={{ flexDirection: "row", }}>
            <TextInput
              style={styles.inputTime}
              placeholder="00"
              placeholderTextColor={"rgba(255, 255, 255, 0.7)"}
              keyboardType="numeric"
              onChangeText={(text) => setInputHours(parseInt(text) || 0)}
              selectionColor={"rgba(255, 170, 0, 0.5)"}
              selectionHandleColor={"rgba(255, 170, 0, 1)"}
              cursorColor={"rgba(255, 170, 0, 1)"}
            />
            <Text style={styles.inputSep}>:</Text>
            <TextInput
              style={styles.inputTime}
              placeholder="00"
              placeholderTextColor={"rgba(255, 255, 255, 0.7)"}
              keyboardType="numeric"
              onChangeText={(text) => setInputMinutes(parseInt(text) || 0)}
              selectionColor={"rgba(255, 170, 0, 0.5)"}
              selectionHandleColor={"rgba(255, 170, 0, 1)"}
              cursorColor={"rgba(255, 170, 0, 1)"}
            />
            <Text style={styles.inputSep}>:</Text>
            <TextInput
              style={styles.inputTime}
              placeholder="00"
              placeholderTextColor={"rgba(255, 255, 255, 0.7)"}
              keyboardType="numeric"
              onChangeText={(text) => setInputSeconds(parseInt(text) || 0)}
              selectionColor={"rgba(255, 170, 0, 0.5)"}
              selectionHandleColor={"rgba(255, 170, 0, 1)"}
              cursorColor={"rgba(255, 170, 0, 1)"}
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
      </TouchableOpacity>
    </Modal>
  );

  const renderModalCrono = () => (
    <Modal
      animationType="fade"
      transparent
      visible={addingCrono}
      onRequestClose={() => setAddingCrono(false)}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setAddingCrono(false)}
        style={styles.modalContainer}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Introduce el tiempo:</Text>
          <TextInput
            style={styles.inputTitle}
            placeholder="Titulo del cronometro"
            placeholderTextColor={"rgba(255, 255, 255, 0.7)"}
            selectionColor={"rgba(255, 170, 0, 0.5)"}
            selectionHandleColor={"rgba(255, 170, 0, 1)"}
            cursorColor={"rgba(255, 170, 0, 1)"}
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
      </TouchableOpacity>
    </Modal>
  );

  const renderModalEdit = () => {
    const timer = timers.find((item) => item.id === editId);
    if (!timer) return;
    return (
      <Modal
        animationType="fade"
        transparent
        visible={editing}
        onRequestClose={() => {
          if (editingTime) {
            setEditingTime(false);
          } else {
            setEditing(false);
            setEditId("");
          }
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setEditing(false);
            setEditingTime(false);
            setEditId("");
          }}
          style={styles.modalContainer}
        >
          <View key={timer.id} style={styles.modalTimerContainer}>
            <View style={styles.modalTimerTextContainer}>
              {timer.up ? (
                <MaterialCommunityIcons name="timer" size={35} color="rgba(255, 255, 255, 1)" />
              ) : (
                <MaterialCommunityIcons name="timer-sand" size={35} color="rgba(255, 255, 255, 1)" />
              )}
              <TextInput
                style={styles.modalTimerInputText}
                multiline={true}
                defaultValue={timer.title}
                onEndEditing={(e) => handleUpdateTimerTitle(timer.id, e.nativeEvent.text)}
                placeholder="Título..."
                placeholderTextColor={"rgba(255, 255, 255, 0.7)"}
                selectionColor={"rgba(255, 170, 0, 0.5)"}
                selectionHandleColor={"rgba(255, 170, 0, 1)"}
                cursorColor={"rgba(255, 170, 0, 1)"}
              />
              <TouchableOpacity
                style={{ paddingRight: 10 }}
                onPress={() => {
                  if (editingTime) {
                    setEditingTime(false);
                  } else {
                    setEditing(false);
                    setEditId("");
                  }
                }}>
                <MaterialCommunityIcons name="close" size={35} color={"rgba(255, 50, 50, 1)"} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              activeOpacity={!timer.up ? 0 : 1}
              onPress={() => {
                if (!timer.up) {
                  setEditingTime(true);
                  if (!timer.paused) {
                    handlePauseTimer(timer.id);
                  }
                }
              }}
            >
              {editingTime ?
                (<View style={{ margin: 10, flexDirection: "row", alignSelf: "center" }}>
                  <TextInput
                    style={[styles.inputTime, { fontSize: 30 }]}
                    placeholder={Math.floor(timer.totalDuration / 3600).toString().padStart(2, '0')}
                    placeholderTextColor={"rgba(255, 255, 255, 0.5)"}
                    keyboardType="numeric"
                    onChangeText={(text) => setInputHours(parseInt(text) || 0)}
                    selectionColor={"rgba(255, 170, 0, 0.5)"}
                    selectionHandleColor={"rgba(255, 170, 0, 1)"}
                    cursorColor={"rgba(255, 170, 0, 1)"}
                  />
                  <Text style={[styles.inputSep, { fontSize: 30 }]}>:</Text>
                  <TextInput
                    style={[styles.inputTime, { fontSize: 30 }]}
                    placeholder={(Math.floor(timer.totalDuration / 60) % 60).toString().padStart(2, '0')}
                    placeholderTextColor={"rgba(255, 255, 255, 0.5)"}
                    keyboardType="numeric"
                    onChangeText={(text) => setInputMinutes(parseInt(text) || 0)}
                    selectionColor={"rgba(255, 170, 0, 0.5)"}
                    selectionHandleColor={"rgba(255, 170, 0, 1)"}
                    cursorColor={"rgba(255, 170, 0, 1)"}
                  />
                  <Text style={[styles.inputSep, { fontSize: 30 }]}>:</Text>
                  <TextInput
                    style={[styles.inputTime, { fontSize: 30 }]}
                    placeholder={Math.floor(timer.totalDuration % 60).toString().padStart(2, '0')}
                    placeholderTextColor={"rgba(255, 255, 255, 0.5)"}
                    keyboardType="numeric"
                    onChangeText={(text) => setInputSeconds(parseInt(text) || 0)}
                    selectionColor={"rgba(255, 170, 0, 0.5)"}
                    selectionHandleColor={"rgba(255, 170, 0, 1)"}
                    cursorColor={"rgba(255, 170, 0, 1)"}
                  />
                </View>)
                : (<CircleTimeComponent
                  currentTime={timer.remaining}
                  up={timer.up}
                  paused={timer.paused}
                  totalDuration={timer.totalDuration}
                  size={200}
                />)
              }
            </TouchableOpacity>
            <View style={{ margin: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
              <TouchableOpacity
                onPress={() => {
                  handlePauseTimer(timer.id);
                  setEditingTime(false);
                }}
              >
                <MaterialCommunityIcons
                  name={timer.paused ? "play" : "pause"} size={40} color="rgba(255, 255, 255, 1)"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteTimer(timer.id)}
              >
                <MaterialCommunityIcons name={"trash-can-outline"} size={35} color={"rgba(255, 50, 50, 1)"} />
              </TouchableOpacity>
              {!editingTime ?
                (<TouchableOpacity
                  onPress={() => handleRestartTime(timer.id)}
                >
                  <MaterialCommunityIcons name={"restart"} size={40} color={"rgba(255, 255, 255, 1)"} />
                </TouchableOpacity>)
                : (<TouchableOpacity
                  onPress={() => handleUpdateTimerDuration(timer.id)}
                >
                  <MaterialCommunityIcons name={"check"} size={40} color={"rgba(255, 255, 255, 1)"} />
                </TouchableOpacity>)}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderTimers = () => {
    return (
      timers.length > 0 ? (
        timers.map((timer) => (
          <TouchableOpacity
            onPress={() => {
              setEditId(timer.id);
              setEditing(true);
            }}
            key={timer.id}
            style={styles.timerContainer}
          >
            <View style={styles.timerTextContainer}>
              {timer.up ? (
                <MaterialCommunityIcons name="timer" size={30} color="rgba(255, 255, 255, 1)" />
              ) : (
                <MaterialCommunityIcons name="timer-sand" size={30} color="rgba(255, 255, 255, 1)" />
              )}
              <Text style={styles.timerText}>{timer.title}</Text>
            </View>
            <CircleTimeComponent
              currentTime={timer.remaining}
              up={timer.up}
              paused={timer.paused}
              totalDuration={timer.totalDuration}
              size={120}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
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
                <MaterialCommunityIcons name={"trash-can-outline"} size={27} color={"rgba(255, 50, 50, 1)"} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleRestartTime(timer.id)}
              >
                <MaterialCommunityIcons name={"restart"} size={30} color={"rgba(255, 255, 255, 1)"} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity >
        ))
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={styles.timerText}>No hay temporizadores</Text>
        </View>
      )
    );
  };

  const handleDeleteTimer = async (id: string) => {
    const timer = timers.find((timer) => timer.id === id);
    if (timer?.notificationId) {
      await cancelNotifAsync(timer.notificationId);
    }
    await AsyncStorage.removeItem(id);
    setTimers((prev) => prev.filter((timer) => timer.id !== id));
  };

  const handlePauseTimer = async (id: string) => {
    const updatedTimers: Timer[] = [];

    for (const timer of timers) {
      if (timer.id !== id) {
        updatedTimers.push(timer);
        continue;
      }

      if (timer.paused) {
        if (timer.notificationId) {
          await cancelNotifAsync(timer.notificationId);
        }

        const now = Date.now();
        const newStartTime = timer.up
          ? new Date(now - timer.remaining * 1000)
          : new Date(now - (timer.totalDuration - timer.remaining) * 1000);

        let newNotifId: string | null = null;
        if (!timer.up) {
          newNotifId = await createNotifAsync(timer.title, id, timer.remaining);
        }

        updatedTimers.push({
          ...timer,
          startTime: newStartTime,
          paused: false,
          notificationId: newNotifId ?? null,
        });
      } else {
        if (timer.notificationId) {
          await cancelNotifAsync(timer.notificationId);
        }
        updatedTimers.push({ ...timer, paused: true, notificationId: null });
      }
    }

    setTimers(updatedTimers);
  };

  const handleRestartTime = async (id: string) => {
    const timer = timers.find((t) => t.id === id);
    if (!timer) return;

    if (timer.notificationId) {
      await cancelNotifAsync(timer.notificationId);
    }

    let notifId: string | null = null;

    if (!timer.paused && !timer.up) {
      notifId = await createNotifAsync(timer.title, timer.id, timer.initialDuration);
    }

    setTimers((prev) =>
      prev.map((timer) =>
        timer.id === id
          ? {
            ...timer,
            startTime: new Date(),
            remaining: timer.initialDuration,
            totalDuration: timer.initialDuration,
            sentNotif: false,
            notificationId: notifId ?? null,
          }
          : timer
      )
    );
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        {renderModalCrono()}
        {renderModalTimer()}
        {renderModalEdit()}
        {renderTimers()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "rgba(30, 30, 30, 1)",
    width: "100%",
  },
  container: {
    flex: 1,
    marginTop: 40,
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
    backgroundColor: "rgba(0, 50, 120, 1)",
    borderRadius: 15,
    marginBottom: 10,
    justifyContent: "center",
    padding: 10,
    width: 173,
    minHeight: 173,
    borderWidth: 0.2,
    borderColor: "rgba(255, 255, 255, 0.5)"
  },
  timerText: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 18,
  },
  modalTimerInputText: {
    width: "90%",
    fontSize: 22,
    color: "rgba(255, 255, 255, 1)",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalView: {
    backgroundColor: "rgba(35, 35, 35, 1)",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(70, 70, 70, 1)",
    padding: 10,
    alignItems: "center",
    overflow: "hidden",
    width: "85%",
  },
  modalButton: {
    flex: 1,
    backgroundColor: "rgba(65, 65, 65, 1)",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    margin: 2,
    justifyContent: 'center',
  },
  buttonText: {
    color: "rgba(255, 255, 255, 1)",
    textAlign: "center",
    fontSize: 16,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "rgba(65, 65, 65, 1)",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    margin: 2,
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    color: "rgba(255, 0, 0, 1)",
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
  timerTextContainer: {
    flexDirection: "row",
    width: "80%",
    paddingRight: 10,
    alignItems: "center",
    gap: 10,
  },
  modalTimerContainer: {
    backgroundColor: "rgba(0, 50, 120, 1)",
    borderRadius: 15,
    marginBottom: 10,
    justifyContent: "center",
    padding: 10,
    width: "85%",
    borderWidth: 0.2,
    borderColor: "rgba(255, 255, 255, 0.5)"
  },
  modalTimerTextContainer: {
    flexDirection: "row",
    width: "80%",
    paddingRight: 10,
    alignItems: "center",
    gap: 10,
  },
});
