import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidLaunchActivityFlag,
  EventType,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { eventBus } from './EventBus';

export async function configureNotificationHandler() {
  if (Platform.OS === 'android') {
    await notifee.requestPermission();
    await notifee.createChannel({
      id: 'timers_channel',
      name: 'Timers',
      importance: AndroidImportance.HIGH,
      sound: 'timersound',
      vibration: true,
      vibrationPattern: [1000, 1000],
    });
  } else {
    await notifee.requestPermission();
  }

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.ACTION_PRESS) {
      const actionId = detail.pressAction?.id;
      const timerDat = detail?.notification?.data?.timer ?? null;
      const notifId = detail?.notification?.id ?? '';

      if (!timerDat) return;

      const existing = await AsyncStorage.getItem((timerDat as any).id);

      let timer = null;

      if (existing) {
        timer = JSON.parse(existing);
        console.log(timer.remaining);
      }

      if (actionId === 'STOP_TIMER') {
        await cancelNotifAsync(notifId);
        timer.paused = true;

      } else if (actionId === 'DISMISS_ONE_TIMER') {
        timer.startTime = new Date();
        timer.totalDuration = 60;
        timer.remaining = 60;
        timer.sentNotif = false;
        if (!timer.paused) {
          timer.notificationId = await scheduleNotifAsync(
            timer.title,
            "El temporizador ha terminado",
            { timer: { id: timer.id } },
            "timersound",
            timer.remaining
          );
        }

      } else if (actionId === 'DISMISS_FIVE_TIMER') {
        console.log("+5 min");

        timer.startTime = new Date();
        timer.totalDuration = 300;
        timer.remaining = 300;
        timer.sentNotif = false;
        if (!timer.paused) {
          timer.notificationId = await scheduleNotifAsync(
            timer.title,
            "El temporizador ha terminado",
            { timer: { id: timer.id } },
            "timersound",
            timer.remaining
          );
        }
      }

      await AsyncStorage.setItem(timer.id, JSON.stringify(timer));
      eventBus.emit('timersUpdated');

    } else if (type === EventType.PRESS) {
      console.log("Notificacion pulsada");
      console.log(await notifee.getInitialNotification());
    }
  });
}

export async function scheduleNotifAsync(
  title: string,
  body: string,
  data: any = {},
  sound: string = 'timersound',
  triggerSeconds?: number
) {
  const notification = {
    title,
    body,
    data,
    android: {
      channelId: 'timers_channel',
      pressAction: {
        id: 'DEFAULT',
        launchActivity: 'default',
        launchActivityFlags: [AndroidLaunchActivityFlag.SINGLE_TOP],
      },
      category: AndroidCategory.REMINDER,
      color: '#FFaa00',
      sound,
      loopSound: true,
      actions: [
        { title: 'Detener', pressAction: { id: 'STOP_TIMER' } },
        { title: '+1 min', pressAction: { id: 'DISMISS_ONE_TIMER' } },
        { title: '+5 min', pressAction: { id: 'DISMISS_FIVE_TIMER' } },
      ],
    },
    ios: { categoryId: 'timer-actions', sound },
  };

  if (!triggerSeconds || triggerSeconds <= 0) {
    const id = await notifee.displayNotification(notification);
    return id ?? null;
  }

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: Date.now() + 1000 + triggerSeconds * 1000,
    alarmManager: false,
  };

  const id = await notifee.createTriggerNotification(notification, trigger);
  return id ?? null;
}

export async function cancelNotifAsync(notificationId: string) {
  if (!notificationId) return;
  try {
    await notifee.cancelNotification(notificationId);
  } catch (err) {
    console.error(err);
  }
}

export function handleTimerNotifResponse(
  onAction: (
    action: 'STOP_TIMER' | 'DISMISS_ONE_TIMER' | 'DISMISS_FIVE_TIMER' | 'DEFAULT',
    timerData: any,
    notificationId: string
  ) => void
): () => void {
  const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
    const timerData = detail?.notification?.data?.timer ?? null;
    const notifId = detail?.notification?.id ?? '';
    if (type === EventType.ACTION_PRESS) {
      const action = detail?.pressAction?.id as
        | 'STOP_TIMER'
        | 'DISMISS_ONE_TIMER'
        | 'DISMISS_FIVE_TIMER'
        | 'DEFAULT';

      if (action === 'STOP_TIMER') { onAction('STOP_TIMER', timerData, notifId); }
      else if (action === 'DISMISS_ONE_TIMER') { onAction('DISMISS_ONE_TIMER', timerData, notifId); }
      else if (action === 'DISMISS_FIVE_TIMER') { onAction('DISMISS_FIVE_TIMER', timerData, notifId); }
    } else if (type === EventType.PRESS) {
      onAction('DEFAULT', timerData, notifId);
    }
  });

  return unsubscribe;
}