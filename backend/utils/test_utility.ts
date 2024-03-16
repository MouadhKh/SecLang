import Parser from "../frontend/parser.ts";
import Environment from "../runtime/environment.ts";

//initialize environment so that environment is fresh for every individual test
//otherwise, the variable naming plays a role
export function initEnvForTest(): { parser: Parser; env: Environment } {
  const parser: Parser = new Parser();
  const env: Environment = new Environment();
  return { parser, env };
}

export function closeAllFiles() {
  const openResources = Deno.resources();

  // Iterate through the resources and close files
  for (const resource of [openResources]) {
    if (resource instanceof Deno.FsFile) {
      resource.close();
    }
  }
}
