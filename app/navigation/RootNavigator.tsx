import { createStackNavigator } from "@react-navigation/stack";
import AddFoodScreen from "../Screens/AddFoodScreen";
import EditFoodScreen from "../Screens/EditFoodScreen";
import FoodDetailScreen from "../Screens/FoodDetailsScreen";
import FoodListScreen from "../Screens/FoodListScreen";
import Home from "../Screens/Home";
import MealDetailScreen from "../Screens/MealDetailsScreen";
import { PreviewWidgets } from "../Screens/PreviewWidgets";
import RecepyScreen from "../Screens/RecepyScreen";
import ShopListScreen from "../Screens/ShopListScreen";
import TimerScreen from "../Screens/TimerScreen";
import TabsNavigator from "./TabsNavigator";
import AiChatScreen from "../Screens/AiChatScreen";

const RootStack = createStackNavigator();

export default function RootNavigator() {
  return (
    <RootStack.Navigator screenOptions={
      {
        headerShown: true,
        headerStyle: { backgroundColor: "rgba(50, 50, 50, 1)" },
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
      <RootStack.Screen name="TimerScreen" component={TimerScreen}
        options={{ title: "Timer" }} />
      <RootStack.Screen name="RecepyScreen" component={RecepyScreen}
        options={{ title: "Recetas" }} />
      <RootStack.Screen name="MealDetailsScreen" component={MealDetailScreen}
        options={{ title: "Meal Detail" }} />
      <RootStack.Screen name="PreviewWidgets" component={PreviewWidgets}
        options={{ title: "Preview Widgets" }} />
    </RootStack.Navigator>
  );
}
