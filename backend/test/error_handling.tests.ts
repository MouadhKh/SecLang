import { assertEquals } from "https://deno.land/std@0.198.0/assert/mod.ts";
import { describe } from "https://deno.land/std@0.198.0/testing/bdd.ts";
import Parser from "../frontend/parser.ts";
import Environment from "../runtime/environment.ts";
import { evaluate } from "../runtime/interpreter.ts";
import { initEnvForTest } from "../utils/test_utility.ts";

describe("test constant declaration without value", () => {
  const { parser, env }: { parser: Parser; env: Environment } =
    initEnvForTest();
  const input = "const string x:C";
  let errorMessage = "";
  try {
    const program = parser.produceAST(input);
    evaluate(program, env);
  } catch (error) {
    errorMessage = error;
  }
  assertEquals(
    `${errorMessage}`,
    `at line 1. Must assign value to constant 'x' at declaration.`
  );
});

describe("test security breach error after a declassify scenario", () => {
  const { parser, env }: { parser: Parser; env: Environment } =
    initEnvForTest();
  const input = `string x:TS='Hello '
    declassify x
    string y:TS='World'
    x=x+y
    debug x`;
  let errorMessage = "";
  try {
    const program = parser.produceAST(input);
    evaluate(program, env);
  } catch (error) {
    errorMessage = error;
  }
  assertEquals(
    `${errorMessage}`,
    `Information Flow Security breached: 'x' security class is lower than TopSecret`
  );
});

describe("test security breach error after a downgrade scenario", () => {
  const { parser, env }: { parser: Parser; env: Environment } =
    initEnvForTest();
  const input = `string x:TS='Hello '
    downgrade x
    string y:TS='World'
    x=x+y
    debug x`;
  let errorMessage = "";
  try {
    const program = parser.produceAST(input);
    evaluate(program, env);
  } catch (error) {
    errorMessage = error;
  }
  assertEquals(
    `${errorMessage}`,
    `Information Flow Security breached: 'x' security class is lower than TopSecret`
  );
});
describe("test write to channel in a read context", () => {
  const { parser, env }: { parser: Parser; env: Environment } =
    initEnvForTest();
  const input = `open('Unclassified','r')
    write('Unclassified','test_data')
    close('Unclassified')`;
  let errorMessage = "";
  try {
    const program = parser.produceAST(input);
    evaluate(program, env);
  } catch (error) {
    errorMessage = error;
  }
  assertEquals(
    `${errorMessage}`,
    `Cannot write to channel 'Unclassified' in read mode.`
  );
});

describe("test open channel that is not supported", () => {
  const { parser, env }: { parser: Parser; env: Environment } =
    initEnvForTest();
  const input = `open('NotSupportedCh','r')
    read('NotSupportedCh')
    close('NotSupportedCh')`;
  let errorMessage = "";
  try {
    const program = parser.produceAST(input);
    evaluate(program, env);
  } catch (error) {
    errorMessage = error;
  }
  assertEquals(`${errorMessage}`, `Channel NotSupportedCh is not suppported!`);
});

describe("test close that is not open", () => {
  const { parser, env }: { parser: Parser; env: Environment } =
    initEnvForTest();
  const input = `open('Unclassified','r')
    int x=read('Unclassified')
    close('Secret')`;
  let errorMessage = "";
  try {
    const program = parser.produceAST(input);
    evaluate(program, env);
  } catch (error) {
    errorMessage = error;
  }
  assertEquals(
    `${errorMessage}`,
    `Attempting to close a channel that is not open or does not exist`
  );
});

describe("test unauthorized write operation to lower security class channel", () => {
  const { parser, env }: { parser: Parser; env: Environment } =
    initEnvForTest();
  const input = `string x:TS='TopSecretInfo'
    open('Unclassified','w')
    write('Unclassified',x)
    close('Unclassified')`;
  let errorMessage = "";
  try {
    const program = parser.produceAST(input);
    evaluate(program, env);
  } catch (error) {
    errorMessage = error;
  }
  assertEquals(
    `${errorMessage}`,
    `at 3:8. Channel write operation failed. Channel security breached`
  );
});

describe("test unauthorized read operation to lower security class channel", () => {
  const { parser, env }: { parser: Parser; env: Environment } =
    initEnvForTest();
  const input = `string x:U 
open('Secret','r')
x=read('Secret')
close('Secret')
  `;
  let errorMessage = "";
  try {
    const program = parser.produceAST(input);
    evaluate(program, env);
  } catch (error) {
    errorMessage = error;
  }
  assertEquals(
    `${errorMessage}`,
    `at 3:5. Channel read operation failed. Channel security breached`
  );
});

describe("test type missmatch when reading from channel", () => {
  const { parser, env }: { parser: Parser; env: Environment } =
    initEnvForTest();
  const input = `int x
  open('Unclassified','w')
  write('Unclassified','ImNotANumber')
  open('Unclassified','r')
  x=read('Unclassified')
  close('Unclassified')
  `;
  let errorMessage = "";
  try {
    const program = parser.produceAST(input);
    evaluate(program, env);
  } catch (error) {
    errorMessage = error;
  }
  assertEquals(
    `${errorMessage}`,
    `TypeError: Type missmatch at variable assignment. Can't assign 'string' to 'int'`
  );
});
