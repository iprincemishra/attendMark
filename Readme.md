# AttendMark

> A proximity-based, anti-proxy classroom attendance ecosystem powered by Bluetooth Low Energy (BLE) and RESTful API architecture.

AttendMark replaces paper rosters and exploitable QR codes with short-range BLE radio signals. During an active class, the teacher's mobile device acts as a localized BLE peripheral beacon broadcasting an active session token. Students present within physical transmission radius (10–15 meters) detect the broadcast and submit an attendance payload bound directly to their device's hardware identifier.

---

## Download & Releases

> ### Android APK Coming Soon
>
> The standalone production release (`.apk`) is currently being compiled and tested for Android devices (Android 8.0 to Android 14+).
>
> * **Status:** In internal testing & QA
> * **Upcoming Release:** Available soon under the [GitHub Releases](https://github.com/IPrincemishra/attendmark/releases) section.
>
> For now, developers can build and run the application locally from source using the instructions below.

---

## Monorepo Architecture

```text
attendmark/
├── mobile/                  # React Native + Expo client application
├── server/                  # Node.js + Express + MongoDB backend API
└── README.md                # Project documentation root
```

---

## ⚡ How It Works

```text
  ┌───────────────────────┐                    ┌────────────────────────┐
  │   Teacher Device      │                    │     Student Device     │
  │ (BLE Peripheral Mode) │                    │  (BLE Central Scanner) │
  └──────────┬────────────┘                    └───────────┬────────────┘
             │                                             │
             │ 1. POST /attendance/start-session           │
             │ 2. Broadcasts Session Code via BLE          │
             ├───────────────── Range: 10-15m ────────────►│
             │                                             │ 3. Captures Beacon Signal
             │                                             │ 4. Extracts Device UUID
             │                                             │ 5. POST /attendance/mark
             │                                             ▼
             │                                 ┌────────────────────────┐
             │                                 │   AttendMark Server    │
             │◄────────────────────────────────┤ (Node.js, Express, DB) │
             │ 6. Real-time Roster Updates     └────────────────────────┘
```

1. **Session Initialization:** The teacher selects a subject and initiates attendance. The backend generates a secure `sessionId` and `sessionCode`.
2. **Signal Broadcast:** The teacher's device begins broadcasting the session token via native Android BLE advertisement packets.
3. **Proximity Handshake:** Students within classroom range scan and intercept the peripheral advertisement data.
4. **Hardware Validation:** The student's app pairs the session token with the device's hardware ID (`AndroidId` / `IosIdForVendor`) and submits it to the API.
5. **Anti-Proxy Verification:** The server confirms that the device identifier belongs to the authenticated student and has not already marked attendance for another account during the session.

---

## 🛠️ Tech Stack Matrix

| Domain | Technologies |
| --- | --- |
| **Mobile Client** | React Native, Expo (SDK 52+), Expo Router, NativeWind (Tailwind CSS), Custom Native Kotlin BLE Modules, Expo Haptics |
| **Backend Server** | Node.js (v20+), Express.js, PostgreSQL (Neon), Prisma ORM, JSON Web Tokens (JWT), Bcrypt |
| **Tooling & Env** | npm, pnpm, Android SDK (API 34+), JDK 17, PowerShell |

---

## Quick Start Guide

### Prerequisites

* **Node.js** (v18.x or v20.x LTS)
* **pnpm** (or `npm`)
* **PostgreSQL** instance (Local or Atlas)
* **Android Studio** with Platform Tools (API 34+)
* **Physical Android Device** (BLE advertising and scanning require physical Bluetooth hardware and cannot run on an emulator)

---

### 1. Backend Server Setup

```bash
# Navigate to server workspace
cd server

# Install dependencies
pnpm install

# Create environment configuration
cp .env.example .env
```

Configure your `.env` variables:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/attendmark
JWT_SECRET=your_production_secret_key_here
JWT_EXPIRES_IN=7d

```

Start the server:

```bash
# Development mode
pnpm run dev
```

---

### 2. Mobile App Setup

```bash
# Navigate to mobile workspace
cd ../mobile

# Install dependencies
pnpm install
```

Configure the API base URL in `mobile/src/services/api.ts` to point to your machine's local IP address (e.g., `http://192.168.1.15:5000/api`).

Generate native build files and run on a connected Android phone:

```bash
# Prebuild custom native Kotlin modules
npx expo prebuild --clean

# Run directly on USB-connected physical Android device
npx expo run:android
```

---

## Security & Anti-Proxy Safeguards

* **Hardware Binding:** Student accounts are permanently associated with their physical device's hardware identifier stored in secure hardware storage, preventing "phone passing" or multiple logins from one phone.
* **Physical Proximity Enforced:** BLE signal drop-off ensures that attendance can only be logged by students physically present in the same room.
* **Atomic Compound Uniqueness:** Database compound indexing prevents race conditions, replay attacks, or duplicate submissions.
* **Rolling Broadcast Lifecycles:** Sessions exist in strict, short-lived windows controlled directly by the teacher's broadcast status.

---

## Sub-package Docs

* Detailed API specs, database schemas, and endpoints: see [`server/README.md`](https://github.com/iprincemishra/attendMark/tree/main/server#readme).
* Native BLE configuration, permission manifest, and UI flows: see [`mobile/README.md`](https://github.com/iprincemishra/attendMark/tree/main/mobile#readme).

---

## 👨‍💻 Author

**Prince Mishra** - GitHub: [@IPrincemishra](https://github.com/IPrincemishra)

## 📄 License

This repository is distributed under the [MIT License](https://www.google.com/search?q=LICENSE).
