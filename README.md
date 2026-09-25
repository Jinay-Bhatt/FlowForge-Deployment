<img width="4320" height="1440" alt="hh26 main poster 2 with sponsors 3x1 (4320 x 1440 px) (2)" src="https://github.com/user-attachments/assets/c698b2cd-da84-4cb0-9276-125c6a7244aa" />


# 🚀 JBSnap

> An open-source visual workflow builder and execution engine for compiling modular backend pipelines into production-ready codebases.

---

## 📌 Problem & Domain

Developing and deploying backend workflows is often slow, repetitive, and plagued by boilerplates (routing, authorization, database connections, and middleware checks). While low-code platforms exist, they lock developers in and add runtime execution overhead. 

JBSnap solves this by providing a visual, drag-and-drop builder to design API pipelines. Workflows can be tested in real-time, monitored dynamically via WebSockets, and compiled directly into standalone, production-grade Fastify/TypeScript projects without vendor lock-in.

**Themes Selected (at least one):**
- [ ] Human Experience & Productivity  
- [ ] Climate & Sustainability Systems  
- [ ] HealthTech & Bio Platforms  
- [ ] Learning & Knowledge Systems  
- [ ] Work, Finance & Digital Economy  
- [ ] Infrastructure, Mobility & Smart Systems  
- [ ] Trust, Identity & Security  
- [ ] Media, Social & Interactive Platforms  
- [ ] Public Systems, Governance and Civic Tech  
- [✓] Developer Tools & Software Infrastructure  

---

## 🎯 Objective

**JBSnap** serves backend developers, prototype engineers, and system architects.
* **Target Users**: Developers looking to accelerate API prototyping, design visual logic chains, or generate clean backend microservices.
* **The Pain Point**: High time-to-market for simple APIs, complex boilerplate management, difficulty in mapping service-to-service communication, and platform lock-in of traditional backend workflow builders.
* **The Value**: A zero-lock-in visual workspace. Build visually, test dynamically, monitor execution, and download standard TypeScript source code ready for Docker deployment.

---

## 🧠 Team & Approach

### Team Name:  
`QuadSquad`

### Team Members:  
- **Bhavya Durgani** (GitHub: https://github.com/BhavyaDurgani)
- **Jinay Bhatt** (GitHub: https://github.com/Jinay-Bhatt)
- **Keyur Shah** (GitHub: https://github.com/KeyurShah356)
- **Hitesh Chavda** (GitHub: https://github.com/hiteshjchavda18)

### Your Approach:
- **Why we chose this**: We wanted to combine the visual developer experience of workflow builders with the absolute freedom of open-source. Code should belong to the creator, not the tool.
- **Key challenges**:
  - Exposing local workflow states cleanly inside a VM sandbox without code prefix requirements (solved by auto-destructuring `steps` and `request` variables inside the sandbox context).
  - Pushing compiled packages to empty/newly-created GitHub repositories where low-level Git Database APIs return `409` conflicts (solved by utilizing the Contents API to write the first file and initialize refs first).
- **Pivots & Iterations**: Shifted from basic `eval` environments to secure V8 VM sandboxes to prevent sandbox escape vectors while keeping the interface responsive and seamless.

---

## 🛠️ Tech Stack

### Core Technologies Used:
- **Frontend**: Next.js 14, React Flow, Vanilla CSS, Lucide Icons
- **Backend**: Fastify (Node.js), Node VM (Sandbox), BullMQ (Task Queue)
- **Database**: PostgreSQL (Neon Serverless), Prisma ORM
- **APIs**: Octokit REST (GitHub Integrations), Groq AI / Ollama (AI Workflow Synthesizer)
- **Hosting**: Vercel (Frontend), Self-hosted / Docker (Compiled Backend Codebases)

### Additional Technologies Used (Optional):
- [✓] AI / ML  
- [ ] Web3 / Blockchain  
- [✓] Cyber Security 
- [✓] Cloud  

---

## 🏆 Sponsored Track (Optional)

Select if your project participates in any track:

- [ ] **Expo Track** – Built using Expo  
- [ ] **Neo4j Track** – Uses AuraDB as primary database  
- [ ] **Base44 Track** – Prototype/Final Product built using Base44  

Provide a short note on how you used the partner technology:

> _Explain your implementation here_

---

## ✨ Key Features

* **✅ Visual Drag-and-Drop Canvas**: Build workflows using modular nodes (HTTP Client, Database Query, JS Transform, JWT Validate, API Key, Switch, If/Else, Responses).
* **✅ AI Workflow Synthesizer**: Describe your desired workflow in plain English and have AI automatically construct, connect, and configure nodes on the canvas.
* **✅ Real-Time Test Runner**: Execute gateway queries directly from a sidebar panel with custom payloads and mock headers.
* **✅ Socket.IO Live Monitor**: Pausable real-time log streaming of execution latencies, status codes, and database metrics.
* **✅ Service Mesh Registry**: Map and visualize microservice communication networks with active link graphs.
* **✅ Zero Lock-in Exporter**: Download a full compiled TypeScript/Prisma/Fastify backend codebase in a ZIP or push directly to a GitHub repository.

---

## 📽️ Demo & Deliverables

- **Demo Video Link (Mandatory):** https://drive.google.com/file/d/1PIKIjCpbW3R2nFLDsQarQCgiGg3HCaiu/view?usp=sharing 
- **Deployment Link (Recommended):** https://flow-forge-deployment.vercel.app/  
- **Pitch Deck / PPT (Optional):** https://docs.google.com/presentation/d/143rPXrPi-C3cKBe4jWKWZZX_tdy5-8_6/edit?usp=sharing&ouid=107062122404536139166&rtpof=true&sd=true

---

## ✅ Tasks & Bonus Checklist

- [✓] All team members completed the mandatory social task  
- [✓] Bonus Task 1 – Badge sharing  
- [✓] Bonus Task 2 – Blog/article  

---

## 🧪 Developer Quickstart & Setup Guide

This codebase is structured as a modular monorepo containing a Fastify backend (`backend/`) and a Next.js App Router frontend (`frontend/`).

### Prerequisites:
- **Node.js**: v18+ (v20+ recommended)
- **PostgreSQL**: Neon Serverless or any PostgreSQL 14+ database instance
- **Redis**: Redis 6+ (local or Upstash/Aiven for background task queues)
- **Groq API Key** (Optional): For AI visual pipeline workflow generation

---

### Step-by-Step Installation:

#### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Jinay-Bhatt/Backend-Api.git
cd Backend-Api

# Install dependencies for both backend and frontend in one command
npm run install-all
```

#### 2. Configure Environment Variables
Copy the provided `.env.example` templates:

**Backend (`backend/.env`):**
```bash
cp backend/.env.example backend/.env
```
Ensure the following required keys are populated in `backend/.env`:
- `DATABASE_URL`: PostgreSQL connection string with SSL mode if cloud-hosted.
- `REDIS_URL`: `redis://127.0.0.1:6379` (or cloud Redis URI).
- `JWT_SECRET`: Random 32+ character string for token signing.
- `ENCRYPTION_KEY`: Random 32-character key for securing credential secrets.

**Frontend (`frontend/.env.local`):**
```bash
cp frontend/.env.example frontend/.env.local
```
- `NEXT_PUBLIC_API_URL`: Defaults to `http://localhost:5000`.

#### 3. Initialize the Database (Prisma)
Generate the Prisma client and sync schema tables:
```bash
# From repository root:
npm run db:generate
npm run db:push
```
*(Or inside `backend/`: `npm run prisma:generate && npm run prisma:push`)*

#### 4. Run Development Servers
Open two terminal windows or run concurrently:

**Terminal 1 (Backend - Fastify & Socket.IO):**
```bash
npm run dev:backend
# Server runs at http://localhost:5000
```

**Terminal 2 (Frontend - Next.js App Router):**
```bash
npm run dev:frontend
# Client runs at http://localhost:3000
```

---

### 📦 Production Builds & Verification

To verify that both backend TypeScript and Next.js frontend compile cleanly with 0 errors:
```bash
# Build backend and frontend
npm run build
```

Individual builds:
```bash
npm run build:backend   # Runs tsc in backend
npm run build:frontend  # Runs next build with Turbopack in frontend
```

---

### 🗄️ Database Management & Schema Changes

When modifying `backend/prisma/schema.prisma`:
1. Edit `schema.prisma`.
2. Run `npm run db:generate` to regenerate `@prisma/client`.
3. Run `npm run db:push` to push schema changes directly to your database without downtime.
4. Launch Prisma Studio GUI:
   ```bash
   npm run db:studio
   ```

---

### 📁 Codebase Architecture

```
Backend-Api/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Database models (User, Project, Workflow, Notification)
│   ├── src/
│   │   ├── config/             # Environment validation and loading
│   │   ├── controllers/        # REST route handlers (auth, projects, workflows, notifications)
│   │   ├── routes/             # Fastify API routes and gateway endpoints
│   │   ├── services/           # Business logic (compiler, VM sandbox, db pool, notifications)
│   │   ├── websocket.ts        # Socket.IO real-time event streaming & user rooms
│   │   └── index.ts            # Fastify application entrypoint
│   ├── .env.example            # Backend environment template
│   └── package.json
│
├── frontend/
│   ├── public/                 # Static branding and assets
│   ├── src/
│   │   ├── app/                # Next.js 14 App Router pages (builder, monitor, gateway, settings, etc.)
│   │   ├── components/         # Shared UI components (NotificationBell, nodes, modals)
│   │   ├── context/            # React Contexts (NotificationContext, Socket.IO listeners)
│   │   └── services/           # API client with in-memory SWR caching
│   ├── .env.example            # Frontend environment template
│   └── package.json
│
├── .env.example                # Full monorepo environment template
└── package.json                # Root monorepo scripts
```

---

## 🧬 Future Scope

- 📈 **Pre-built Templates**: One-click workflows for Stripe integration, user onboarding, and messaging notifications.
- 🛡️ **Advanced RBAC**: Granular canvas-level permissions and multi-member team workspace collaboration.
- 🌐 **Serverless Targets**: Exporters to package workflows into AWS Lambda, Cloudflare Workers, or Google Cloud Functions.

---

## 📎 Resources / Credits

- [React Flow](https://reactflow.dev/) for canvas visualization.
- [Fastify](https://fastify.dev/) for high-performance server components.
- [Prisma](https://www.prisma.io/) for database object mapping.

---

## 🏁 Final Words

JBSnap represents a developer-first take on visual scripting: zero restrictions, zero lock-in, and pure TypeScript exports. Happy building!

---
