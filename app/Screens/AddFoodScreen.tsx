import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getAsyncInfo, mergeAsyncInfo, setAsyncInfo } from "../components/AsyncStorageCRUD";

const { width, height } = Dimensions.get("window");

const meals = ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"];

export default function AddFoodScreen({ route }: { route: any }) {
  const { dayInfoKey } = route.params || {};

  const [ingredients, setIngredients] = useState([{ name: "", quantity: "" },]);
  const [foodName, setFoodName] = useState("");
  const [time, setTime] = useState(0);
  const [meal, setMeal] = useState("");

  const [showMealType, setShowMealType] = useState(false);

  const addIngredient = () =>
    setIngredients([...ingredients, { name: "", quantity: "" }]);

  const deleteIngredient = (i: number) =>
    setIngredients(ingredients.filter((_, index) => index !== i));

  const saveFoodInfo = async () => {
    const newFood = {
      meal,
      foodName,
      time,
      ingredients,
      completed: false,
    };

    try {
      const saved = await getAsyncInfo({ keyPath: dayInfoKey });

      if (!saved) {
        await setAsyncInfo({ keyPath: dayInfoKey, info: [newFood] });
      } else {
        const updatedArray = Array.isArray(saved) ? [...saved, newFood] : [saved, newFood];
        await setAsyncInfo({ keyPath: dayInfoKey, info: updatedArray });
      }
      alert("Comida guardada correctamente.");
    } catch (error) {
      console.error("Error guardando comida:", error);
      alert("Error guardando comida.");
    }
  };

  return (
    <ScrollView style={styles.scrollContainer}>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showMealType}
        onRequestClose={() => setShowMealType(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <ScrollView style={styles.scrollModalContainer}>
              {meals.map((meal) => (
                <TouchableOpacity
                  key={meal}
                  onPress={() => {
                    setMeal(meal);
                    setShowMealType(false);
                  }}
                  style={styles.modalOption}
                >
                  <Text style={styles.modalOptionText}>{meal}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.modalCancel}
              onPress={() => setShowMealType(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.label}>Tipo de comida:</Text>
          <TouchableOpacity onPress={() => setShowMealType(true)}>
            <Text style={[styles.input, { paddingVertical: 9 }]}>
              {meal ? meal : "Selecciona tipo de comida"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.label}>Nombre de la comida:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Tostada con Aguacate"
            placeholderTextColor="gray"
            onChangeText={setFoodName}
          />

          <Text style={styles.label}>Tiempo (min):</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 10"
            keyboardType="numeric"
            placeholderTextColor="gray"
            onChangeText={(text) => setTime(parseInt(text) || 0)}
          />

          <Text style={styles.label}>Ingredientes:</Text>
          {ingredients.map((item, i) => (
            <View key={i} style={styles.inputListGroup}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Ingrediente"
                value={item.name}
                onChangeText={(text) => {
                  const copy = [...ingredients];
                  copy[i].name = text;
                  setIngredients(copy);
                }}
                placeholderTextColor="gray"
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Cantidad"
                value={item.quantity}
                onChangeText={(text) => {
                  const copy = [...ingredients];
                  copy[i].quantity = text;
                  setIngredients(copy);
                }}
                placeholderTextColor="gray"
              />
              <TouchableOpacity onPress={() => deleteIngredient(i)}>
                <MaterialCommunityIcons
                  name="delete"
                  size={24}
                  color="rgba(255, 50, 50, 1)"
                />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity onPress={addIngredient} style={styles.addButton}>
            <Text style={styles.buttonText}>Añadir Ingrediente</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitButton} onPress={saveFoodInfo}>
            <Text style={styles.buttonText}>Guardar Comida</Text>
          </TouchableOpacity>
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
    padding: 20,
  },
  formContainer: {
    backgroundColor: "rgba(100, 100, 100, 1)",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 1)",
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: "rgba(200, 200, 200, 1)",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    color: "black",
  },
  inputListGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  addButton: {
    backgroundColor: "rgba(170, 170, 170, 1)",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: "rgba(255, 170, 0, 1)",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
  },
  scrollModalContainer: {
    width: "100%",
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
    width: width * 0.8,
    overflow: "hidden",
  },
  modalOption: {
    width: "100%",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.3)",
  },
  modalOptionText: {
    fontSize: 20,
    textAlign: "center",
    color: "rgba(190, 190, 190, 1)",
  },
  modalCancel: {
    width: "100%",
    padding: 16,
  },
  cancelText: {
    fontSize: 20,
    textAlign: "center",
    color: "rgba(180, 0, 0, 1)",
    fontWeight: "bold",
  },
});