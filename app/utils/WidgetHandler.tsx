import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { getDayInfo, updateCompletedMealById } from '../db/CRUD/DayMealsCRUD';
import { getStreakInfo } from '../db/CRUD/StreakCRUD';
import { eventBus } from './EventBus';
import { StreakDaysWidget, TodayMealsWidget, } from './Widget';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetName } = props.widgetInfo;

  async function refreshWidget(widgetName: string) {
    if (widgetName === "TodayMeals") {
      const today = new Date();
      const currentDay = today.getDate();
      const defaultKey = `dayInfo:${currentDay}-${today.getMonth() + 1}-${today.getFullYear()}`;

      const dayInfo = await getDayInfo(defaultKey);
      console.log(dayInfo);
      props.renderWidget(<TodayMealsWidget widgetInfo={{ meals: dayInfo.meals }} />);
    }

    if (widgetName === "StreakDays") {
      const streakInfo = await getStreakInfo();
      props.renderWidget(<StreakDaysWidget widgetInfo={{ ...props.widgetInfo, streakInfo }} />);
    }
  }

  async function toggleCompleted(mealId: number, mark: boolean) {
    await updateCompletedMealById(mealId, mark);
    await refreshWidget("TodayMeals");
  }

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
      await refreshWidget(widgetName);
      console.log(`${widgetName} añadido.`);
      break;

    case 'WIDGET_UPDATE':
      await refreshWidget(widgetName);
      console.log(`${widgetName} actualizado.`);

      break;

    case 'WIDGET_RESIZED':
      await refreshWidget(widgetName);
      console.log(`${widgetName} redimensionado.`);

      break;

    case 'WIDGET_CLICK': {
      if (widgetName === "TodayMeals") {
        if (props.clickAction === 'MARK_COMPLETED') {
          const { mealId } = props.clickActionData as any;
          await toggleCompleted(mealId, true);
          eventBus.emit('REFRESH_HOME');
        }

        if (props.clickAction === 'MARK_UNCOMPLETED') {
          const { mealId } = props.clickActionData as any;
          await toggleCompleted(mealId, false);
          eventBus.emit('REFRESH_HOME');
        }
      }

      console.log(`${widgetName} pulsado.`);
      break;
    }

    case 'WIDGET_DELETED':
      console.log(`${widgetName} eliminado.`);
      break;

    default:
      break;
  }
}
