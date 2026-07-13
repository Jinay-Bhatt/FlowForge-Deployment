<img width="4320" height="1440" alt="hh26 main poster 2 with sponsors 3x1 (4320 x 1440 px) (2)" src="https://github.com/user-attachments/assets/c698b2cd-da84-4cb0-9276-125c6a7244aa" />


# 🚀 FlowForge

> An open-source visual workflow builder and execution engine for compiling modular backend pipelines into production-ready codebases.

---

## 📌 Problem & Domain

Developing and deploying backend workflows is often slow, repetitive, and plagued by boilerplates (routing, authorization, database connections, and middleware checks). While low-code platforms exist, they lock developers in and add runtime execution overhead. 

FlowForge solves this by providing a visual, drag-and-drop builder to design API pipelines. Workflows can be tested in real-time, monitored dynamically via WebSockets, and compiled directly into standalone, production-grade Fastify/TypeScript projects without vendor lock-in.

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

**FlowForge** serves backend developers, prototype engineers, and system architects.
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

## 🧪 How to Run the Project

### Requirements:
- Node.js (v18+)
- PostgreSQL Database URL (Neon or local)
- GitHub Personal Access Token (for Exporter)
- Groq API Key (for AI Synthesizer)

### Local Setup:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Jinay-Bhatt/Backend-Api.git
   cd Backend-Api
   ```

2. **Configure Database & Environment**:
   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL="postgresql://..."
   JWT_SECRET="your-super-secret-key"
   GROQ_API_KEY="gsk_..."
   PORT=5000
   ```

3. **Initialize Database**:
   ```bash
   cd backend
   npm install
   npx prisma db push
   npx prisma db seed
   ```

4. **Run Backend Server**:
   ```bash
   npm run dev
   ```

5. **Initialize Frontend**:
   Create a `.env` file in the `frontend/` directory:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:5000"
   ```
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:3000`.

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

FlowForge represents a developer-first take on visual scripting: zero restrictions, zero lock-in, and pure TypeScript exports. Happy building!

---
