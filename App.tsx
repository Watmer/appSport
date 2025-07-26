import { useInitDb } from './app/db/initializeDb';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './app/navigation/RootNavigator';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { configureNotificationHandler } from './app/utils/Notification';


export default function App() {
  const { success, error } = useInitDb();

  if (error) {
    return <View><Text>Error en migración: {error.message}</Text></View>;
  }

  if (!success) {
    return <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#f57c00" />
    </View>
  }

  // Initialize notification handler
  configureNotificationHandler().catch(err => console.error('Error configuring notifications:', err));

  return (
    <NavigationContainer>
      <RootNavigator />
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