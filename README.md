# http

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.5. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
# Live Attendance Backend (Express + WebSockets)

A production-ready **live attendance system** built with **Express.js**, **MongoDB**, and **WebSockets**, supporting real-time attendance marking with role-based access control for **teachers** and **students**.

## ✨ Features
- JWT-based authentication (signup/login/me)
- Role-based access control (Teacher / Student)
- Class creation & student enrollment
- Live attendance sessions (start → mark → summary → persist)
- Real-time updates via WebSockets
- Persistent attendance records in MongoDB
- Fully validated request schemas
- Centralized error handling
- 65/75 passing HTTP and Websocket tests [here](https://github.com/rahul-MyGit/mid-test)

## 🧠 Tech Stack
- **Bun.js**, **Express**
- **TypeScript**
- **MongoDB + Mongoose**
- **JWT Authentication**
- **WebSockets** (`express-ws`)
- **Zod** for schema validation

## 🚀 Getting Started
```bash
bun add
bun index.ts
