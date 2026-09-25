import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Helper to encrypt credentials token
function encryptToken(text: string): string {
  const encKey = process.env.ENCRYPTION_KEY || "0123456789bcfdab0123456789abcdef0123456789abcdef0123456789abcdef";
  const key = Buffer.from(encKey, "hex");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Create SQL tables and dummy records in database
  console.log("🛠️ Setting up SQL tables...");
  
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      price DECIMAL(10,2) NOT NULL DEFAULT 0.00
    );
  `);
  
  await prisma.$executeRawUnsafe(`
    INSERT INTO products (name, stock, price)
    VALUES 
      ('iPhone 15 Pro', 100, 999.99),
      ('MacBook Pro 16', 50, 2499.99),
      ('AirPods Pro', 200, 249.99)
    ON CONFLICT (name) DO UPDATE 
    SET stock = EXCLUDED.stock, price = EXCLUDED.price;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      invoice_number VARCHAR(100) UNIQUE NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(50) NOT NULL
    );
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO invoices (invoice_number, amount, status)
    VALUES 
      ('INV-2026-001', 999.99, 'paid'),
      ('INV-2026-002', 2499.99, 'pending'),
      ('INV-2026-003', 499.98, 'paid')
    ON CONFLICT (invoice_number) DO UPDATE 
    SET amount = EXCLUDED.amount, status = EXCLUDED.status;
  `);

  console.log("✅ SQL tables and data set up successfully!");

  // 2. Create Test User
  const email = "test@jbsnap.com";
  const password = "password123";
  const username = "testuser";
  const passwordHash = await bcrypt.hash(password, 10);

  // Upsert user
  console.log(`👤 Upserting test user: ${email}...`);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      username,
      passwordHash,
    },
    create: {
      username,
      email,
      passwordHash,
    },
  });

  // 3. Create Test Projects
  console.log("📦 Creating test projects...");
  
  // Let's delete any old seed projects by ID to avoid unique constraint violations
  const projectIdsToClean = [
    "bb1484ba-e457-435d-a071-9b706d64959f",
    "f0341bff-f947-477f-b046-c4b5a492cab0",
    "c359218a-13dc-4279-a8ac-c73d2a1bacb4"
  ];
  for (const pid of projectIdsToClean) {
    try {
      await prisma.project.delete({ where: { id: pid } });
    } catch (e) {
      // Ignore if project doesn't exist yet
    }
  }

  const projectEcommerce = await prisma.project.create({
    data: {
      id: "bb1484ba-e457-435d-a071-9b706d64959f",
      name: "E-Commerce Core API Gateway",
      description: "Visual pipelines for payment processing, inventory status check, and logging audits",
      ownerId: user.id,
    },
  });

  const projectProcurement = await prisma.project.create({
    data: {
      id: "f0341bff-f947-477f-b046-c4b5a492cab0",
      name: "Procurement and Vendor Management System",
      description: "Vendor logins, invoice approvals, and internal diagnostics",
      ownerId: user.id,
    },
  });

  const projectTesting = await prisma.project.create({
    data: {
      id: "c359218a-13dc-4279-a8ac-c73d2a1bacb4",
      name: "Testing",
      description: "Sandbox project to test and verify dynamic workflow transformations and logs",
      ownerId: user.id,
    },
  });

  // 4. Create Git Configuration
  console.log("🐙 Creating Git config...");
  const encryptedToken = encryptToken("ghp_dummytokentoenablelocalyzipdownload123");
  await prisma.gitConfiguration.create({
    data: {
      userId: user.id,
      provider: "GITHUB",
      accessToken: encryptedToken,
      repositoryName: "testowner/ecommerce-gateway",
      repositoryUrl: "https://github.com/testowner/ecommerce-gateway",
      isActive: true,
    },
  });

  // 5. Create Workflows
  console.log("⚡ Creating workflows...");

  // --- E-Commerce Core API Gateway Workflows ---
  // Workflow 1: Checkout Processing
  const checkoutNodes = [
    {
      id: "node_trigger",
      type: "triggerNode",
      position: { x: 100, y: 150 },
      data: { method: "POST", path: "/checkout" },
    },
    {
      id: "node_db",
      type: "databaseNode",
      position: { x: 400, y: 150 },
      data: { query: "SELECT stock, price FROM products WHERE name = $request.body.itemName LIMIT 1;" },
    },
    {
      id: "node_code",
      type: "customCodeNode",
      position: { x: 700, y: 150 },
      data: {
        code: "const dbResult = context.steps.node_db;\nconst requestBody = context.request.body;\n\nif (!dbResult || dbResult.length === 0) {\n  return { success: false, error: 'Product not found' };\n}\n\nconst product = dbResult[0];\nif (product.stock < requestBody.quantity) {\n  return { success: false, error: 'Insufficient inventory' };\n}\n\nreturn {\n  success: true,\n  totalPrice: Number(product.price) * requestBody.quantity,\n  itemName: requestBody.itemName,\n  quantity: requestBody.quantity\n};"
      },
    },
    {
      id: "node_response",
      type: "responseNode",
      position: { x: 1000, y: 150 },
      data: { statusCode: 200, body: "$steps.node_code" },
    },
  ];

  const checkoutEdges = [
    {
      id: "edge_1",
      source: "node_trigger",
      target: "node_db",
      animated: true,
      style: { stroke: "#6366f1", strokeWidth: 2 },
      markerEnd: { type: "arrowclosed", color: "#6366f1" },
    },
    {
      id: "edge_2",
      source: "node_db",
      target: "node_code",
      animated: true,
      style: { stroke: "#6366f1", strokeWidth: 2 },
      markerEnd: { type: "arrowclosed", color: "#6366f1" },
    },
    {
      id: "edge_3",
      source: "node_code",
      target: "node_response",
      animated: true,
      style: { stroke: "#6366f1", strokeWidth: 2 },
      markerEnd: { type: "arrowclosed", color: "#6366f1" },
    },
  ];

  await prisma.workflow.create({
    data: {
      id: "400b187a-a782-4a45-94de-6417e8801557",
      name: "Checkout Process",
      method: "POST",
      path: "/checkout",
      nodes: checkoutNodes,
      edges: checkoutEdges,
      isPublished: true,
      projectId: projectEcommerce.id,
    },
  });

  // Workflow 2: Get Invoices
  const invoicesNodes = [
    {
      id: "node_trigger",
      type: "triggerNode",
      position: { x: 100, y: 150 },
      data: { method: "GET", path: "/invoices" },
    },
    {
      id: "node_db",
      type: "databaseNode",
      position: { x: 450, y: 150 },
      data: { query: "SELECT * FROM invoices ORDER BY amount DESC;" },
    },
    {
      id: "node_response",
      type: "responseNode",
      position: { x: 800, y: 150 },
      data: { statusCode: 200, body: "$steps.node_db" },
    },
  ];

  const invoicesEdges = [
    {
      id: "edge_1",
      source: "node_trigger",
      target: "node_db",
      animated: true,
      style: { stroke: "#6366f1", strokeWidth: 2 },
      markerEnd: { type: "arrowclosed", color: "#6366f1" },
    },
    {
      id: "edge_2",
      source: "node_db",
      target: "node_response",
      animated: true,
      style: { stroke: "#6366f1", strokeWidth: 2 },
      markerEnd: { type: "arrowclosed", color: "#6366f1" },
    },
  ];

  await prisma.workflow.create({
    data: {
      id: "3273aa8a-fbb7-46ab-90f8-108b3f32bd0e",
      name: "Get Invoices List",
      method: "GET",
      path: "/invoices",
      nodes: invoicesNodes,
      edges: invoicesEdges,
      isPublished: true,
      projectId: projectEcommerce.id,
    },
  });

  // Workflow 3: Diagnostics
  const diagNodes = [
    {
      id: "node_trigger",
      type: "triggerNode",
      position: { x: 100, y: 150 },
      data: { method: "GET", path: "/status" },
    },
    {
      id: "node_code",
      type: "customCodeNode",
      position: { x: 450, y: 150 },
      data: { code: "return {\n  status: 'operational',\n  timestamp: new Date().toISOString()\n};" },
    },
    {
      id: "node_response",
      type: "responseNode",
      position: { x: 800, y: 150 },
      data: { statusCode: 200, body: "$steps.node_code" },
    },
  ];

  const diagEdges = [
    {
      id: "edge_1",
      source: "node_trigger",
      target: "node_code",
      animated: true,
      style: { stroke: "#6366f1", strokeWidth: 2 },
      markerEnd: { type: "arrowclosed", color: "#6366f1" },
    },
    {
      id: "edge_2",
      source: "node_code",
      target: "node_response",
      animated: true,
      style: { stroke: "#6366f1", strokeWidth: 2 },
      markerEnd: { type: "arrowclosed", color: "#6366f1" },
    },
  ];

  await prisma.workflow.create({
    data: {
      id: "ee49b906-4842-49c4-a3bb-93a6c20242ec",
      name: "Diagnostics Status",
      method: "GET",
      path: "/status",
      nodes: diagNodes,
      edges: diagEdges,
      isPublished: true,
      projectId: projectEcommerce.id,
    },
  });

  // --- Procurement and Vendor Management System Workflows ---
  await prisma.workflow.create({
    data: {
      id: "2acd072c-36ed-4e52-96b7-3b26ac0f5790",
      name: "Fetch Login id",
      method: "GET",
      path: "/Users:id",
      nodes: [],
      edges: [],
      isPublished: true,
      projectId: projectProcurement.id,
    },
  });

  // --- Testing Workflows ---
  await prisma.workflow.create({
    data: {
      id: "d1d74661-62a8-45a1-a9c7-c4e2029943e9",
      name: "Get Product",
      method: "GET",
      path: "/Product",
      nodes: [],
      edges: [],
      isPublished: false,
      projectId: projectTesting.id,
    },
  });

  const productCrudNodes = [
    {
      id: "node_1",
      data: { path: "/products", method: "GET" },
      type: "triggerNode",
      position: { x: 0, y: 300 }
    },
    {
      id: "node_2",
      data: { query: "SELECT * FROM products" },
      type: "databaseNode",
      position: { x: 250, y: 300 }
    },
    {
      id: "node_3",
      data: { mapping: "context.steps.node_2.map(product => ({ id: product.id, name: product.name, price: product.price }))" },
      type: "transformNode",
      position: { x: 500, y: 300 }
    },
    {
      id: "node_4",
      data: { body: "$steps.node_3", statusCode: 200 },
      type: "responseNode",
      position: { x: 750, y: 300 }
    }
  ];

  const productCrudEdges = [
    { id: "edge_1", source: "node_1", target: "node_2", animated: true },
    { id: "edge_2", source: "node_2", target: "node_3", animated: true },
    { id: "edge_3", source: "node_3", target: "node_4", animated: true }
  ];

  await prisma.workflow.create({
    data: {
      id: "50d30142-40fa-499e-acb8-b529ee3bbbd0",
      name: "Product CRUD API",
      method: "GET",
      path: "/products",
      nodes: productCrudNodes,
      edges: productCrudEdges,
      isPublished: true,
      projectId: projectTesting.id,
    },
  });

  console.log("🚀 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    pool.end();
  });
