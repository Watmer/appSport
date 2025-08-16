import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { getDayInfo, updateCompletedMealById } from '../db/DaySqlLiteCRUD';
import { TodayMealsWidget } from './Widget';

const nameToWidget = {
  TodayMeals: TodayMealsWidget,
};

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const Widget = nameToWidget[props.widgetInfo.widgetName as keyof typeof nameToWidget];

  async function refreshWidget() {
    const today = new Date();
    const currentDay = today.getDate();
    const defaultKey = `dayInfo:${currentDay}-${today.getMonth() + 1}-${today.getFullYear()}`;

    const dayInfo = await getDayInfo(defaultKey);
    props.renderWidget(<Widget widgetInfo={{ meals: dayInfo.meals }} />);
  }

  async function toggleCompleted(mealId: number, mark: boolean) {
    await updateCompletedMealById(mealId, mark);
    await refreshWidget();
  }

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
      await refreshWidget();
      console.log("widget añadido.");
      break;
    case 'WIDGET_UPDATE':
      await refreshWidget();
      break;
    case 'WIDGET_RESIZED': {
      await refreshWidget();
      break;
    }
    case 'WIDGET_CLICK': {
      if (props.clickAction === 'MARK_COMPLETED') {
        const { mealId } = props.clickActionData as any;
        await toggleCompleted(mealId, true);
      }

      if (props.clickAction === 'MARK_UNCOMPLETED') {
        const { mealId } = props.clickActionData as any;
        await toggleCompleted(mealId, false);
      }

      console.log("widget pulsado.");
      break;
    }
    case 'WIDGET_DELETED': {
      console.log("widget eliminado.");
      break;
    }
    default:
      break;
  }
}
