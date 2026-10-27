import {NativeModules} from 'react-native';

export interface DeviceInfo {
  abis: string[];
  is64: boolean;
  sdk: number;
  model: string;
}

interface Native {
  getDeviceInfo(): Promise<DeviceInfo>;
  isInstalled(pkg: string): Promise<boolean>;
  launchGame(pkg: string, activity: string, extras: Record<string, string | number | boolean>): Promise<boolean>;
  openUrl(url: string): Promise<boolean>;
}

export const Launcher = NativeModules.MiraLauncher as Native;
