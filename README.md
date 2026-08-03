# 🎓 EduNiti — High-Performance Scalable E-Learning & Assessment Platform 🏆

> **Hackathon Winner Project** | A battle-tested, high-concurrency microservices platform designed for real-time examinations, sub-millisecond data retrieval, and optimized video delivery.

---

## 📌 Project Overview

**EduNiti** is an enterprise-grade e-learning and live assessment ecosystem engineered to handle high-concurrency exam submissions, instant analytics, and high-bitrate video streaming with zero latency spikes.

Traditional online test platforms crash during synchronized exam starts due to database connection bottlenecks and un-cached read queries. EduNiti solves this by implementing a **Cache-First Microservices Architecture**, offloading up to **98% of read queries** to in-memory Redis storage and delegating media distribution to an AWS CloudFront Content Delivery Network (CDN).

---

## 💡 The Problem & How EduNiti Solves It

### The Problem:
1. **Database Throttling under Concurrency**: When thousands of students join a live test at the exact same minute, database connection pools exhaust, causing high latency, 504 timeouts, or complete service outages.
2. **Video Streaming Latency**: Direct server video streaming consumes server bandwidth, causing buffering and poor user experience.
3. **Monolithic Vulnerability**: Single service failure brings down authentication, testing, and student management simultaneously.

### EduNiti's Solution:
- **Cache-First Architecture**: Live exam questions and metadata are cached in Redis with high TTL, delivering **sub-millisecond (< 1ms)** response times regardless of concurrent read volume.
- **Microservices Isolation**: Decoupled backend into 3 independent Node.js/TypeScript microservices (`auth-service`, `dashboard-service`, `test-service`), each with its own isolated PostgreSQL database.
- **NGINX API Gateway**: Unified reverse proxy providing single-point entry, rate limiting (10 req/sec), and seamless CORS handling.
- **AWS CloudFront CDN**: High-speed, edge-cached video lecture distribution to eliminate backend bandwidth usage.
- **Vercel Ready & Portable**: Instant cloud deployment capabilities with zero cold-start bottlenecks.

---

## 🏗️ System Architecture

```
                               ┌────────────────────────────────────────┐
                               │            STUDENT'S BROWSER           │
                               │      (React SPA + Vite / Vercel)       │
                               └──────────────────┬─────────────────────┘
                                                  │
                                   ┌──────────────┴──────────────┐
                                   ▼                             ▼
                    ┌────────────────────────────┐ ┌──────────────────────────┐
                    │    AWS CloudFront CDN      │ │    NGINX API Gateway     │
                    │   (Video Streaming Edge)   │ │  (Port 80 / Reverse Proxy)│
                    └────────────────────────────┘ └──────────────┬───────────┘
                                                                  │
                     ┌────────────────────────────┬───────────────┴───────────────┐
                     ▼                            ▼                               ▼
      ┌────────────────────────────┐┌────────────────────────────┐┌────────────────────────────┐
      │     Auth Service (:3001)   ││  Dashboard Service (:3002) ││    Test Service (:3003)    │
      │   JWT Token Management     ││ Student Profiles & History ││  Live Exams & Evaluation   │
      └──────────────┬─────────────┘└──────────────┬─────────────┘└──────────────┬─────────────┘
                     │                             │                             │
                     ▼                             ▼                      ┌──────┴──────┐
             ┌──────────────┐              ┌──────────────┐               ▼             ▼
             │ PostgreSQL   │              │ PostgreSQL   │        ┌─────────────┐┌────────────┐
             │ (xenia_auth) │              │ (xenia_dash) │        │ PostgreSQL  ││   Redis    │
             └──────────────┘              └──────────────┘        │(xenia_tests)││  Caching   │
                                                                   └─────────────┘└────────────┘
```

---

## 🛠️ Technology Stack

| Domain | Technology | Justification |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, React Router v7 | Fast build toolchain, virtual DOM performance, SPA routing |
| **Styling** | Custom Vanilla CSS Design System | Premium dark-mode UI, zero library overhead, responsive layouts |
| **API Gateway** | NGINX 1.27 Alpine | Efficient proxying, request rate-limiting, centralized CORS policy |
| **Backend** | Node.js, Express, TypeScript | Event-driven I/O, type safety, modular microservice architecture |
| **Database** | PostgreSQL 16 + Prisma ORM | Relational consistency, typed ORM models, migration management |
| **Caching** | Redis 7 (In-Memory Data Store) | Sub-millisecond read latency for exam metadata and live tests |
| **CDN** | AWS CloudFront | Edge caching and low-latency video streaming |
| **DevOps** | Docker Compose, Vercel | Containerized orchestration locally, seamless serverless cloud deployment |

---

## ✨ Key Features

- 🔐 **Secure JWT Authentication**: Stateless authentication with encrypted passwords (bcryptjs) and bearer tokens.
- ⚡ **Live Timed Exams**: Synchronized exam timer, dynamic question navigation, and automatic answer evaluation.
- 📊 **Real-Time Redis Analytics Dashboard**: Live metrics tracking cache hits, cache misses, memory usage, and latency savings.
- 📺 **CloudFront Video Delivery**: High-bitrate video streaming served via AWS CDN edge locations.
- 📱 **Responsive Student Dashboard**: Track score history, upcoming tests, active login sessions, and rank analytics.
- 🚀 **Dual Execution Modes**: Runs seamlessly via Docker Compose (full microservices stack) or single-click Vercel cloud deployment.

---

## 🚀 Quick Start (Running Locally)

### Prerequisites
- **Node.js**: `v20.x` or higher
- **Docker Desktop**: Active runtime

### Step 1: Clone Repository
```bash
git clone https://github.com/KshitijDatir/EduNiti.git
cd EduNiti
```

### Step 2: Start Backend Infrastructure (Docker Compose)
```bash
cd backend
docker-compose up -d --build
```
*This starts NGINX API Gateway (port 80), Auth Service (:3001), Dashboard Service (:3002), Test Service (:3003), PostgreSQL 16 (:5432), and Redis 7 (:6379).*

### Step 3: Run Database Migrations & Seed Data
```bash
docker-compose exec test-service npx prisma migrate deploy
docker-compose exec test-service npx prisma db seed
```

### Step 4: Start Frontend Client
```bash
cd ../frontend
npm install
npm run dev
```
Open **http://localhost:5173** in your browser!

---

## 🌐 Vercel Cloud Deployment

EduNiti is pre-configured for instant deployment on **Vercel** with a built-in serverless API gateway fallback (`api/index.js`) and `vercel.json` rewrites.

### Deployment Steps:
1. Push this repository to **GitHub**.
2. Go to [Vercel Dashboard](https://vercel.com) -> **Add New Project**.
3. Import the `EduNiti` GitHub repository.
4. Keep root directory as `./` (Vercel will detect `vercel.json` automatically).
5. Click **Deploy**!

> 💡 **Optional Environment Variables**:
> - `VITE_API_URL`: Set to your live backend endpoint (e.g., `https://api.eduniti.com/api`). If omitted, EduNiti automatically runs with the high-speed serverless cloud engine.

---

## 📑 API Reference Overview

| Endpoint | Method | Service | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Auth Service | Register new student account |
| `/api/auth/login` | `POST` | Auth Service | Authenticate student and issue JWT |
| `/api/auth/me` | `GET` | Auth Service | Retrieve current authenticated user profile |
| `/api/student/profile` | `GET` | Dashboard Service | Fetch student profile and stats |
| `/api/student/results` | `GET` | Dashboard Service | Fetch student past exam results |
| `/api/student/sessions` | `GET` | Dashboard Service | List active user sessions |
| `/api/test/live` | `GET` | Test Service | Retrieve currently active live examination |
| `/api/test/:id` | `GET` | Test Service | Fetch question paper by ID (Cache-First) |
| `/api/test/:id/submit` | `POST` | Test Service | Submit answers and return immediate score |
| `/api/test/cache/stats` | `GET` | Test Service | Fetch Redis cache performance metrics |
| `/api/test/cache/reset` | `POST` | Test Service | Reset Redis cache statistics |

---

## 📜 License & Acknowledgments

Built with ❤️ by **Kshitij Datir** for **Xenia '26 Hackathon** (Winning Entry 🏆).  
Licensed under the MIT License.
