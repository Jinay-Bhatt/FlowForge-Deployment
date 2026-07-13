import vm from "node:vm";
import crypto from "node:crypto";

export interface SandboxResult {
  success: boolean;
  data: any;
  error?: string;
}

// Precompiled V8 script caching to bypass compile overhead on subsequent workflow endpoint calls
const scriptCache = new Map<string, vm.Script>();

function getOrCompileScript(wrappedCode: string): vm.Script {
  const hash = crypto.createHash("sha256").update(wrappedCode).digest("hex");
  let script = scriptCache.get(hash);
  if (!script) {
    script = new vm.Script(wrappedCode);
    scriptCache.set(hash, script);
  }
  return script;
}

/**
 * Axios-compatible shim backed by Node's native fetch (Node 18+).
 * AI-generated code commonly does: const axios = require('axios'); await axios.get(url)
 * This shim provides the same .get/.post/.put/.delete API without requiring the axios package.
 */
function createAxiosShim() {
  const request = async (method: string, url: string, body?: any, headers?: any) => {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", ...(headers || {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await res.json() : await res.text();
    return { data, status: res.status, statusText: res.statusText, headers: Object.fromEntries(res.headers) };
  };

  return {
    get:    (url: string, config?: any)              => request("GET",    url, undefined, config?.headers),
    post:   (url: string, body?: any, config?: any)  => request("POST",   url, body,      config?.headers),
    put:    (url: string, body?: any, config?: any)  => request("PUT",    url, body,      config?.headers),
    patch:  (url: string, body?: any, config?: any)  => request("PATCH",  url, body,      config?.headers),
    delete: (url: string, config?: any)              => request("DELETE", url, undefined, config?.headers),
  };
}

/**
 * Safe allowlisted require shim for the sandbox.
 * AI-generated code often uses require('axios') or require('node-fetch').
 * This provides those modules safely while blocking all dangerous system modules.
 */
function createSafeRequire() {
  const axiosShim = createAxiosShim();

  const ALLOWED_MODULES: Record<string, any> = {
    "axios":      axiosShim,
    "node-fetch": fetch,   // Node 18+ global fetch
    "fetch":      fetch,
  };

  return function safeRequire(moduleName: string): any {
    if (ALLOWED_MODULES[moduleName] !== undefined) {
      return ALLOWED_MODULES[moduleName];
    }
    throw new Error(
      `Security Violation: Module '${moduleName}' is not allowed in the sandbox. ` +
      `Allowed modules: ${Object.keys(ALLOWED_MODULES).join(", ")}.`
    );
  };
}

/**
 * Executes user-provided JavaScript code inside a secure, constrained V8 VM context.
 * Enforces a CPU timeout limit (defaults to 5000ms to support async HTTP calls).
 */
export function runInSandbox(
  code: string,
  contextData: any,
  timeoutMs = 5000
): SandboxResult {
  // Static code validation to prevent sandbox escape vectors using word boundary checks.
  // Note: 'require' is intentionally excluded here — we provide a safe shim inside the context.
  const escapeKeywords = ["constructor", "prototype", "__proto__", "process", "global", "import"];
  for (const kw of escapeKeywords) {
    const regex = new RegExp(`\\b${kw}\\b`);
    if (regex.test(code)) {
      return {
        success: false,
        data: null,
        error: `Security Violation: Code contains restricted keyword '${kw}'`,
      };
    }
  }

  try {
    // Isolate variables scope by copying input data using optimized structuredClone
    const clonedContext = contextData ? structuredClone(contextData) : {};

    const sandbox = {
      context: clonedContext,
      result:  undefined as any,
      error:   undefined as string | undefined,
      require: createSafeRequire(),
      fetch,  // Node 18+ global fetch also available directly
      console: {
        log: (..._args: any[]) => { /* debug logs captured if needed */ },
      },
    };

    // Create secure V8 context (purges globals like process, module, global)
    const vmContext = vm.createContext(sandbox);

    // Wrap the user's code in an async IIFE so they can use await and top-level return.
    const stepsKeys = clonedContext?.steps
      ? Object.keys(clonedContext.steps).filter((k) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k))
      : [];
    
    // Extract properties of objects returned by preceding steps so they are also available as local variables
    const stepProps: string[] = [];
    if (clonedContext?.steps) {
      for (const stepKey of stepsKeys) {
        const stepVal = clonedContext.steps[stepKey];
        if (stepVal && typeof stepVal === "object" && !Array.isArray(stepVal)) {
          for (const propKey of Object.keys(stepVal)) {
            if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(propKey)) {
              stepProps.push(`const ${propKey} = steps.${stepKey}.${propKey};`);
            }
          }
        }
      }
    }
    
    const destructureStepsLine = stepsKeys.length > 0 ? `const { ${stepsKeys.join(", ")} } = steps;` : "";
    const stepPropsLines = stepProps.join("\n");

    const wrappedCode = `
      (async function() {
        try {
          const fnResult = await (async function(context) {
            const { steps = {}, request = {} } = context || {};
            ${destructureStepsLine}
            ${stepPropsLines}
            ${code}
          })(context);
          if (fnResult !== undefined) {
            result = fnResult;
          }
        } catch (err) {
          error = err.message || String(err);
        }
      })();
    `;

    // Retrieve compiled script from cache or compile fresh
    const script = getOrCompileScript(wrappedCode);

    // runInContext returns a Promise for the async IIFE — handled by callers
    const maybePromise = script.runInContext(vmContext, {
      timeout: timeoutMs,
      breakOnSigint: true,
    });

    // Return the Promise in .data so gateway.ts / scheduler.ts can await it
    if (maybePromise && typeof (maybePromise as any).then === "function") {
      return {
        success: true,
        data: (maybePromise as Promise<void>).then(() => {
          if (vmContext.error) {
            throw new Error(vmContext.error);
          }
          return vmContext.result;
        }),
      };
    }

    if (vmContext.error) {
      return {
        success: false,
        data: null,
        error: vmContext.error,
      };
    }

    return {
      success: true,
      data: vmContext.result,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error.message || "Execution error or timeout",
    };
  }
}
