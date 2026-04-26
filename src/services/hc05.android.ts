import RNBluetoothClassic from 'react-native-bluetooth-classic';

import { Hc05ConnectionPayload, Hc05DeviceSummary } from './hc05.types';

type DataHandler = (message: string) => void;

type Subscription = {
  remove: () => void;
};

type BluetoothDevice = {
  name?: string;
  address: string;
  isConnected: () => Promise<boolean>;
  connect: (options?: Record<string, string | number | boolean>) => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  write: (data: string, encoding?: string) => Promise<boolean>;
  onDataReceived: (listener: (event: { data?: string }) => void) => Subscription;
};

let activeDevice: BluetoothDevice | null = null;
let activeSubscription: Subscription | null = null;
let mockIntervalId: NodeJS.Timeout | null = null;

// Mock test messages for development
const MOCK_MESSAGES = [
  'SLOT:1,occupied',
  'SLOT:2,available',
  'SLOT:3,occupied',
  'SLOT:4,available',
  'SLOT:1,available',
  'SLOT:2,occupied',
  'SLOT:3,available',
  'SLOT:4,occupied',
];

let mockMessageIndex = 0;

function summarizeDevice(device: BluetoothDevice): Hc05DeviceSummary {
  return {
    name: device.name ?? 'HC-05',
    address: device.address,
    connected: false
  };
}

function matchDevice(devices: BluetoothDevice[], targetName: string): BluetoothDevice | null {
  const normalizedTarget = targetName.trim().toLowerCase();
  const exactMatch = devices.find((device) => (device.name ?? '').trim().toLowerCase() === normalizedTarget);

  if (exactMatch) {
    return exactMatch;
  }

  const partialMatch = devices.find((device) => (device.name ?? '').toLowerCase().includes(normalizedTarget));

  if (partialMatch) {
    return partialMatch;
  }

  return devices.find((device) => (device.name ?? '').toLowerCase().includes('hc-05')) ?? null;
}

function normalizeMessage(message: unknown): string {
  if (typeof message === 'string') {
    return message;
  }

  if (message == null) {
    return '';
  }

  return String(message);
}

function createMockDevice(onMessage?: DataHandler): BluetoothDevice {
  let isConnected = false;
  
  return {
    name: 'HC-05 (Test)',
    address: '00:00:00:00:00:00',
    isConnected: async () => isConnected,
    connect: async () => {
      isConnected = true;
      mockMessageIndex = 0;
      if (onMessage) {
        mockIntervalId = setInterval(() => {
          const msg = MOCK_MESSAGES[mockMessageIndex % MOCK_MESSAGES.length];
          onMessage(msg);
          mockMessageIndex += 1;
        }, 2000);
      }
      return true;
    },
    disconnect: async () => {
      isConnected = false;
      if (mockIntervalId) {
        clearInterval(mockIntervalId);
        mockIntervalId = null;
      }
      return true;
    },
    write: async () => true,
    onDataReceived: (listener) => {
      return { remove: () => {} };
    }
  };
}

async function ensureBluetoothEnabled(): Promise<void> {
  const enabled = await RNBluetoothClassic.isBluetoothEnabled();

  if (enabled) {
    return;
  }

  const requested = await RNBluetoothClassic.requestBluetoothEnabled();

  if (!requested) {
    throw new Error('Bluetooth must be enabled to connect to HC-05.');
  }
}

export async function isHc05Supported(): Promise<boolean> {
  return RNBluetoothClassic.isBluetoothAvailable();
}

export async function ensureHc05Ready(): Promise<void> {
  await ensureBluetoothEnabled();
}

export async function getPairedHc05Devices(): Promise<Hc05DeviceSummary[]> {
  const devices = (await RNBluetoothClassic.getBondedDevices()) as BluetoothDevice[];
  const summaries = devices.map((device) => summarizeDevice(device));
  
  // Always add a mock HC-05 for testing if no real devices found
  if (summaries.length === 0) {
    summaries.push({
      name: 'HC-05 (Test)',
      address: '00:00:00:00:00:00',
      connected: false
    });
  }
  
  return summaries;
}

export async function connectToHc05(
  targetName = 'HC-05',
  onMessage?: DataHandler
): Promise<Hc05ConnectionPayload> {
  await ensureBluetoothEnabled();

  const bondedDevices = (await RNBluetoothClassic.getBondedDevices()) as BluetoothDevice[];
  let device = matchDevice(bondedDevices, targetName);

  // Use a mock device if no real device found (for testing)
  if (!device) {
    device = createMockDevice(onMessage);
  }

  if (!device) {
    throw new Error('Pair the HC-05 in Android Bluetooth settings before connecting.');
  }

  const currentlyConnected = await device.isConnected();

  if (!currentlyConnected) {
    await device.connect({
      CONNECTOR_TYPE: 'rfcomm',
      CONNECTION_TYPE: 'delimited',
      DELIMITER: '\n',
      DEVICE_CHARSET: 'utf-8',
      READ_SIZE: 1024
    });
  }

  activeDevice = device;

  activeSubscription?.remove();
  activeSubscription = null;

  if (onMessage && !device.name?.includes('Test')) {
    activeSubscription = device.onDataReceived((event) => {
      const message = normalizeMessage(event?.data).trim();

      if (message.length > 0) {
        onMessage(message);
      }
    });
  }

  return {
    deviceName: device.name ?? targetName,
    deviceAddress: device.address
  };
}

export async function sendHc05Message(message: string): Promise<void> {
  if (!activeDevice) {
    throw new Error('Connect to HC-05 before sending data.');
  }

  const outgoing = message.endsWith('\n') ? message : `${message}\n`;
  await activeDevice.write(outgoing, 'utf8');
}

export async function disconnectHc05(): Promise<void> {
  activeSubscription?.remove();
  activeSubscription = null;

  if (mockIntervalId) {
    clearInterval(mockIntervalId);
    mockIntervalId = null;
  }

  if (!activeDevice) {
    return;
  }

  try {
    await activeDevice.disconnect();
  } finally {
    activeDevice = null;
  }
}