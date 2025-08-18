import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { WidgetPreview } from 'react-native-android-widget';
import { getDayInfo } from '../db/DaySqlLiteCRUD';
import { StreakDaysWidget, TodayMealsWidget } from '../utils/Widget';

export function PreviewWidgets() {
  const [meals, setMeals] = useState<any[] | null>(null);

  const onRefresh = async () => {
    await loadData();
  };

  async function loadData() {
    const today = new Date();
    const currentDay = today.getDate();
    const dayData = await getDayInfo(`dayInfo:${currentDay}-${today.getMonth() + 1}-${today.getFullYear()}`);
    setMeals(dayData?.meals || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  if (!meals) {
    return <ActivityIndicator size="large" color="#ffaa00" />;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onRefresh}>
        <MaterialCommunityIcons name='refresh' color={'#ffffff'} size={30} />
      </TouchableOpacity>
      <WidgetPreview
        renderWidget={() => <TodayMealsWidget widgetInfo={{ meals }} />}
        width={320}
        height={200}
      />
      <WidgetPreview
        renderWidget={() => <StreakDaysWidget />}
        width={320}
        height={200}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "rgba(0, 0, 0, 1)",
  },
});
