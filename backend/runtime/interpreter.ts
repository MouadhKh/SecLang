import { BooleanVal, NumberVal, RuntimeVal, StringVal } from "./values.ts";
import {
  AssignmentExpr,
  BinaryExpr,
  BooleanLiteral,
  CloseChannelStmt,
  ConditionalStmt,
  DeclassifyProc,
  DowngradeProc,
  Identifier,
  InputStmt,
  NumericLiteral,
  OpenChannelStmt,
  DebugStmt,
  Program,
  ReadStmt,
  Stmt,
  StringLiteral,
  VarDeclaration,
  WhileStmt,
  WriteStmt,
} from "../frontend/ast.ts";
import Environment from "./environment.ts";
import {
  eval_close_stmt,
  eval_conditional_stmt,
  eval_declassify,
  eval_downgrade,
  eval_input_statement,
  eval_open_statement,
  eval_debug_statement,
  eval_program,
  eval_read_stmt,
  eval_var_declaration,
  eval_while_stmt,
  eval_write_stmt,
} from "./eval/statements.ts";
import {
  eval_assignment,
  eval_binary_expr,
  eval_identifier,
} from "./eval/expressions.ts";
import CodeError from "../errors/CodeError.ts";

export function evaluate(astNode: Stmt, env: Environment): RuntimeVal {
  switch (astNode.kind) {
    case "NumericLiteral":
      return {
        value: (astNode as NumericLiteral).value,
        type: "int",
      } as NumberVal;
    case "StringLiteral":
      return {
        value: (astNode as StringLiteral).value,
        type: "string",
      } as StringVal;
    case "BooleanLiteral":
      return {
        value: (astNode as BooleanLiteral).value,
        type: "bool",
      } as BooleanVal;
    case "BinaryExpr":
      return eval_binary_expr(astNode as BinaryExpr, env);
    case "Program":
      return eval_program(astNode as Program, env);
    case "Identifier":
      return eval_identifier(astNode as Identifier, env);
    // Handle statements
    case "VarDeclaration":
      return eval_var_declaration(astNode as VarDeclaration, env);
    case "AssignmentExpr":
      return eval_assignment(astNode as AssignmentExpr, env);
    case "DebugStmt":
      return eval_debug_statement(astNode as DebugStmt, env);
    case "InputStmt":
      return eval_input_statement(astNode as InputStmt, env);
    case "ConditionalStmt":
      return eval_conditional_stmt(astNode as ConditionalStmt, env);
    case "WhileStmt":
      return eval_while_stmt(astNode as WhileStmt, env);
    case "DeclassifyProc":
      return eval_declassify(astNode as DeclassifyProc, env);
    case "DowngradeProc":
      return eval_downgrade(astNode as DowngradeProc, env);
    case "OpenChannelStmt":
      return eval_open_statement(astNode as OpenChannelStmt, env);
    case "CloseChannelStmt":
      return eval_close_stmt(astNode as CloseChannelStmt, env);
    case "WriteStmt":
      return eval_write_stmt(astNode as WriteStmt, env);
    case "ReadStmt":
      return eval_read_stmt(astNode as ReadStmt, env);
    default:
      throw new CodeError(
        `This AST Node has not yet been setup for interpretation.
        ${astNode}`
      );
  }
}
