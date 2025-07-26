import * as Notifications from 'expo-notifications';

// First, set the handler that will cause the notification
// to show the alert
export async function configureNotificationHandler() {
  const { status } = await Notifications.getPermissionsAsync();
  let finalStatus = status;

  if (status !== 'granted') {
    const { status: askStatus } = await Notifications.requestPermissionsAsync();
    finalStatus = askStatus;
  }

  if (finalStatus !== 'granted') {
    console.warn('Permiso de notificaciones no concedido');
    return;
  }

  await Notifications.setNotificationCategoryAsync('timer-actions', [
    {
      identifier: 'STOP_TIMER',
      buttonTitle: 'Detener',
      options: {
        isDestructive: true,
      },
    },
    {
      identifier: 'DISMISS_TIMER',
      buttonTitle: '+5 min',
      options: {
        isDestructive: false,
      },
    },
  ]);

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Second, call scheduleNotificationAsync()
export async function scheduleNotifAsync(title: string, body: string, data: any = {}, sound: string = 'default', categoryIdentifier: string = 'default') {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: body,
      data: data,
      sound: sound,
      categoryIdentifier: categoryIdentifier,
      color: '#FFC800',
    },
    trigger: null,
  });
}

export function handleTimerNotifResponse(
  onAction: (
    action: 'STOP_TIMER' | 'DISMISS_TIMER',
    timerData: any,
    notificationId: string
  ) => void
) {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const action = response.actionIdentifier;
    const timer = response.notification.request.content.data?.timer;
    const notificationId = response.notification.request.identifier;

    if (action === 'DISMISS_TIMER') {
      onAction('DISMISS_TIMER', timer, notificationId);
    } else if (action === 'STOP_TIMER') {
      onAction('STOP_TIMER', timer, notificationId);
    }
  });

  return () => subscription.remove();
}
