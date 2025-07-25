import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { useNavigation } from "@react-navigation/native";
import Home from "../Screens/Home";
import ShopListScreen from "../Screens/ShopListScreen";
import TimerScreen from "../Screens/TimerScreen";

const Tab = createBottomTabNavigator();

export default function TabsNavigator() {
  const navigation = useNavigation();

  return (
    <Tab.Navigator
      initialRouteName={"Home"}
      screenOptions={
        {
          headerShown: true,
          headerStyle: { backgroundColor: "rgba(100, 100, 100, 1)", },
          headerTitleStyle: { color: "rgba(255, 255, 255, 1)", },
          headerTitleAlign: "center",
          tabBarStyle: { backgroundColor: "rgba(100, 100, 100, 1)", },
          tabBarActiveTintColor: "rgba(255, 200, 0, 1)",
          tabBarInactiveTintColor: "rgba(0, 0, 0, 0.5)",
        }
      }>
      <Tab.Screen name="Home" component={Home} options={{
        title: "Home", tabBarIcon: ({ color, focused }) => (
          <MaterialCommunityIcons name={focused ? 'home' : 'home-outline'} color={color} size={24} />
        ),
      }} />
      <Tab.Screen name="TimerComponent" component={TimerScreen} options={{
        title: "Timer", tabBarIcon: ({ color, focused }) => (
          <MaterialCommunityIcons name={focused ? 'timer' : 'timer-outline'} color={color} size={24} />
        ),
      }} />
      <Tab.Screen name="ShopListScreen" component={ShopListScreen} options={{
        title: "Shop List", tabBarIcon: ({ color, focused }) => (
          <MaterialCommunityIcons name={focused ? 'cart' : 'cart-outline'} color={color} size={24} />
        ),
      }} />
    </Tab.Navigator>
  );
}
