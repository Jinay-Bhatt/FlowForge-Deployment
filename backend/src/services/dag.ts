/**
 * Topological Sort using Kahn's Algorithm.
 * Arranges nodes sequentially based on Directed Acyclic Graph (DAG) edges.
 * Throws an error if circular references are detected.
 */
export function orderNodes(nodes: any[], edges: any[]): any[] {
  const ordered: any[] = [];
  
  // Build node lookup map for O(1) retrieval
  const nodeMap = new Map<string, any>();
  const adj: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};

  for (const node of nodes) {
    nodeMap.set(node.id, node);
    adj[node.id] = [];
    inDegree[node.id] = 0;
  }

  for (const edge of edges) {
    if (adj[edge.source] !== undefined && adj[edge.target] !== undefined) {
      adj[edge.source].push(edge.target);
      inDegree[edge.target]++;
    }
  }

  const queue: string[] = [];
  for (const node of nodes) {
    if (inDegree[node.id] === 0) {
      queue.push(node.id);
    }
  }

  // BFS Queue traversal using map for O(1) lookups instead of O(N) search
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = nodeMap.get(nodeId);
    if (node) {
      ordered.push(node);
    }

    for (const neighbor of adj[nodeId] || []) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (ordered.length < nodes.length) {
    throw new Error(
      "Circular dependency detected: The visual graph contains routing loops."
    );
  }

  return ordered;
}

/**
 * Safely extracts nested properties from a given object context using a dotted string path.
 * Example: resolveVariable("request.body.user.name", context)
 */
export function resolveVariable(path: string, context: any): any {
  if (!path) return undefined;
  
  const parts = path.split(".");
  let current = context;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    // Prototype pollution shield
    if (part === '__proto__' || part === 'constructor' || part === 'prototype') {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

/**
 * Parses a raw SQL query containing contextual variables prefixed with '$'
 * and converts them into standard PostgreSQL prepared statement parameters ($1, $2, etc.).
 *
 * Example:
 * Query: "SELECT * FROM users WHERE age > $request.query.minAge AND email = $request.body.email"
 * Output: {
 *   sql: "SELECT * FROM users WHERE age > $1 AND email = $2",
 *   values: [minAgeValue, emailValue]
 * }
 */
export function parameterizeSqlQuery(
  query: string,
  context: any
): { sql: string; values: any[] } {
  // Matches any $ variable structure like: $request.body.name or $steps.nodeId.output
  const variableRegex = /\$([a-zA-Z0-9_\.]+)/g;
  const values: any[] = [];
  let index = 1;

  const sql = query.replace(variableRegex, (match, path) => {
    const val = resolveVariable(path, context);
    values.push(val !== undefined ? val : null);
    return `$${index++}`;
  });

  return { sql, values };
}
