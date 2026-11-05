# AttendMark Mobile

The client-side mobile application for the **AttendMark** proximity-based classroom attendance system. Built with React Native and Expo, the app leverages Bluetooth Low Energy (BLE) peripheral broadcasting and central scanning to automate physical attendance logging in real time.

---

## Core Features

- **Split-Role Architecture:** Distinct workflows and interfaces for Students and Teachers.
- **BLE Proximity Detection:**
  - **Teacher Mode:** Broadcasts a rolling classroom session code over BLE advertisement packets using custom native modules.
  - **Student Mode:** Passive scanner that detects nearby classroom beacons and submits verified payload tokens.
- **Hardware Binding & Anti-Proxy:** Pulls persistent Android/iOS hardware identifiers into secure storage to ensure one device cannot authenticate multiple students.
- **Modern Instagram-Style Light UX:** Clean white interfaces, responsive layout constraints, auto-hiding footers on keyboard focus, and tactile haptic feedback.
- **Custom Feedback Systems:** Reusable modal alert dialogs (`CustomAlert`) and native splash boot sequence with seamless handoff.

---

## Tech Stack

- **Framework:** [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (SDK 52+ / Expo Router)
- **Styling:** [NativeWind](https://www.nativewind.dev/)
- **State & Context:** React Context (`AuthContext`)
- **Hardware & Peripherals:** Custom native Kotlin BLE modules + `expo-application` + `expo-haptics`
- **Networking:** [Axios](https://axios-http.com/) with configured API client
- **Icons:** `@expo/vector-icons` (Ionicons)

---

## Project Structure

```text
src/
├── app/
│   ├── (auth)/
│   │   └── login.tsx            # Split Student/Teacher login interface
│   ├── (student)/
│   │   ├── dashboard.tsx        # Student attendance history & status
│   │   └── scanner.tsx          # BLE beacon scanner & attendance submission
│   ├── (teacher)/
│   │   ├── dashboard.tsx        # Teacher class controls & session launches
│   │   ├── create-session.tsx   # Subject selection & BLE broadcast launch
│   │   └── session-live.tsx     # Real-time attendee feed & progress tracker
│   ├── _layout.tsx              # Root slot & AuthProvider wrapper
│   └── index.tsx                # Auth redirect gate
├── components/
│   └── CustomAlert.tsx          # Reusable modal alert component
├── context/
│   └── AuthContext.tsx          # Token persistence & session state
├── services/
│   ├── api.ts                   # Centralized Axios client
│   └── ble.ts                   # Native BLE bridge (Broadcast/Scan handlers)
├── utils/
│   └── secureStore.ts           # Hardware UUID extraction & persistent caching
└── assets/                      # Application icons & splash screens

```

---

## Getting Started

### Prerequisites

- **Node.js** (v18.x or v20.x LTS)
- **Package Manager:** `pnpm` / `npm`
- **Android Studio** with Android SDK platform tools (API 34+) and JDK 17
- Physical Android device with Bluetooth and Location services enabled (BLE advertising/scanning is not supported on emulators)

### Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/iprincemishra/attendMark.git
    cd attendmark/mobile
    ```

2. **Install dependencies:**

    ```bash
    pnpm install
    # or
    npm install
    ```

3. **Configure Environment:** Update your base API URL in `src/services/api.ts`:

    ```ts
    export const BASE_URL = 'http://YOUR_LOCAL_IP:5000/api';
    ```

4. **Generate Native Prebuild:** Since AttendMark uses native Bluetooth permissions and Kotlin code, run prebuild:

    ```bash
    npx expo prebuild --clean
    ```

5. **Run on Physical Device:** Connect your Android phone via USB debugging:

    ```bash
    npx expo run:android
    ```

---

## BLE Permissions Config (`app.json`)

AttendMark requires runtime Bluetooth and Location permissions on Android 12+ (API 31+):

```json
"permissions": [
  "android.permission.BLUETOOTH_SCAN",
  "android.permission.BLUETOOTH_CONNECT",
  "android.permission.BLUETOOTH_ADVERTISE",
  "android.permission.ACCESS_FINE_LOCATION"
]
```

---

## Author

**Prince Mishra** - GitHub: [@IPrincemishra](https://github.com/IPrincemishra)

## License

This project is licensed under the [MIT License](LICENSE).
