import { Text, View, StyleSheet } from "react-native";
export default function ShopListScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Shop List Screen</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 20,
    color: "rgb(255, 255, 255)",
  },
});