import { createStackNavigator } from "@react-navigation/stack";
import AddFoodScreen from "../Screens/AddFoodScreen";
import DayInfoScreen from "../Screens/DayInfoScreen";
import FoodDetailScreen from "../Screens/FoodDetailsScreen";
import FoodListScreen from "../Screens/FoodListScreen";
import Home from "../Screens/Home";
import ShopListScreen from "../Screens/ShopListScreen";
import TabsNavigator from "./TabsNavigator";
import { TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";


const RootStack = createStackNavigator();

export default function RootNavigator() {
  const navigation = useNavigation();
  return (
    <RootStack.Navigator screenOptions={
      {
        headerShown: true,
        headerStyle: { backgroundColor: "rgba(100, 100, 100, 1)" },
        headerTitleStyle: { color: "rgba(255, 255, 255, 1)" },
        headerTitleAlign: "center",
        headerTintColor: "rgba(255, 255, 255, 1)",
      }}>
      <RootStack.Screen
        name="Main"
        component={TabsNavigator}
        options={{ headerShown: false }}
      />
      <RootStack.Screen name="Home" component={Home} />
      <RootStack.Screen name="DayInfoScreen" component={DayInfoScreen} />
      <RootStack.Screen name="FoodDetailScreen" component={FoodDetailScreen} />
      <RootStack.Screen name="FoodListScreen" component={FoodListScreen} options={{
        headerRight: () => (
          <TouchableOpacity style={{ marginRight: 20 }} onPress={() => navigation.navigate("AddFoodScreen")}>
            <MaterialCommunityIcons name="plus" size={30} color="rgba(255, 170, 0, 1)" />
          </TouchableOpacity>
        ),
      }} />
      <RootStack.Screen name="AddFoodScreen" component={AddFoodScreen} />
      <RootStack.Screen name="ShopListScreen" component={ShopListScreen} />
    </RootStack.Navigator>
  );
}
