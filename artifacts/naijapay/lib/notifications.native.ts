import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'zela-transactions';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Transactions',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00A859',
      sound: 'default',
    });
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

type NotifPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  delaySeconds?: number;
};

export async function scheduleNotification({ title, body, data, delaySeconds }: NotifPayload) {
  try {
    const granted = await getNotificationPermission();
    if (!granted) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data ?? {},
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
      trigger: delaySeconds
        ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delaySeconds }
        : null,
    });
  } catch {
    // notifications are optional — never crash the app
  }
}

// ─── Typed helpers ───────────────────────────────────────────────────────────

export function notifyTransferSent(amount: number, recipient: string, reference: string) {
  const fmt = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(amount);
  scheduleNotification({
    title: 'Transfer Sent ✓',
    body: `${fmt} sent to ${recipient}. Ref: ${reference}`,
    data: { type: 'transfer_sent', reference },
  });
}

export function notifyAirtimeSent(amount: number, phone: string, network: string) {
  const fmt = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
  scheduleNotification({
    title: 'Airtime Purchased ✓',
    body: `${fmt} ${network} airtime sent to ${phone}`,
    data: { type: 'airtime' },
  });
}

export function notifyDataPurchased(planCode: string, phone: string, network: string) {
  scheduleNotification({
    title: 'Data Purchased ✓',
    body: `${network} ${planCode} activated on ${phone}`,
    data: { type: 'data' },
  });
}

export function notifyBillPaid(type: string, amount: number, token?: string) {
  const fmt = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(amount);
  const extra = token ? ` Token: ${token}` : '';
  scheduleNotification({
    title: 'Bill Payment Successful ✓',
    body: `${fmt} paid for ${type}.${extra}`,
    data: { type: 'bill', token },
  });
}

export function notifyIncomingCredit(amount: number, sender: string, delaySeconds = 4) {
  const fmt = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(amount);
  scheduleNotification({
    title: '💰 Money Received',
    body: `${fmt} received from ${sender}`,
    data: { type: 'credit', sender },
    delaySeconds,
  });
}
