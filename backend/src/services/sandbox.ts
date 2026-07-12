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
 * Executes user-provided JavaScript code inside a secure, constrained V8 VM context.
 * Enforces a CPU timeout limit (defaults to 200ms) to prevent event-loop locks.
 */
export function runInSandbox(
  code: string,
  contextData: any,
  timeoutMs = 200
): SandboxResult {
  // Static code validation to prevent sandbox escape vectors using word boundary checks
  const escapeKeywords = ["constructor", "prototype", "__proto__", "process", "global", "require", "import"];
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
      result: {},
      console: {
        log: (...args: any[]) => {
          // Captures debug logs if required in the future
        },
      },
    };

    // Create secure V8 context (purges globals like process, require, module)
    const vmContext = vm.createContext(sandbox);

    // Wrap the user's code in an IIFE so they can write top-level "return" statements.
    const wrappedCode = `
      const fnResult = (function(context) {
        const { steps = {}, request = {} } = context || {};
        ${code}
      })(context);
      if (fnResult !== undefined) {
        result = fnResult;
      }
    `;

    // Retrieve compiled script from cache or compile
    const script = getOrCompileScript(wrappedCode);
    
    script.runInContext(vmContext, {
      timeout: timeoutMs,
      breakOnSigint: true, // Allow SIGINT interrupts
    });

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
