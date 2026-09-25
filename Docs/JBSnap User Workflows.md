JBSnap - Complete User Workflows
Workflow 1 - User Registration
User visits platform ↓ Creates account ↓ Verifies email ↓ Logs in ↓ Accesses dashboard
________________________________________
Workflow 2 - Create New Project
Dashboard ↓ Create Project ↓ Enter Project Name ↓ Project Created ↓ Open Builder
________________________________________
Workflow 3 - Create API Using Visual Builder
Open Builder ↓ Drag Request Node ↓ Drag Database Node ↓ Drag Response Node ↓ Connect Nodes ↓ Configure Properties ↓ Save Workflow
Result:
Request ↓ Database Query ↓ Response
________________________________________
Workflow 4 - Publish API
Workflow Saved ↓ Click Publish ↓ Generate Endpoint ↓ Register Route ↓ Deploy
Output:
https://api.jbsnap.com/project/products
________________________________________
Workflow 5 - Execute API
Client Request ↓ API Gateway ↓ Authentication Check ↓ Rate Limiter ↓ Workflow Engine ↓ Database ↓ Response
________________________________________
Workflow 6 - Enable JWT Authentication
Open Gateway Settings ↓ Enable JWT ↓ Provide Secret Key ↓ Save Configuration ↓ Gateway Protects Endpoint
________________________________________
Workflow 7 - Configure Rate Limiting
Open Endpoint Settings ↓ Set Requests Per Minute ↓ Save Configuration ↓ Gateway Applies Limits
________________________________________
Workflow 8 - Import Existing Service
Services Page ↓ Add Service ↓ Provide Name ↓ Provide Base URL ↓ Save
Example:
User Service http://localhost:8080
Order Service http://localhost:3000
________________________________________
Workflow 9 - Configure Routing
Create Route ↓ Define Path
/api/users/*
↓
Select Service
User Service
↓
Save
________________________________________
Workflow 10 - Monitor Traffic
Incoming Request ↓ Log Request ↓ Store Metrics ↓ Display Dashboard
Metrics:
•	Requests
•	Errors
•	Latency
•	Success Rate
________________________________________
Workflow 11 - Analytics Processing
Request Logged ↓ Analytics Service ↓ Aggregate Metrics ↓ Generate Insights ↓ Display Charts
________________________________________
Workflow 12 - Service Mesh Visualization
Services Registered ↓ Detect Relationships ↓ Generate Graph ↓ Visualize Connections ↓ Show Live Traffic
________________________________________
Workflow 13 - AI Workflow Generator
User Prompt
“Create Product CRUD API”
↓
AI Generates Flow
Request ↓ Validate ↓ Database ↓ Response
↓
User Reviews ↓ Publish API
<!-- new start -->
________________________________________
Workflow 14 - Export Backend Code
User Opens Project
↓
Click Export Code
↓
Generate Backend Source
↓
Generate OpenAPI Specification
↓
Download ZIP
Output:
backend.zip
Benefits:
• No Vendor Lock-In
• Full Ownership
• Deploy Anywhere
________________________________________
Workflow 15 - GitHub Integration
Connect GitHub Account
↓
Select Repository
↓
Commit Generated Backend
↓
Push Changes
Result:
Version Controlled Backend
Benefits:
• Automatic Backups
• Team Collaboration
• Rollback Support
________________________________________
Workflow 16 - Custom Code Node
Open Workflow Builder
↓
Drag Custom Code Node
↓
Write JavaScript Function
↓
Connect To Workflow
↓
Publish API
Result:
Visual Workflow + Custom Logic
<!-- new end -->