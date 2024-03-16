// Import required modules
import { Application, Router } from "https://deno.land/x/oak@v12.6.0/mod.ts";
import { evaluate } from "../runtime/interpreter.ts";
import Parser from "../frontend/parser.ts";
import Environment from "../runtime/environment.ts";
import { MK_STRING, RuntimeVal } from "../runtime/values.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

import {
  SecurityLabel,
  getSecurityClassAsString,
} from "../security_extension/labels.ts";
import { getProgramResults } from "../runtime/eval/statements.ts";
import { cleanUpFiles } from "../utils/files_utility.ts";

const app = new Application();

//Workaround for Cors
app.use(oakCors());

// Create a router for the API
const router = new Router();

let env: Environment;
//initialize environment with received sessionId
router.post("/init", async (ctx) => {
  try {
    const sessionId = (await ctx.request.body().value).sessionId;
    env = new Environment(undefined, sessionId);
    ctx.response.body = { message: "Environment initialization successful" };
  } catch (error) {
    ctx.response.body = { error: { message: error.message, type: error.name } };
  }
});
//main endpoint that executes the code and returns response
router.post("/run-code", async (ctx) => {
  try {
    // Get the request body which includes sessionId and code
    const { sessionId, code } = await ctx.request.body().value;
    const { runResult, env } = executeCode(code, sessionId);
    const error = null; // Placeholder for error handling

    //Overcome serialization problems
    const variablesObject = Object.fromEntries(env.variables);
    const variables = Object.keys(variablesObject).map((key) => ({
      name: key,
      securityClassInt: variablesObject[key].securityClass,
      securityClassStr: getSecurityClassAsString(
        variablesObject[key].securityClass
      ),
    }));
    const channels = env.getChannelsContent();
    ctx.response.body = { runResult, variables, channels, error };
    if (channels) {
      //cleanup files after execution
      await cleanUpFiles(sessionId);
    }
  } catch (error) {
    ctx.response.body = { error: { message: error.message, type: error.name } };
  }
});

// Endpoint to retrieve channel content based on sessionId
router.get("/channels/:sessionId", (ctx) => {
  const sessionId = ctx.params.sessionId;

  if (!sessionId) {
    ctx.response.status = 400;
    ctx.response.body = "Session ID is required.";
    return;
  }

  const channelContents = env.getChannelsContent();
  ctx.response.body = channelContents;
});

router.get("/variables/", (ctx) => {
  if (env.variables) {
    ctx.response.body = env.variables;
  }
});

function executeCode(code: string, sessionId: string): ExecuteResponse {
  const parser = new Parser();
  const env = new Environment(undefined, sessionId);
  if (!code) {
    return { runResult: [], env };
  }
  const program = parser.produceAST(code);
  const runResult = getProgramResults(program, env);
  return { runResult, env };
}

// Use the router in the application
app.use(router.routes());
app.use(router.allowedMethods());

// Start the server
console.log("Server is running on http://localhost:8000");
await app.listen({ port: 8000 });


type ExecuteResponse = {
  runResult: RuntimeVal[];
  env: Environment;
};
