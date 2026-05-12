import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const NotificationService = {
  async requestPermission(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async hasPermission(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  },

  async scheduleRecurring(): Promise<void> {
    // Cancel stale scheduled notifications before re-scheduling
    await Notifications.cancelScheduledNotificationAsync('mood-checkin').catch(() => {});
    await Notifications.cancelScheduledNotificationAsync('weekly-letter').catch(() => {});

    await Notifications.scheduleNotificationAsync({
      identifier: 'mood-checkin',
      content: {
        title: 'How are you feeling?',
        body: "Take a moment to log your mood — Lumina will connect it to your screen time.",
        data: { route: '/mood-checkin' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 20,
        minute: 0,
      },
    });

    await Notifications.scheduleNotificationAsync({
      identifier: 'weekly-letter',
      content: {
        title: 'Your weekly wellness letter is ready',
        body: 'Lumina has reflected on your week. Tap to read.',
        data: { route: '/weekly-letter' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday
        hour: 19,
        minute: 0,
      },
    });
  },

  async fireMindfulMoment(appName: string): Promise<string> {
    return Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time for a mindful moment',
        body: `You've been on ${appName} for over 30 minutes. Step away for a bit?`,
        data: { route: '/mood-checkin', type: 'mindful_moment' },
      },
      trigger: null,
    });
  },

  async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },
};
