# AttendMark Server

A high-performance, secure backend API powering the **AttendMark** proximity-based classroom attendance system. Built with Node.js, Express, and MongoDB, it provides atomic attendance recording, teacher session orchestration, and hardware-bound student authentication to prevent proxy attendance.

---

## Core Features

- **Role-Based Authentication (JWT):** Distinct authentication flows for Teachers (Email/Password) and Students (Email/Roll Number + Hardware Device ID).
- **Proximity Session Management:** Teacher-controlled live session lifecycle with unique session codes broadcasted via Bluetooth Low Energy (BLE).
- **Proxy Prevention:** Device UUID binding prevents a single mobile device from submitting attendance records for multiple students.
- **Atomic Attendance Marking:** Idempotent attendance submission endpoints that prevent double-counting or race conditions during peak scan periods.
- **Live Classroom Telemetry:** Real-time metrics tracking present count, total enrolled strength, and attendance percentage.

---

## Tech Stack

- **Runtime:** [Node.js](https://nodejs.org/) (v20+)
- **Framework:** [Express.js](https://expressjs.com/)
- **Database:** [PostgreSQL Neon](https://www.postgresql.org/) via [Prisma ORM](https://www.prisma.io/)
- **Authentication:** JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
- **Validation & Security:** `cors`, `dotenv`

---

## Project Structure

```text
├── src/
│   ├── config/             # Database connection & server environment configs
│   ├── controllers/        # Request handlers (auth, attendance, session)
│   ├── middlewares/        # JWT auth verification, role guards & error handlers
│   ├── models/             # Prisma schema definitions (User, Session, Attendance)
│   ├── routes/             # Express API route declarations
│   └── utils/              # Helper utilities and token generators
├── .env.example
├── package.json
└── server.js               # Application entry point
```

---

## Getting Started

### Prerequisites

- **Node.js** (v18.x or v20.x recommended)
- **PostgreSQL** instance (Local or PostgreSQL Neon cluster)
- **Package Manager:** `pnpm` / `npm` / `yarn`

### Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/iprincemishra/attendMark.git
    cd attendmark/server
    ```

2. **Install dependencies:**

    ```bash
    pnpm install
    # or
    npm install
    ```

3. **Configure Environment Variables:**
Create a `.env` file in the root directory:

    ```env
    PORT=5000
    NODE_ENV=development
    DATABASE_URL=postgresql://user:password@localhost/attendmark
    JWT_SECRET=your_super_secret_jwt_key
    JWT_EXPIRES_IN=7d
    ```

4. **Start the Development Server:**

    ```bash
    pnpm run dev
    # or
    npm run dev
    ```

---

## API Specification

### Authentication

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/teacher-login` | Public | Authenticates teacher via email and password |
| `POST` | `/api/auth/student-login` | Public | Authenticates student, binds and validates `deviceId` |

### Attendance & Session Management

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/attendance/start-session` | Teacher | Initializes a new classroom session & generates session code |
| `POST` | `/api/attendance/mark` | Student | Validates session code, timestamp, and marks student present |
| `GET` | `/api/attendance/:sessionId` | Teacher | Returns live session statistics and marked students list |
| `POST` | `/api/attendance/end-session` | Teacher | Concludes session, locks attendance records |

---

## Security Architecture

1. **Hardware Verification:** During login and marking, student records require matching the persistent device identifier stored in hardware secure storage to defeat proxy submissions.
2. **Session Windows:** Session codes are validated against server-side active flags, disallowing submissions once a teacher ends the broadcast.
3. **Index Constraints:** Compound unique indexing (`sessionId` + `studentId`) ensures impossible duplicate entries within a single session.

---

## Author

**Prince Mishra** - GitHub: [@IPrincemishra](https://github.com/IPrincemishra)
