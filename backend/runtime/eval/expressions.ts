import CodeError from "../../errors/CodeError.ts";
import { AssignmentExpr, BinaryExpr, Identifier } from "../../frontend/ast.ts";
import Environment from "../environment.ts";
import { evaluate } from "../interpreter.ts";
import {
  BooleanVal,
  MK_BOOL,
  MK_NUMBER,
  MK_STRING,
  NumberVal,
  RuntimeVal,
  StringVal,
} from "../values.ts";

function eval_expression(
  left: RuntimeVal,
  right: RuntimeVal,
  operator: string
): RuntimeVal {
  const result = getResult(left, right, operator);
  if (result.type == "int") {
    return MK_NUMBER(result.value, result.securityClass); 
  } else if (result.type == "string") {
    return MK_STRING(result.value, result.securityClass);
  }
  return MK_BOOL(result.value, result.securityClass);
}

function getResult(
  left: RuntimeVal,
  right: RuntimeVal,
  operator: string
): RuntimeVal {
  function getComputedResult() {
    if (typeof right.value == "number" && typeof left.value == "number") {
      return supportedNumberOperations[operator](left.value, right.value);
    } else if (
      typeof right.value == "string" ||
      typeof left.value == "string"
    ) {
      return supportedStringOperations[operator](left.value, right.value);
    }
    //else its boolean
    return supportedBoolOperations[operator](left.value, right.value);
  }
  const supportedNumberOperations: {
    [key: string]: (x: number, y: number) => number | boolean;
  } = {
    "+": (x: number, y: number) => x + y,
    "-": (x: number, y: number) => x - y,
    "*": (x: number, y: number) => x * y,
    "/": (x: number, y: number) => x / y,
    "%": (x: number, y: number) => x % y,
    "<": (x: number, y: number) => x < y,
    ">": (x: number, y: number) => x > y,
    "<=": (x: number, y: number) => x <= y,
    ">=": (x: number, y: number) => x >= y,
    "==": (x: number, y: number) => x == y,
    "!=": (x: number, y: number) => x != y,
  };
  const supportedBoolOperations: {
    [key: string]: (x: boolean, y: boolean) => boolean;
  } = { "==": (x: boolean, y: boolean) => x == y };

  const supportedStringOperations: {
    [key: string]: (x: any, y: any) => string | boolean;
  } = {
    "==": (x: string, y: string) => x === y,
    "+": (x: string, y: string) => x + y,
    "*": (x: string, y: string | number) => {
      const numVal = typeof y === "number" ? y : parseInt(y);
      return x.repeat(numVal);
    },
    "/": (x: string, y: string | number) => {
      const numVal = typeof y === "number" ? y : parseInt(y);
      return x.slice(0, Math.floor(x.length / numVal));
    },
  };

  if (
    !supportedNumberOperations[operator] &&
    !supportedBoolOperations[operator] &&
    !supportedStringOperations[operator]
  ) {
    throw new CodeError(`Unsupported operator: ${operator}`);
  }

  const securityClasses = getBinaryExprSecurityClass(left, right);

  const computedRes = getComputedResult();
  if (typeof computedRes == "boolean") {
    return {
      type: "bool",
      value: computedRes as boolean,
      securityClass: Math.max(securityClasses.left, securityClasses.right),
    } as BooleanVal;
  } else if (typeof computedRes == "number") {
    return {
      type: "int",
      value: computedRes as number,
      securityClass: Math.max(securityClasses.left, securityClasses.right),
    };
  }
  return {
    type: "string",
    value: computedRes as string,
    securityClass: Math.max(securityClasses.left, securityClasses.right),
  } as StringVal;
}

export function getBinaryExprSecurityClass(
  left: RuntimeVal,
  right: RuntimeVal
) {
  const leftSecurityClass = isNaN(left.securityClass) ? 0 : left.securityClass;
  const rightSecurityClass = isNaN(right.securityClass)
    ? 0
    : right.securityClass;
  return { left: leftSecurityClass, right: rightSecurityClass };
}

export function eval_binary_expr(
  binop: BinaryExpr,
  env: Environment
): RuntimeVal {
  const leftHandSide = evaluate(binop.left, env);
  const rightHandSide = evaluate(binop.right, env);
  return eval_expression(
    leftHandSide as NumberVal,
    rightHandSide as NumberVal,
    binop.operator
  );
  //}
  //One or both is null
  //return MK_NULL();
}
export function eval_identifier(
  ident: Identifier,
  env: Environment
): RuntimeVal {
  return env.lookupVar(ident.symbol); 
}
export function eval_assignment(
  node: AssignmentExpr,
  env: Environment
): RuntimeVal {
  if (node.assigne.kind != "Identifier") {
    throw new CodeError(
      `Invalid assignee ${JSON.stringify(node.assigne)}, expected an identifier`
    );
  }
  const varname = (node.assigne as Identifier).symbol;
  return env.assignVar(varname, evaluate(node.value, env));
}
