import notifee from '@notifee/react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useInitDb } from './app/db/initializeDb';
import RootNavigator from './app/navigation/RootNavigator';
import { configureNotificationHandler } from './app/utils/Notification';

function NotificationHandler() {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    configureNotificationHandler().catch(err =>
      console.error('Error configuring notifications:', err)
    );
  }, []);

  useEffect(() => {
    notifee.getInitialNotification().then(initial => {
      if (initial) {
        if (navigationRef.isReady()) {
          (navigationRef as any).navigate('TimerScreen');
        }
      }
    });
  }, [navigationRef]);

  return null;
}

export default function App() {
  const { success, error } = useInitDb();

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
    <NavigationContainer>
      <RootNavigator />
      <NotificationHandler />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});