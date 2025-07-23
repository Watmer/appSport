import { createStackNavigator } from "@react-navigation/stack";
import AddFoodScreen from "../Screens/AddFoodScreen";
import FoodDetailScreen from "../Screens/FoodDetailsScreen";
import FoodListScreen from "../Screens/FoodListScreen";
import Home from "../Screens/Home";
import ShopListScreen from "../Screens/ShopListScreen";
import TabsNavigator from "./TabsNavigator";
import { TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import EditFoodScreen from "../Screens/EditFoodScreen";


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
      <RootStack.Screen name="FoodDetailScreen" component={FoodDetailScreen}
        options={{ title: "Food Detail" }} />
      <RootStack.Screen name="FoodListScreen" component={FoodListScreen}
        options={{ title: "Food List" }} />
      <RootStack.Screen name="AddFoodScreen" component={AddFoodScreen}
        options={{ title: "Add Food" }} />
      <RootStack.Screen name="ShopListScreen" component={ShopListScreen}
        options={{ title: "Shop List" }} />
      <RootStack.Screen name="EditFoodScreen" component={EditFoodScreen}
        options={{ title: "Edit Food" }} />
    </RootStack.Navigator>
  );
}
