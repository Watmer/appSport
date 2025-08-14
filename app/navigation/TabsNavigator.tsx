import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { useNavigation } from "@react-navigation/native";
import Home from "../Screens/Home";
import ShopListScreen from "../Screens/ShopListScreen";
import TimerScreen from "../Screens/TimerScreen";
import { PreviewWidgets } from "../Screens/PreviewWidgets";

const Tab = createBottomTabNavigator();

export default function TabsNavigator() {
  const navigation = useNavigation();

  return (
    <Tab.Navigator
      initialRouteName={"Home"}
      screenOptions={
        {
          headerShown: true,
          headerStyle: { backgroundColor: "rgba(50, 50, 50, 1)", borderColor: "rgba(0, 0, 0, 0.5)" },
          headerTitleStyle: { color: "rgba(255, 255, 255, 1)", },
          headerTitleAlign: "center",
          tabBarStyle: { backgroundColor: "rgba(50, 50, 50, 1)", borderColor: "rgba(0, 0, 0, 0.5)" },
          tabBarActiveTintColor: "rgba(255, 170, 0, 1)",
          tabBarInactiveTintColor: "rgba(100, 100, 100, 1)",
        }
      }>
      <Tab.Screen name="Home" component={Home} options={{
        title: "Home", tabBarIcon: ({ color, focused }) => (
          <MaterialCommunityIcons name={'home-variant'} color={color} size={25} />
        ),
      }} />
      <Tab.Screen name="TimerScreen" component={TimerScreen} options={{
        title: "Timer", tabBarIcon: ({ color, focused }) => (
          <MaterialCommunityIcons name={focused ? 'timer' : 'timer-outline'} color={color} size={25} />
        ),
      }} />
      <Tab.Screen name="ShopListScreen" component={ShopListScreen} options={{
        title: "Shop List", tabBarIcon: ({ color, focused }) => (
          <MaterialCommunityIcons name={focused ? 'cart' : 'cart-outline'} color={color} size={25} />
        ),
      }} />
      <Tab.Screen name="PreviewWidgets" component={PreviewWidgets} options={{
        title: "Preview Widgets", tabBarIcon: ({ color, focused }) => (
          <MaterialCommunityIcons name={focused ? 'widgets' : 'widgets-outline'} color={color} size={25} />
        ),
      }} />
    </Tab.Navigator>
  );
}
