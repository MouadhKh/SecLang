import Environment from "../runtime/environment.ts";
import { evaluate } from "../runtime/interpreter.ts";
import {
  BooleanVal,
  MK_NUMBER,
  MK_STRING,
  NumberVal,
  RuntimeVal,
  StringVal,
} from "../runtime/values.ts";
import Channel from "../runtime/channels/channel.ts";
import {
  AssignmentExpr,
  BinaryExpr,
  ConditionalStmt,
  Expr,
  Identifier,
  Stmt,
} from "../frontend/ast.ts";
import { Token } from "../frontend/lexer.ts";
import { TokenType } from "../frontend/tokenTypes.ts";

export function getTokenTypeAsString(
  types: TokenType | TokenType[],
  separator: string
) {
  if (Array.isArray(types)) {
    return types.map((type) => TokenType[type]).join(separator);
  }
  return TokenType[types];
}

export function getConditionValue(condition: BinaryExpr, env: Environment) {
  const conditionVal = evaluate(condition, env) as BooleanVal;
  return conditionVal.value;
}

export function getVarsFromStmt(stmt: Stmt, env: Environment): RuntimeVal[] {
  const vars: RuntimeVal[] = [];

  function traverseExpr(expr: Expr) {
    if (expr.kind === "BinaryExpr") {
      const binaryExpr: BinaryExpr = expr as BinaryExpr;
      traverseExpr(binaryExpr.left);
      traverseExpr(binaryExpr.right);
    } else if (expr.kind === "Identifier" || expr.kind === "NumericLiteral") {
      vars.push(evaluate(expr, env)); // Assuming 'evaluate' function is available
    }
  }

  function traverseStmt(stmt: Stmt) {
    switch (stmt.kind) {
      case "ConditionalStmt": {
        const conditionalStmt = stmt as ConditionalStmt;
        traverseExpr(conditionalStmt.condition);
        conditionalStmt.body.forEach(traverseStmt);
        if (conditionalStmt.elseBody) {
          conditionalStmt.elseBody.forEach(traverseStmt);
        }
        break;
      }
      case "AssignmentExpr": {
        traverseExpr(stmt as AssignmentExpr);
        break;
      }
      case "BinaryExpr": {
        traverseExpr(stmt as BinaryExpr);
        break;
      }
      //extendable
    }
  }

  traverseStmt(stmt);

  return vars;
}

export function getVariableFromEnv(expr: AssignmentExpr, env: Environment) {
  const identifier = expr.assigne as Identifier;
  return env.variables.get(identifier.symbol); 
}
export function getChannel(
  chName: string,
  channels: { [name: string]: Channel }
): Channel {
  return channels[chName];
}

export function getPreviousTokens(
  tokens: Token[],
  history: Token[],
  tokensCount?: number
): Token[] {
  const prevTokens: Token[] = history.slice(0, history.length - tokens.length);
  if (tokensCount) {
    return prevTokens.slice(prevTokens.length - tokensCount, prevTokens.length);
  }
  return prevTokens;
}
export function convertDataToAppropriateType(
  input: string
): NumberVal | StringVal {
  const numericValue = parseFloat(input);

  if (!isNaN(numericValue)) {
    return MK_NUMBER(numericValue);
  } else {
    return MK_STRING(input);
  }
}
