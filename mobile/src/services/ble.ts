import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device, State } from 'react-native-ble-plx';

class BleService {
    private _manager: BleManager | null = null;

    private get manager(): BleManager {
        if (!this._manager) {
            this._manager = new BleManager();
        }
        return this._manager;
    }

    async requestPermissions(): Promise<boolean> {
        if (Platform.OS === 'android') {
            if (Platform.Version >= 31) {
                const result = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                ]);
                return (
                    result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
                    result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
                    result['android.permission.BLUETOOTH_ADVERTISE'] === PermissionsAndroid.RESULTS.GRANTED &&
                    result['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
                );
            } else {
                const result = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                );
                return result === PermissionsAndroid.RESULTS.GRANTED;
            }
        }
        return true;
    }

    async checkBluetoothState(): Promise<boolean> {

        const state = await this.manager.state();
        return state === State.PoweredOn;
    }

    async startScanning(onDeviceFound: (device: Device, token: string) => void) {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
            throw new Error('Bluetooth permissions not granted!');
        }

        const isPoweredOn = await this.checkBluetoothState();
        if (!isPoweredOn) {
            throw new Error('Bluetooth is turned off. Please enable it.');
        }

        this.manager.startDeviceScan(null, { allowDuplicates: true }, (error, device) => {
            if (error) {
                console.error('Scan error:', error);
                return;
            }

            if (device && (device.localName === 'AttendMarkSession' || device.name === 'AttendMarkSession')) {
                const serviceData = device.serviceData;
                if (serviceData) {
                    const uuids = Object.keys(serviceData);
                    if (uuids.length > 0) {
                        const base64Token = serviceData[uuids[0]];
                        if (base64Token) {
                            onDeviceFound(device, base64Token);
                        }
                    }
                }
            }
        });
    }

    stopScanning() {
        if (this._manager) {
            this.manager.stopDeviceScan();
        }
    }

    async startBroadcasting(sessionToken: string): Promise<boolean> {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
            throw new Error('Bluetooth permissions not granted!');
        }
        console.log('Preparing to broadcast session token:', sessionToken);
        return true;
    }

    destroy() {
        if (this._manager) {
            this.manager.destroy();
            this._manager = null;
        }
    }
}

export const bleService = new BleService();