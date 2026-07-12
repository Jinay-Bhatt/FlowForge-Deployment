import { config } from "../config/index.js";

interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

interface GeneratedWorkflow {
  name: string;
  path: string;
  method: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  description: string;
}

const systemPrompt = `You are a backend API workflow generator for the FlowForge platform.
Given a user's description, generate a complete workflow JSON with nodes and edges for a visual API builder.

Node types available:
- triggerNode: HTTP entry point (data: { method: string, path: string })
- databaseNode: PostgreSQL query (data: { query: string })
- customCodeNode: JavaScript logic (data: { code: string })
- ifElseNode: Conditional branching (data: { condition: string })
- transformNode: Data transformation (data: { mapping: string })
- responseNode: HTTP response (data: { statusCode: number, body: string })
- webhookNode: Webhook trigger (data: { secret: string })
- jwtValidateNode: JWT validation (data: { secret: string })
- apiKeyNode: API key check (data: { headerName: string })

Return ONLY a valid JSON object matching this schema (no markdown, no explanation, no backticks):
{
  "name": "string (descriptive workflow name)",
  "path": "string (URL path starting with /)",
  "method": "GET|POST|PUT|DELETE|PATCH",
  "description": "string (brief description)",
  "nodes": [
    { "id": "node_1", "type": "nodeType", "position": { "x": 100, "y": 100 }, "data": {} }
  ],
  "edges": [
    { "id": "edge_1", "source": "node_1", "target": "node_2", "animated": true }
  ]
}

Position nodes in a left-to-right flow with x incrementing by 250 and y centered around 300.
Always start with a triggerNode and end with a responseNode.`;

export async function generateWorkflowFromPrompt(prompt: string): Promise<GeneratedWorkflow> {
  const provider = (process.env.AI_PROVIDER || "auto").toLowerCase();
  
  let providersToTry: string[] = [];
  
  if (provider === "auto") {
    // Priority Order: Groq -> Ollama
    const groqKey = process.env.GROQ_API_KEY;
    
    if (groqKey && groqKey !== "your-groq-api-key-here" && groqKey.trim() !== "") {
      providersToTry.push("groq");
    }
    providersToTry.push("ollama"); // Local fallback always added last
  } else {
    // Explicit provider requested by user
    providersToTry = [provider];
  }

  console.log(`🤖 AI Workflow Generator: Attempting providers in priority order: ${providersToTry.join(" -> ")}`);

  const errors: string[] = [];

  for (const currentProvider of providersToTry) {
    try {
      console.log(`🤖 AI Workflow Generator: Querying "${currentProvider}"...`);
      const workflow = await queryAIProvider(currentProvider, prompt);
      console.log(`✅ AI Workflow Generator: Successfully generated workflow using "${currentProvider}"`);
      return workflow;
    } catch (e: any) {
      const errMsg = `Provider "${currentProvider}" failed: ${e.message}`;
      console.warn(`⚠️ ${errMsg}`);
      errors.push(errMsg);
      // Fall through to try the next configured provider
    }
  }

  // If all providers failed, throw combined error
  throw new Error(`All configured AI providers failed:\n- ${errors.join("\n- ")}`);
}

async function queryAIProvider(provider: string, prompt: string): Promise<GeneratedWorkflow> {
  let responseText = "";

  if (provider === "groq") {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === "your-groq-api-key-here") {
      throw new Error("GROQ_API_KEY is not configured in .env");
    }

    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.4,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API error: ${response.status} — ${err}`);
    }

    const result = await response.json();
    responseText = result?.choices?.[0]?.message?.content;
  } 
  
  else if (provider === "ollama") {
    const ollamaUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
    const model = process.env.OLLAMA_MODEL || "llama3";
    
    try {
      const response = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          stream: false,
          format: "json",
          options: {
            temperature: 0.4
          }
        }),
        signal: AbortSignal.timeout(10000) // 10s timeout to fall back quickly if Ollama is stuck
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Ollama error: ${response.status} — ${err}`);
      }

      const result = await response.json();
      responseText = result?.message?.content;
    } catch (e: any) {
      throw new Error(`Connection failed to local Ollama at ${ollamaUrl}. Ensure Ollama is running and model "${model}" is pulled ("ollama run ${model}"). Error: ${e.message}`);
    }
  } 
  
  else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  if (!responseText) throw new Error("AI provider returned an empty response");

  try {
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const workflow = JSON.parse(cleanedText) as GeneratedWorkflow;

    // Validate required fields
    if (!workflow.nodes || !workflow.edges || !workflow.path || !workflow.method) {
      throw new Error("Generated workflow is missing required fields");
    }

    if (!workflow.path.startsWith("/")) workflow.path = "/" + workflow.path;

    return workflow;
  } catch (parseErr: any) {
    throw new Error(`Failed to parse AI response as JSON: ${parseErr.message}\nRaw response was: ${responseText}`);
  }
}
