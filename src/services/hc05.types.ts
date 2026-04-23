export type Hc05DeviceSummary = {
  name: string;
  address: string;
  connected: boolean;
};

export type Hc05ConnectionPayload = {
  deviceName: string;
  deviceAddress: string;
};