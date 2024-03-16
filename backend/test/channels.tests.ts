import Parser from "../frontend/parser.ts";
import Environment from "../runtime/environment.ts";
import {
  describe,
} from "https://deno.land/std@0.198.0/testing/bdd.ts";
import { initEnvForTest } from "../utils/test_utility.ts";
import { evaluate } from "../runtime/interpreter.ts";
import { assertEquals } from "https://deno.land/std@0.198.0/assert/assert_equals.ts";

// config.environment shouldn't be prod for the tests to work
describe("test read and write  operations on Unclassified channel", () => {
  const { parser, env }: { parser: Parser; env: Environment } =
    initEnvForTest();
  const input = `string x
      open('Unclassified','w')
      write('Unclassified','test_data')
      open('Unclassified','r')
      x= read('Unclassified')
      close('Unclassified')
      debug x`;
  const program = parser.produceAST(input);
  const result = evaluate(program, env) as unknown;
  assertEquals(result,"test_data");
});
