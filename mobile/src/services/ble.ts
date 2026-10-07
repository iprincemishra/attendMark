import { NativeModules, NativeEventEmitter, Platform, PermissionsAndroid } from 'react-native';

const { BleModule } = NativeModules;
const bleEmitter = new NativeEventEmitter(BleModule);

class BleService {
    private scanSubscription: ReturnType<typeof bleEmitter.addListener> | null = null;

    async requestPermissions(): Promise<boolean> {
        if (Platform.OS !== 'android') return true;

        if (Platform.Version >= 31) {
            const result = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
            ]);
            return (
                result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
                result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
                result['android.permission.BLUETOOTH_ADVERTISE'] === PermissionsAndroid.RESULTS.GRANTED
            );
        }
        const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        return result === PermissionsAndroid.RESULTS.GRANTED;
    }

    async startBroadcasting(sessionCode: string): Promise<boolean> {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) throw new Error('Bluetooth advertise permissions missing.');

        if (!sessionCode?.trim()) {
            throw new Error('Session code is required for BLE broadcasting.');
        }

        return await BleModule.startAdvertising(sessionCode);
    }

    async stopBroadcasting(): Promise<void> {
        await BleModule.stopAdvertising();
    }

    async startScanning(onDeviceFound: (event: any, parsedText: string) => void): Promise<void> {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) throw new Error('Bluetooth permissions not granted.');

        this.scanSubscription?.remove();

        this.scanSubscription = bleEmitter.addListener('onDeviceFound', (event) => {
            onDeviceFound(event, event.parsedData);
        });

        await BleModule.startScanning();
    }

    async stopScanning(): Promise<void> {
        this.scanSubscription?.remove();
        this.scanSubscription = null;
        await BleModule.stopScanning();
    }
}

export const bleService = new BleService();