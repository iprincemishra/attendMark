package com.prince.attendMark

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.le.*
import android.content.Context
import android.os.ParcelUuid
import com.facebook.react.bridge.*
import java.nio.charset.Charset

class BleModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val bluetoothManager: BluetoothManager = reactContext.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    private val bluetoothAdapter: BluetoothAdapter? = bluetoothManager.adapter
    private val advertiser: BluetoothLeAdvertiser? = bluetoothAdapter?.bluetoothLeAdvertiser
    private val scanner: BluetoothLeScanner? = bluetoothAdapter?.bluetoothLeScanner

    private var advertiseCallback: AdvertiseCallback? = null
    private var scanCallback: ScanCallback? = null

    private val MANUFACTURER_ID = 0xFFFF

    override fun getName(): String {
        return "BleModule"
    }

    @ReactMethod
    fun startAdvertising(sessionCode: String, promise: Promise) {
        if (advertiser == null) {
            promise.reject("BLE_ERROR", "Bluetooth advertising not supported on this device")
            return
        }

        stopAdvertisingInternal()

        val payloadBytes = sessionCode.toByteArray(Charset.forName("UTF-8"))
        if (payloadBytes.size > 15) {
            promise.reject(
                "BLE_ERROR", 
                "Payload exceeds manufacturer data limit!"
            )
            return
        }

        val settings = AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .setConnectable(false)
            .build()

        val data = AdvertiseData.Builder()
            .addManufacturerData(MANUFACTURER_ID, payloadBytes)
            .setIncludeDeviceName(false)
            .build()

        advertiseCallback = object : AdvertiseCallback() {
            override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
                super.onStartSuccess(settingsInEffect)
                promise.resolve(true)
            }

            override fun onStartFailure(errorCode: Int) {
                super.onStartFailure(errorCode)
                promise.reject("BLE_ERROR", "Failed to start advertising. Error code: $errorCode")
            }
        }

        advertiser?.startAdvertising(settings, data, advertiseCallback)
    }

    @ReactMethod
    fun stopAdvertising(promise: Promise) {
        stopAdvertisingInternal()
        promise.resolve(true)
    }

    private fun stopAdvertisingInternal() {
        advertiseCallback?.let {
            advertiser?.stopAdvertising(it)
            advertiseCallback = null
        }
    }

    @ReactMethod
    fun startScanning(promise: Promise) {
        if (scanner == null) {
            promise.reject("BLE_ERROR", "Bluetooth scanning not supported")
            return
        }

        val settings = ScanSettings.Builder()
            .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
            .build()

        scanCallback = object : ScanCallback() {
            override fun onScanResult(callbackType: Int, result: ScanResult) {
                super.onScanResult(callbackType, result)
                // val pUuid = ParcelUuid.fromString("12345678-1234-1234-1234-1234567890ab")
                // val serviceData = result.scanRecord?.getServiceData(pUuid)
                val manufacturerData = result.scanRecord?.getManufacturerSpecificData(MANUFACTURER_ID)

                if (manufacturerData != null) {
                    val parsedText = String(manufacturerData, Charset.forName("UTF-8"))
                    
                    val params = Arguments.createMap().apply {
                        putString("parsedData", parsedText)
                        putString("deviceAddress", result.device.address)
                        putInt("rssi", result.rssi)
                    }
                    reactApplicationContext
                        .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit("onDeviceFound", params)
                }
            }

            override fun onScanFailed(errorCode: Int) {
                super.onScanFailed(errorCode)
                val params = Arguments.createMap().apply {
                    putInt("errorCode", errorCode)
                 }
                reactApplicationContext
                    .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onScanFailed", params)
            }
        }

        scanner?.startScan(null, settings, scanCallback)
        promise.resolve(true)
    }

    @ReactMethod
    fun stopScanning(promise: Promise) {
        scanCallback?.let {
            scanner?.stopScan(it)
            scanCallback = null
        }
        promise.resolve(true)
    }
}