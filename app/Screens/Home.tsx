import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Alert, Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { RefreshControl } from "react-native-gesture-handler";
import Dashboard from "../components/Dashboard";
import MealCard from "../components/MealCard";
import { exportAllInfoString, importAllInfoString } from "../db/DaySqlLiteCRUD";
import { eventBus } from "../utils/EventBus";

const { width, height } = Dimensions.get("window");

export default function Home() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [importing, setImporting] = useState(false);

  const today = new Date();
  const currentDay = today.getDate();
  const defaultKey = `dayInfo:${currentDay}-${today.getMonth() + 1}-${today.getFullYear()}`;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 20 }}>
          <TouchableOpacity onPress={() => setImporting(true)}>
            <MaterialCommunityIcons name="file-download-outline" size={30} color="rgba(255, 170, 0, 1)" />
          </TouchableOpacity>
          <TouchableOpacity style={{ marginLeft: 20 }} onPress={() => handelExport()}>
            <MaterialCommunityIcons name="file-upload-outline" size={30} color="rgba(255, 170, 0, 1)" />
          </TouchableOpacity>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={() => (navigation as any).navigate("RecepyScreen")}>
          <MaterialCommunityIcons style={{ marginRight: 20 }} name="book-open-variant" size={30} color="rgba(255, 170, 0, 1)" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    onRefresh();
  }, []);

  useEffect(() => {
    const handler = () => {
      onRefresh();
    };

    eventBus.on('REFRESH_HOME', handler);

    return () => {
      eventBus.off('REFRESH_HOME', handler);
    };
  }, []);

  const renderMealCards = () => {
    return <MealCard dayInfoKey={defaultKey} refreshTrigger={refreshTrigger} isTodayMeal={true} />;
  };

  const renderModalImport = () => {
    return (
      <>
        <Modal
          animationType="fade"
          transparent
          visible={importing}
          onRequestClose={() => setImporting(false)}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.7)" }} />
        </Modal>
        <Modal
          animationType="slide"
          transparent
          visible={importing}
          onRequestClose={() => setImporting(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContainer}
            onPress={() => setImporting(false)}
          >
            <View style={styles.modalView}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalText}>Importar archivos</Text>
              </View>

              <View style={{ width: '90%' }}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    handleImport();
                    setImporting(false);
                  }}
                >
                  <Text style={styles.buttonText}>Seleccionar archivo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setImporting(false);
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  }

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || !result.assets[0]) return;

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const success = await importAllInfoString(fileContent);

      if (success) {
        Alert.alert("Importación exitosa", "Los datos se han importado correctamente.");
        eventBus.emit('REFRESH_HOME');
      } else {
        Alert.alert("Error", "No se pudieron importar los datos.");
      }
    } catch (error) {
      console.error("Error al importar archivo:", error);
      Alert.alert("Error", "No se pudo leer o procesar el archivo.");
    }
  };

  const handelExport = async () => {
    try {
      const dataString = await exportAllInfoString();

      const fileUri = FileSystem.documentDirectory + 'datos_exportados' + new Date(Date.now()).toDateString() + '.json';
      await FileSystem.writeAsStringAsync(fileUri, dataString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(fileUri);

    } catch (error) {
      console.error("Error exportando archivo:", error);
      Alert.alert("Error", "No se pudo exportar el archivo.");
    }
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          progressBackgroundColor="rgba(90, 90, 90, 1)"
          colors={["rgba(255, 170, 0, 1)"]}
        />
      }
    >
      {renderModalImport()}
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
    backgroundColor: "rgba(30, 30, 30, 1)",
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
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalView: {
    backgroundColor: "rgba(35, 35, 35, 1)",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(70, 70, 70, 1)",
    alignItems: "center",
    overflow: "hidden",
  },
  modalTitleContainer: {
    paddingTop: 20,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalButton: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: "rgba(65, 65, 65, 1)",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 18,
  },
  modalCancelButton: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: "rgba(65, 65, 65, 1)",
  },
  modalCancelButtonText: {
    color: "red",
    textAlign: "center",
    fontSize: 18,
  },
  modalText: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 18,
    marginBottom: 10,
  },
});