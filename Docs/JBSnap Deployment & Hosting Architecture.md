JBSnap - Deployment & Hosting Architecture
Overview
One of the most common questions when building a no-code API platform is:
“If users create APIs on my platform, where do those APIs actually run?”
The answer is simple:
Users do not get a separate server.
Instead, all APIs execute through a centralized JBSnap Execution Engine running on JBSnap infrastructure.
________________________________________
How JBSnap Deploys APIs
When a user creates a workflow:
Request ↓ Database Query ↓ Response
JBSnap stores the workflow as JSON.
Example:
{
  "projectId": "123",
  "path": "/products",
  "method": "GET",
  "workflow": {
    "nodes": [],
    "edges": []
  }
}
The workflow is stored in the database.
<!-- No backend code is generated. -->
<!-- new start -->
JBSnap supports two deployment modes:
Mode 1: Managed Runtime
Workflows execute dynamically through the JBSnap Execution Engine.
Mode 2: Code Export
JBSnap generates deployable backend source code that users can host independently.
<!-- new end -->
No separate server is created.
________________________________________
Runtime Architecture
When a request arrives:
Client ↓ JBSnap API Gateway ↓ Workflow Execution Engine ↓ Database / Services ↓ Response
The execution engine reads the workflow definition and executes it dynamically.
________________________________________
Example
User publishes:
GET /products
Generated endpoint:
https://jbsnap-api.onrender.com/api/project123/products
Request Flow:
Client ↓ /api/project123/products ↓ Find Workflow ↓ Execute Workflow ↓ Return Response
________________________________________
Why This Approach Is Better
Instead of creating:
1 Server Per User
JBSnap creates:
1 Shared Platform
Benefits:
•	Easier deployment
•	Lower costs
•	Better scalability
•	Faster API publishing
•	Simpler maintenance
________________________________________
Hackathon Deployment Architecture
Frontend
Technology:
•	Next.js
•	TypeScript
Hosting:
•	Vercel
Example:
https://jbsnap.vercel.app
Responsibilities:
•	Dashboard
•	Workflow Builder
•	Monitoring UI
•	Analytics UI
________________________________________
Backend
Technology:
•	Node.js
•	Fastify
•	TypeScript
Hosting:
•	Railway
•	Render
Example:
https://jbsnap-api.onrender.com
Responsibilities:
•	Authentication
•	Workflow Execution
•	API Gateway
•	Analytics
•	Monitoring
________________________________________
Database
Technology:
•	PostgreSQL
Providers:
•	Neon
•	Supabase
•	Railway PostgreSQL
Responsibilities:
•	User Data
•	Projects
•	Workflows
•	Logs
•	Analytics
________________________________________
Production Architecture
Frontend
jbsnap.com
↓
Backend
api.jbsnap.com
↓
Database
database.jbsnap.com
________________________________________
Custom Domain Support (Future)
Users may want their APIs to use their own domains.
Example:
api.mycompany.com
instead of
api.jbsnap.com
JBSnap can support:
Custom Domain Mapping
Client Request:
api.mycompany.com/products
↓
JBSnap Gateway
↓
Workflow Engine
↓
Response
Benefits:
•	White-label APIs
•	Enterprise customers
•	Professional branding
________________________________________
Hosting Requirements
Minimum Hackathon Setup
Frontend: Vercel
Backend: Render
Database: Neon PostgreSQL
Cost: ₹0
________________________________________
Recommended Portfolio Setup
Frontend: Vercel
Backend: Railway
Database: Neon PostgreSQL
Domain: jbsnap.xyz
Estimated Cost: ₹500-₹1500/year
________________________________________
Environment Variables
Frontend
NEXT_PUBLIC_API_URL
________________________________________
Backend
DATABASE_URL
JWT_SECRET
REDIS_URL
PORT
NODE_ENV
________________________________________
Optional Infrastructure
Redis
Purpose:
•	Caching
•	Rate Limiting
•	Queue Processing
Technology:
Redis
________________________________________
BullMQ
Purpose:
•	Background Jobs
•	Scheduled Tasks
Examples:
•	Analytics Processing
•	Email Sending
•	Workflow Scheduling
________________________________________
Socket.IO
Purpose:
Real-Time Updates
Examples:
•	Live Monitoring
•	Traffic Visualization
•	Service Mesh Updates
________________________________________
Scalability Roadmap
Phase 1
Single Backend Server
↓
Phase 2
Load Balancer
↓
Multiple Backend Instances
↓
Shared PostgreSQL
↓
Redis Cache
________________________________________
Phase 3
Microservices
•	Gateway Service
•	Workflow Engine
•	Analytics Service
•	Monitoring Service
________________________________________
Major Technical Challenge
The hardest component in JBSnap is not deployment.
The hardest component is:
Workflow Execution Engine
Responsibilities:
•	Parse workflow JSON
•	Resolve node dependencies
•	Execute nodes in order
•	Handle failures
•	Pass data between nodes
•	Generate responses
Everything else depends on this component.
For an MVP, prioritize:
1.	Workflow Builder
2.	Workflow Storage
3.	Workflow Execution Engine
4.	API Publishing
Only after these are working should monitoring, analytics, and service mesh features be added.
________________________________________
Final Deployment Summary
Frontend: Vercel
Backend: Railway / Render
Database: Neon PostgreSQL
Authentication: JWT
Real-Time Features: Socket.IO
Caching: Redis (Optional)
Queue System: BullMQ (Optional)
Domain: Optional for Hackathon Recommended for Production
API Hosting Strategy: Shared Execution Engine
Generated APIs: Executed dynamically from workflow JSON
<!-- No code generation required. -->
<!-- new start -->
Supported Hosting Models:
• Managed Cloud Runtime (SaaS via Vercel + Railway/Render + Neon DB)

*Note: While the JBSnap builder platform itself is fully managed as a SaaS service, users can compile and download their visual API workflows as standard Node.js/Fastify codebases to host on their own infrastructure.*
<!-- new end -->