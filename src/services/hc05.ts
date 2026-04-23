import { Hc05ConnectionPayload, Hc05DeviceSummary } from './hc05.types';

const unsupportedMessage =
  'HC-05 Bluetooth requires an Android development build. Expo Go cannot load native Classic Bluetooth modules.';

export async function isHc05Supported(): Promise<boolean> {
  return false;
}

export async function ensureHc05Ready(): Promise<void> {
  throw new Error(unsupportedMessage);
}

export async function getPairedHc05Devices(): Promise<Hc05DeviceSummary[]> {
  return [];
}

export async function connectToHc05(): Promise<Hc05ConnectionPayload> {
  throw new Error(unsupportedMessage);
}

export async function sendHc05Message(): Promise<void> {
  throw new Error(unsupportedMessage);
}

export async function disconnectHc05(): Promise<void> {
  return;
}