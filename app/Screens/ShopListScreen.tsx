import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ShopListScreen() {
  const [items, setItems] = useState([{ id: "0", text: "", completed: false }]);

  const toggleCompleted = (id: string, text: string) => {
    if (text !== "") {
      const newItems = items.map(item => {
        if (item.id === id) {
          return { ...item, completed: !item.completed };
        }
        return item;
      });
      setItems(newItems);
    }
  };

  const updateText = (id: string, text: string) => {
    let newItems = items.map(item => {
      if (item.id === id) {
        return { ...item, text: text };
      }
      return item;
    });

    const lastItem = newItems[newItems.length - 1];
    if (lastItem.text !== "") {
      newItems = [...newItems, { id: Date.now().toString(), text: "", completed: false }];
    }

    setItems(newItems);
  };

  const deleteItem = (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems.length === 0 ? [{ id: Date.now().toString(), text: "", completed: false }] : newItems);
  };

  const renderItems = () => {
    return (
      items.slice().reverse().map(item => (
        <View key={item.id} style={styles.row}>
          <TouchableOpacity onPress={() => toggleCompleted(item.id, item.text)}>
            <MaterialCommunityIcons
              name={item.completed ? "checkbox-marked" : "checkbox-blank-outline"}
              size={25}
              color={item.completed ? "rgba(255, 170, 0, 1)" : "rgba(255, 255, 255, 0.5)"}
            />
          </TouchableOpacity>

          <TextInput
            style={[styles.input, item.completed && styles.completedText]}
            value={item.text}
            onChangeText={(text) => updateText(item.id, text)}
            placeholder="Escribe un ítem"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
          />
          {item.text !== "" &&
            <TouchableOpacity onPress={() => deleteItem(item.id)}>
              <MaterialCommunityIcons name="delete" size={25} color="red" />
            </TouchableOpacity>
          }
        </View>
      ))
    )
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container}>
        {renderItems()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "rgba(120,120,120,1)"
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10
  },
  input: {
    flex: 1,
    marginHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 1)",
    color: "rgba(255, 255, 255, 1)",
    backgroundColor: "transparent",
    height: 35,
    paddingVertical: 0,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "rgba(255, 255, 255, 0.5)",
  },
  addButton: {
    backgroundColor: "rgba(255, 170, 0, 1)",
    padding: 15,
    margin: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontSize: 18,
  },
});
