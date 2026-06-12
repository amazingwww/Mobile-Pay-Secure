export async function setupNotificationChannel() {}
export async function requestNotificationPermission(): Promise<boolean> { return false; }
export async function getNotificationPermission(): Promise<boolean> { return false; }
export function notifyTransferSent(_amount: number, _recipient: string, _reference: string) {}
export function notifyAirtimeSent(_amount: number, _phone: string, _network: string) {}
export function notifyDataPurchased(_planCode: string, _phone: string, _network: string) {}
export function notifyBillPaid(_type: string, _amount: number, _token?: string) {}
export function notifyIncomingCredit(_amount: number, _sender: string, _delaySeconds?: number) {}
