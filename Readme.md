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
- 100% passing HTTP tests

## 🧠 Tech Stack
- **Node.js**, **Express**
- **TypeScript**
- **MongoDB + Mongoose**
- **JWT Authentication**
- **WebSockets** (`express-ws`)
- **Zod** for schema validation

## 🚀 Getting Started
```bash
bun add
bun index.ts
