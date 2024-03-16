import Parser from "./frontend/parser.ts";
import Environment from "./runtime/environment.ts";
import { evaluate } from "./runtime/interpreter.ts";

repl();

function repl() {
  //Uncomment to run locally
  // const parser = new Parser();
  // const env = new Environment();
  //Uncomment this line if you want to run based on a code_snippet file
  // const input = Deno.readTextFileSync("./code_snippets/code_snippet.secl");
  //Uncomment this block to run REPL console
  // console.log("Repl v1.0");
  //  while (true) {
  // const input = prompt(">");
  // if (!input) {
  //   // Deno.exit(1);
  // }
  // Uncomment this always to run locally
  // const program = parser.produceAST(input);
  // const result=evaluate(program, env);
  // console.log(result);
  // console.log("--------------\n\n");
}
