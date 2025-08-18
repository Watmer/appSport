import React, { useEffect } from "react";
import { registerWidgetTaskHandler } from "react-native-android-widget";

import notifee from "@notifee/react-native";
import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { registerRootComponent } from "expo";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useInitDb } from "./app/db/initializeDb";
import RootNavigator from "./app/navigation/RootNavigator";
import { configureNotificationHandler } from "./app/utils/Notification";
import { setAppReady, widgetTaskHandler } from "./app/utils/WidgetHandler";
import { eventBus } from "./app/utils/EventBus";

registerRootComponent(App);
registerWidgetTaskHandler(widgetTaskHandler);

function NotificationHandler() {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    configureNotificationHandler().catch(err =>
      console.error("Error configuring notifications:", err)
    );
  }, []);

  useEffect(() => {
    pressNotif();
  }, [navigationRef]);

  const pressNotif = async () => {
    const initial = await notifee.getInitialNotification();

    if (initial && navigationRef.isReady()) {
      (navigationRef as any).navigate("TimerScreen");
    }
  };

  return null;
}

const linking = {
  prefixes: ["sportappdev://"],
  config: {
    screens: {
      TimerScreen: "timer",
      MealDetailsScreen: "meal-details/:mealInfoKey",
    },
  },
};

export default function App() {
  const { success, error } = useInitDb();

  useEffect(() => {
    if (success) {
      setAppReady(true);
      eventBus.emit('REFRESH_WIDGETS_FROM_APP');
    }
  }, [success]);

  if (error) {
    return (
      <View>
        <Text>Error en migración: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#ffaa00" />
      </View>
    );
  }



  return (
    <NavigationContainer linking={linking}>
      <RootNavigator />
      <NotificationHandler />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
