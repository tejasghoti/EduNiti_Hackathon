# 🎓 EduNiti — Technical Deep Dive & Comprehensive Interview Preparation Guide

> **Author**: Kshitij Datir  
> **Project**: EduNiti (Xenia '26 Hackathon Winner 🏆)  
> **Purpose**: Complete reference guide covering initial architecture design, technology stack justifications, trade-offs, and **40 in-depth technical interview questions & answers** for technical interviews and viva examinations.

---

## 📌 Part 1: How EduNiti Was Built From Scratch

### 1. Conceptualization & Problem Discovery
When designing EduNiti for high-scale e-learning and live assessments, we analyzed why existing learning platforms fail during peak traffic (e.g., when 50,000 students start a test at 10:00 AM sharp):
- **Database Connection Spikes**: Traditional single relational databases hit `max_connections` limits immediately when thousands of concurrent clients attempt to read test questions.
- **High Read Latency**: Running complex JOIN queries across `tests`, `questions`, and `options` tables for every single student request degrades throughput.
- **Single Point of Failure**: In a monolithic setup, heavy test submission traffic causes high CPU usage that crashes authentication and user dashboard services.

### 2. Architecture Design Strategy
To build a resilient platform, we adopted four core design principles:
1. **Microservices Pattern**: Separate the system into domain-driven microservices (`Auth`, `Dashboard`, `Test`).
2. **Database-per-Service Isolation**: Each service owns its database (`xenia_auth`, `xenia_dash`, `xenia_tests`), preventing cross-domain locks and allowing independent database scaling.
3. **Cache-First Pattern for Read-Heavy Endpoints**: Read operations for live test metadata and question papers check Redis first. On cache miss, data is queried from PostgreSQL and saved back to Redis.
4. **Single API Gateway Entrypoint**: NGINX routes incoming requests to microservices, shielding inner container topology from clients while enforcing rate limits and handling CORS centrally.

---

## 🛠️ Part 2: Technology Stack & Architectural Justifications

| Technology | Role | Why Chosen? | Alternatives Considered & Why Rejected |
| :--- | :--- | :--- | :--- |
| **React 19 & Vite** | Frontend SPA | Lightning-fast HMR, component-driven UI, zero bundle bloat, virtual DOM reconciliation. | **Create React App (CRA)**: Deprecated, slow Webpack builds. **Next.js**: Overkill for client SPA with pure client-side state. |
| **Vanilla CSS System** | UI Styling | Absolute design control, zero runtime dependency overhead, lightweight CSS variables for dark-mode. | **Tailwind CSS**: Adds build complexity and verbose HTML class strings; custom design system gives unique hackathon aesthetic. |
| **Node.js & Express** | Microservice Runtime | Non-blocking asynchronous I/O event loop ideal for concurrent API requests and low memory consumption. | **Python/Django**: Blocking I/O models require multi-process workers (Gunicorn/Uvicorn), higher memory usage. |
| **TypeScript** | Type Safety | Catch errors at compile time, strict contract interfaces across services and DTOs. | **Plain JavaScript**: High risk of runtime `undefined` property errors in complex JSON response payloads. |
| **PostgreSQL 16** | Relational Database | ACID compliance, strong relational integrity, JSONB support, robust connection pool handling. | **MongoDB**: Schema-less nature can lead to inconsistent relational question/answer option structures. |
| **Prisma ORM** | Data Access Layer | Type-safe query builder, declarative schema migrations, automated TypeScript client generation. | **TypeORM / Sequelize**: Less intuitive migration workflows and weak auto-generated TypeScript types. |
| **Redis 7** | In-Memory Cache | Sub-millisecond read latency, volatile-lru eviction policy, atomic cache operations. | **Memcached**: Lacks rich data structures (hashes, sets) and cache control features. |
| **NGINX 1.27** | API Gateway & Proxy | C-based event-driven core capable of handling tens of thousands of concurrent connections with minimal RAM. | **Kong / Traefik**: Heavier memory footprints and complex Lua/YAML configurations for simple routing. |
| **AWS CloudFront** | CDN Media Edge | Edge caching of video content across global PoPs, offloading network bandwidth from backend services. | **Direct S3 / Local Disk**: High latency for global users and bandwidth bottlenecks on origin servers. |
| **Docker Compose** | Local Orchestration | Single command setup for all 6 containers (NGINX, 3 Microservices, Postgres, Redis). | **Manual Local Scripts**: Inconsistent environment setups across developer machines. |

---

## ❓ Part 3: 40 Technical Interview Questions & Answers

---

### Category A: System Architecture & Microservices (Q1 – Q8)

#### Q1: What is a microservices architecture, and why did you choose it over a monolith for EduNiti?
> **Answer**:  
> A microservices architecture decomposes an application into small, loosely coupled, independently deployable services organized around specific business domains. We chose microservices for EduNiti because:
> 1. **Independent Scalability**: The `test-service` experiences massive traffic spikes during live exam hours, while `auth-service` and `dashboard-service` remain steady. With microservices, we can scale `test-service` instances independently without wasting resources on other domains.
> 2. **Fault Isolation**: If the `dashboard-service` encounters a bug or crashes, students can still log in and take live examinations uninterrupted.
> 3. **Tech & Deployment Autonomy**: Each service can be built, updated, deployed, or scaled without redeploying the entire codebase.

#### Q2: What is the role of NGINX in your system architecture?
> **Answer**:  
> NGINX serves as the **API Gateway** and single entrypoint reverse proxy (running on port 80). It:
> 1. Hides internal container topology and microservice port assignments (3001, 3002, 3003) from the public web.
> 2. Routes requests based on URL prefixes (e.g., `/api/auth` -> `auth-service`, `/api/student` -> `dashboard-service`, `/api/test` -> `test-service`).
> 3. Handles central CORS policies, preventing security header duplications.
> 4. Enforces request rate-limiting (e.g., 10 requests/second per IP) to mitigate Denial of Service (DoS) attacks.

#### Q3: How do microservices communicate in EduNiti?
> **Answer**:  
> EduNiti uses **Stateless HTTP REST APIs** with JSON payloads over synchronous communication for client-service interactions. Authentication token verification is performed statelessly via signed **JSON Web Tokens (JWT)**. Services verify token signatures using a shared JWT secret key without needing inter-service RPC calls to `auth-service`.

#### Q4: How do you handle service discovery in your Docker environment?
> **Answer**:  
> In Docker Compose, service discovery is managed via **Docker's embedded DNS server**. Containers inside the shared bridge network (`xenia_net`) resolve service names (e.g., `auth-service`, `postgres`, `redis`) directly to container IP addresses without hardcoding static IPs.

#### Q5: What is the Database-per-Service pattern, and why is it important?
> **Answer**:  
> In EduNiti, each microservice owns its dedicated PostgreSQL database (`xenia_auth`, `xenia_dash`, `xenia_tests`). This prevents:
> - **Tight Database Coupling**: No service can execute cross-database joins or modify tables belonging to another service.
> - **Shared Resource Contention**: A slow long-running analytics query in the dashboard service will never lock tables or consume connection pools needed by the test service.

#### Q6: How do you handle distributed transactions or data consistency across microservices?
> **Answer**:  
> EduNiti follows **Eventual Consistency** principles. For immediate operations like test submission, transactions are contained within the `test-service` database (`xenia_tests`). Summary data (e.g., total tests completed, average score) needed by `dashboard-service` is synchronized either asynchronously or aggregated on-demand via lightweight API tokens.

#### Q7: What happens if NGINX fails? Isn't it a Single Point of Failure (SPOF)?
> **Answer**:  
> In local development, NGINX is a single container. However, in production cloud environments, SPOF is eliminated by deploying NGINX behind a high-availability **Cloud Load Balancer** (AWS ALB or NGINX Plus cluster) spread across multiple Availability Zones with automated health checks and auto-scaling.

#### Q8: How do you handle CORS across microservices behind NGINX?
> **Answer**:  
> Instead of each Express microservice configuring its own `cors()` middleware independently, NGINX intercepts `OPTIONS` preflight requests at the gateway layer, attaches standardized `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, and `Access-Control-Allow-Headers` response headers, and routes validated requests cleanly.

---

### Category B: Caching & Redis Optimization (Q9 – Q15)

#### Q9: Explain the "Cache-First" read pattern implemented in EduNiti.
> **Answer**:  
> When a client requests test questions (`GET /api/test/:id`):
> 1. `test-service` queries Redis using key `test:<testId>`.
> 2. **Cache Hit**: If key exists, Redis returns the JSON string immediately (< 1ms latency). It is parsed and returned to the student without hitting PostgreSQL.
> 3. **Cache Miss**: If key does not exist, `test-service` queries PostgreSQL via Prisma, constructs the formatted test response, stores it in Redis with a TTL (e.g., 600s), and returns the payload to the student.

#### Q10: How do you prevent Cache Stampede (Thundering Herd Problem)?
> **Answer**:  
> A thundering herd occurs when a high-demand cache key expires and thousands of concurrent requests hit the database simultaneously. In EduNiti, we mitigate this by:
> 1. Pre-warming Redis cache prior to scheduled live test start times using seed/admin scripts.
> 2. Setting high TTLs (e.g., 1800s) on test metadata.
> 3. Using atomic locking techniques (`SETNX`) so only one worker populates the cache on a miss while others await cache population.

#### Q11: What Redis eviction policy is configured in EduNiti, and why?
> **Answer**:  
> EduNiti uses `allkeys-lru` (Least Recently Used) with `maxmemory 128mb`. If Redis reaches memory limits, it automatically evicts the least recently accessed keys to free up space for fresh active test payloads, guaranteeing system stability without out-of-memory crashes.

#### Q12: How do you prevent sensitive data (like correct answers) from being leaked in cached payloads?
> **Answer**:  
> When `test-service` builds the cache payload for `getTestById`, it explicitly omits the `isCorrect` boolean field from options in the database select query:
> ```ts
> select: { id: true, text: true /* isCorrect is intentionally excluded */ }
> ```
> Thus, Redis never holds correct answer keys for student-facing endpoints.

#### Q13: How does EduNiti track Redis performance metrics in real time?
> **Answer**:  
> EduNiti includes a dedicated Redis Analytics endpoint (`GET /api/test/cache/stats`) that calculates total requests, cache hits, cache misses, hit ratio percentage (`(hits / total) * 100`), and estimated latency savings, rendering real-time visualization graphs on the student dashboard.

#### Q14: What is Cache Invalidation, and how is it handled in EduNiti?
> **Answer**:  
> Cache Invalidation is the process of clearing stale cached data when underlying source data changes. In EduNiti, whenever an instructor modifies a test payload, the service issues an explicit `redis.del("test:<testId>")` command to flush stale questions immediately.

#### Q15: Why Redis over Memcached?
> **Answer**:  
> 1. **Data Structures**: Redis supports rich data types (Strings, Hashes, Sets, Sorted Sets) enabling future leaderboard rank tracking.
> 2. **Persistence Options**: Redis provides RDB snapshots and AOF persistence.
> 3. **Memory Policies**: Redis provides sophisticated LRU/LFU memory eviction algorithms.

---

### Category C: Databases, Prisma ORM & SQL (Q16 – Q22)

#### Q16: Why did you choose PostgreSQL over MongoDB for EduNiti?
> **Answer**:  
> Examinations and user management require strict relational integrity, foreign key constraints (e.g., user -> submissions -> answer choices), and ACID compliance. PostgreSQL provides reliable transactional semantics, preventing data corruption during concurrent submission writes.

#### Q17: What is Prisma ORM, and what are its advantages?
> **Answer**:  
> Prisma is a next-generation Node.js/TypeScript ORM. Advantages:
> 1. **Type Safety**: Automatically generates TypeScript definitions based on the `schema.prisma` file.
> 2. **Declarative Schema & Migrations**: Easy database schema version control (`prisma migrate`).
> 3. **Query Optimization**: Generates optimized SQL under the hood without handwritten string concatenation vulnerabilities.

#### Q18: How do database migrations work in EduNiti?
> **Answer**:  
> When models change in `schema.prisma`, running `npx prisma migrate dev --name <migration_name>` generates a SQL file inside `prisma/migrations/`. In production/Docker environments, `npx prisma migrate deploy` applies pending SQL migrations safely.

#### Q19: Explain the database indexing strategy in EduNiti.
> **Answer**:  
> To guarantee fast query execution:
> - `email` column in `User` table has a **Unique Index** (`@unique`) for O(1) login lookups.
> - `testId` column in `Question` table has an **Index** to accelerate question retrieval during cache misses.
> - `scheduledAt` column in `Test` table has an index for fast filtering of active live tests.

#### Q20: How do you prevent SQL Injection attacks?
> **Answer**:  
> SQL Injection is prevented by using Prisma ORM, which uses **parameterized queries** for all database operations. User inputs are never concatenated directly into raw SQL strings.

#### Q21: What is Connection Pooling, and why is it necessary?
> **Answer**:  
> Establishing a PostgreSQL connection involves TCP handshakes and authentication overhead (~30-50ms). Connection pooling maintains a pool of reusable open connections. Prisma automatically manages connection pooling via `DATABASE_URL` pool size parameters (`?connection_limit=10`).

#### Q22: How do you handle schema changes across multiple isolated databases?
> **Answer**:  
> Each microservice manages its own `schema.prisma` file and migration folder. Schema changes in `auth-service` do not affect `test-service` database schemas, eliminating migration dependency lock-in.

---

### Category D: Authentication, Security & Gateways (Q23 – Q28)

#### Q23: How does JWT Authentication work in EduNiti?
> **Answer**:  
> 1. Student sends credentials (`POST /api/auth/login`).
> 2. `auth-service` verifies password hash using `bcrypt.compare()`.
> 3. Upon success, `auth-service` signs a JWT containing `{ userId, email, role }` using `JWT_SECRET` and returns it.
> 4. Client stores token in localStorage/cookie and attaches `Authorization: Bearer <token>` header to subsequent API calls.
> 5. Downstream services verify token signature statelessly without calling `auth-service`.

#### Q24: Why use JWT instead of Session ID stored in Redis/DB?
> **Answer**:  
> JWT is **stateless**. Any microservice can independently verify the token cryptographically using the shared secret without performing a database or Redis lookup on every incoming HTTP request, maximizing horizontal scaling.

#### Q25: How are user passwords secured?
> **Answer**:  
> Passwords are salted and hashed using **bcrypt** with a salt round factor of 10 prior to storage in PostgreSQL. Plaintext passwords are never stored or logged anywhere.

#### Q26: What rate-limiting mechanism is implemented in NGINX?
> **Answer**:  
> NGINX uses the **Leaky Bucket Algorithm** configured via `limit_req_zone`:
> ```nginx
> limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
> ```
> This caps requests from a single IP to 10 req/sec with a burst buffer, protecting downstream Node.js services from DDoS floods.

#### Q27: What HTTP security headers are enforced?
> **Answer**:  
> EduNiti uses **Helmet.js** middleware in Express and NGINX security headers:
> - `X-Content-Type-Options: nosniff`
> - `X-Frame-Options: DENY`
> - `Strict-Transport-Security (HSTS)`
> - `Content-Security-Policy (CSP)`

#### Q28: How do you prevent JWT token theft or XSS attacks?
> **Answer**:  
> - Sanitizing inputs on frontend and backend using `zod` schemas.
> - Setting short JWT expiration times (`24h`).
> - In production environments, serving tokens via `HttpOnly`, `SameSite=Strict`, `Secure` cookies.

---

### Category E: CDN, Media Streaming & AWS CloudFront (Q29 – Q32)

#### Q29: Why use AWS CloudFront CDN for video lectures instead of serving them from Node.js Express?
> **Answer**:  
> Node.js is designed for lightweight JSON I/O. Serving large video files (500MB+) from Express blocks event loop threads, saturates server network bandwidth, and increases buffer times. AWS CloudFront caches video segments at edge locations globally, serving video with minimal latency and zero origin bandwidth load.

#### Q30: How does CloudFront handle edge caching?
> **Answer**:  
> CloudFront uses HTTP headers set by origin server or AWS S3 (`Cache-Control: public, max-age=31536000`). When a user requests a video, CloudFront routes the request to the nearest Edge Location PoP (Point of Presence). If cached, it is served immediately.

#### Q31: How do you secure private video content on CloudFront?
> **Answer**:  
> Private content is restricted using **CloudFront Signed URLs** or **Signed Cookies**. The backend generates a time-limited signed URL using AWS RSA private keys, allowing only authenticated enrolled students to view specific video resources.

#### Q32: What video streaming protocols are supported?
> **Answer**:  
> CloudFront supports HTTP Progressive Downloads as well as Adaptive Bitrate Streaming protocols like **HLS (HTTP Live Streaming)** and **DASH**, dynamically adjusting video resolution based on student internet bandwidth.

---

### Category F: Frontend, React & Vercel Cloud (Q33 – Q40)

#### Q33: Why choose Vite over Create React App (CRA)?
> **Answer**:  
> Vite uses native ES Modules (ESM) and esbuild during development, providing instantaneous server start (~100ms vs ~30s in CRA) and superfast Hot Module Replacement (HMR) regardless of project scale.

#### Q34: How is global state managed in the React SPA?
> **Answer**:  
> EduNiti uses **React Context API** (`AuthContext`) combined with custom hooks (`useAuth`). This provides lightweight, global access to current user state, authentication status, and token getters without adding unnecessary third-party state libraries like Redux.

#### Q35: How does EduNiti handle client-side route protection?
> **Answer**:  
> Route protection is enforced using a `<ProtectedRoute>` wrapper component in React Router v7. If a student attempts to navigate to `/test` or `/dashboard` without a valid JWT token, they are automatically redirected to `/login`.

#### Q36: How did you optimize React rendering performance?
> **Answer**:  
> 1. **Component Decomposition**: Breaking UI into focused, modular subcomponents.
> 2. **Key Prop Optimization**: Providing unique string IDs for mapped test option lists.
> 3. **Memoization**: Using `useCallback` and `useMemo` for high-frequency handlers.

#### Q37: How does Vercel serverless deployment work for EduNiti?
> **Answer**:  
> EduNiti includes a serverless API handler (`api/index.js`) and `vercel.json` rewrite routing. Vercel automatically deploys the compiled React static bundle to global CDN edge servers and maps `/api/*` endpoints to low-latency Node.js serverless lambda functions.

#### Q38: How do you handle environment variable differentiation between Local Dev and Vercel?
> **Answer**:  
> `frontend/src/api/client.js` uses `import.meta.env.VITE_API_URL`.
> - **Local Dev**: Defaults to `/api` (proxied by Vite to NGINX at port 80).
> - **Vercel Cloud**: Defaults to serverless `/api` gateway or custom cloud backend URL defined in Vercel environment settings.

#### Q39: What is Docker multi-stage build, and how does it optimize container images?
> **Answer**:  
> Multi-stage build uses multiple `FROM` instructions in a single Dockerfile. Stage 1 compiles TypeScript and installs devDependencies. Stage 2 copies only the production build artifacts (`dist/`) and production dependencies (`node_modules`), reducing container image sizes from ~1GB down to ~120MB.

#### Q40: What are the future architectural enhancements planned for EduNiti?
> **Answer**:  
> 1. **WebSockets (Socket.io / Redis PubSub)**: Real-time live exam proctoring and synchronous leaderboard updates.
> 2. **Kafka Message Broker**: Asynchronous processing of bulk exam evaluations and automated email certificate generation.
> 3. **Kubernetes (k8s) HPA**: Horizontal Pod Autoscaling based on CPU/RAM utilization metrics during peak exam hours.

---

## 🎯 Summary Checklist for Interviews

- [x] **Microservices**: 3 independent services (`auth`, `dash`, `test`) with Database-per-Service architecture.
- [x] **API Gateway**: NGINX on Port 80 handling reverse proxying, rate limiting, and CORS.
- [x] **Caching**: Redis Cache-First pattern achieving < 1ms read latency for test data.
- [x] **Relational DB**: PostgreSQL 16 + Prisma ORM with indexed queries and type safety.
- [x] **CDN**: AWS CloudFront for low-latency edge video streaming.
- [x] **Cloud Ready**: Containerized with Docker Compose & instant Vercel cloud deployment.
