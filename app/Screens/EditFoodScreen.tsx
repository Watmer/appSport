import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { getMealWithIngredients, updateMealById } from "../db/DaySqlLiteCRUD";

const { width, height } = Dimensions.get("window");

const meals = ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"];

export default function EditFoodScreen({ route }: { route: any }) {
  const { mealId } = route.params || {};
  const navigation = useNavigation();

  const [ingredients, setIngredients] = useState([{ ingName: "", quantity: "" }]);
  const [foodName, setFoodName] = useState("");
  const [time, setTime] = useState(0);
  const [meal, setMeal] = useState("");
  const [recepy, setRecepy] = useState("");
  const [comments, setComments] = useState("");
  const [showMealType, setShowMealType] = useState(false);

  const fetchMealData = async () => {
    try {
      const mealInfo = await getMealWithIngredients(mealId) as any;
      if (mealInfo) {
        setFoodName(mealInfo.foodName || "");
        setTime(mealInfo.time || 0);
        setMeal(mealInfo.meal || "");
        setRecepy(mealInfo.recepy || "");
        setComments(mealInfo.comments || "");
        setIngredients(mealInfo.ingredients || []);
      }
    } catch (error) {
      console.error("Error fetching meals:", error);
    }
  };

  useEffect(() => {
    fetchMealData();
  }, [mealId]);

  const addIngredient = () =>
    setIngredients([...ingredients, { ingName: "", quantity: "" }]);

  const deleteIngredient = (i: number) =>
    setIngredients(ingredients.filter((_, index) => index !== i));

  const saveFoodInfo = async () => {
    if (!checkMandatoryFields()) return;

    const newFood = {
      meal,
      foodName,
      time,
      ingredients: ingredients,
      recepy,
      comments,
      completed: false,
    };

    try {
      await updateMealById(mealId, newFood);
      Alert.alert("Comida guardada correctamente.");
      navigation.goBack();
    } catch (error) {
      console.error("Error guardando comida:", error);
      Alert.alert("Error guardando comida.");
    }
  };

  const checkMandatoryFields = () => {
    if (!meal) {
      Alert.alert("Warning", "Debes seleccionar un tipo de comida");
      return false;
    }
    if (!foodName) {
      Alert.alert("Warning", "Debes poner un nombre");
      return false;
    }
    return true;
  };

  return (
    <KeyboardAvoidingView
      style={styles.scrollContainer}
      behavior={"padding"}
      keyboardVerticalOffset={100}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
                  {meals.map((mealOption) => (
                    <TouchableOpacity
                      key={mealOption}
                      onPress={() => {
                        setMeal(mealOption);
                        setShowMealType(false);
                      }}
                      style={styles.modalOption}
                    >
                      <Text style={styles.modalOptionText}>{mealOption}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setShowMealType(false)}
                >
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
                value={foodName}
                onChangeText={setFoodName}
                selectionColor={"rgba(255, 170, 0, 0.5)"}
                selectionHandleColor={"rgba(255, 170, 0, 1)"}
                cursorColor={"rgba(255, 170, 0, 1)"}
              />

              <Text style={styles.label}>Tiempo (min):</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 10"
                keyboardType="numeric"
                placeholderTextColor="gray"
                value={time.toString()}
                onChangeText={(text) => setTime(parseInt(text) || 0)}
                selectionColor={"rgba(255, 170, 0, 0.5)"}
                selectionHandleColor={"rgba(255, 170, 0, 1)"}
                cursorColor={"rgba(255, 170, 0, 1)"}
              />

              <Text style={styles.label}>Ingredientes:</Text>
              {ingredients.map((item, i) => (
                <View key={i} style={styles.inputListGroup}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Ingrediente"
                    value={item.ingName}
                    onChangeText={(text) => {
                      const copy = [...ingredients];
                      copy[i].ingName = text;
                      setIngredients(copy);
                    }}
                    placeholderTextColor="gray"
                    selectionColor={"rgba(255, 170, 0, 0.5)"}
                    selectionHandleColor={"rgba(255, 170, 0, 1)"}
                    cursorColor={"rgba(255, 170, 0, 1)"}
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
                    selectionColor={"rgba(255, 170, 0, 0.5)"}
                    selectionHandleColor={"rgba(255, 170, 0, 1)"}
                    cursorColor={"rgba(255, 170, 0, 1)"}
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

              <Text style={styles.label}>Receta:</Text>
              <TextInput
                style={styles.input}
                placeholder="..."
                placeholderTextColor="gray"
                multiline={true}
                value={recepy}
                onChangeText={setRecepy}
                selectionColor={"rgba(255, 170, 0, 0.5)"}
                selectionHandleColor={"rgba(255, 170, 0, 1)"}
                cursorColor={"rgba(255, 170, 0, 1)"}
              />

              <Text style={styles.label}>Comentarios:</Text>
              <TextInput
                style={styles.input}
                placeholder="..."
                placeholderTextColor="gray"
                multiline={true}
                value={comments}
                onChangeText={setComments}
                selectionColor={"rgba(255, 170, 0, 0.5)"}
                selectionHandleColor={"rgba(255, 170, 0, 1)"}
                cursorColor={"rgba(255, 170, 0, 1)"}
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => saveFoodInfo()}
              >
                <Text style={styles.buttonText}>Guardar Comida</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "rgba(30, 30, 30, 1)",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    backgroundColor: "rgba(70, 70, 70, 1)",
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
    maxHeight: 100,
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
    backgroundColor: "rgba(100, 100, 100, 1)",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
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
    backgroundColor: "rgba(30, 30, 30, 0.95)",
  },
  modalView: {
    backgroundColor: "rgba(70, 70, 70, 1)",
    borderRadius: 15,
    padding: 10,
    alignItems: "center",
    overflow: "hidden",
    width: "85%",
  },
  modalOption: {
    width: "100%",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(100, 100, 100, 1)",
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
    color: "rgba(255, 0, 0, 1)",
    fontWeight: "bold",
  },
});