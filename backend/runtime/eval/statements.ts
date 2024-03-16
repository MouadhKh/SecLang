import ChannelError from "../../errors/ChannelError.ts";
import CodeError from "../../errors/CodeError.ts";
import SecurityError from "../../errors/SecurityError.ts";
import {
  AssignmentExpr,
  BinaryExpr,
  CloseChannelStmt,
  ConditionalStmt,
  DeclassifyProc,
  DowngradeProc,
  Identifier,
  InputStmt,
  OpenChannelStmt,
  DebugStmt,
  Program,
  ReadStmt,
  Stmt,
  VarDeclaration,
  WhileStmt,
  WriteStmt,
} from "../../frontend/ast.ts";
import {
  convertDataToAppropriateType,
  getChannel,
  getConditionValue,
  getVariableFromEnv,
  getVarsFromStmt,
} from "../../utils/utility.ts";
import Channel from "../../runtime/channels/channel.ts";
import {
  getSecurityClassAsString,
  SecurityLabel,
} from "../../security_extension/labels.ts";
import Environment from "../environment.ts";
import { evaluate } from "../interpreter.ts";
import {
  BooleanVal,
  MK_BOOL,
  MK_NULL,
  MK_NUMBER,
  MK_STRING,
  NumberVal,
  RuntimeVal,
  StringVal,
} from "../values.ts";
import { getBinaryExprSecurityClass } from "./expressions.ts";
import {
  checkControlStructureSecurity,
  declassify,
  downgrade,
  getSecurityClassAsInt,
} from "../../utils/security_utility.ts";

export function eval_program(program: Program, env: Environment): RuntimeVal {
  const results = getProgramResults(program, env);

  return results.at(results.length - 1)!;
}

export function getProgramResults(program: Program, env: Environment) {
  const evaluatedResults: RuntimeVal[] = [];

  for (const statement of program.body) {
    const result: RuntimeVal = evaluate(statement, env);
    evaluatedResults.push(result);
  }

  return evaluatedResults;
}

export function eval_var_declaration(
  declaration: VarDeclaration,
  env: Environment
): RuntimeVal {
  let value = MK_NULL() as RuntimeVal;
  if (!declaration.value) {
    if (declaration.type == "int") {
      value = MK_NUMBER(undefined, declaration.securityClass);
    } else if (declaration.type == "bool") {
      value = MK_BOOL(undefined, declaration.securityClass);
    } else if (declaration.type == "string") {
      value = MK_STRING(undefined, declaration.securityClass);
    }
  } else {
    value = evaluate(declaration.value as Stmt, env);
    if (value.type != declaration.type) {
      throw new TypeError(
        `at ${declaration.value!.linePos}:${declaration.value!.colPos}. Type missmatch at variable declaration. Can't assign '${value.type}' to '${declaration.type}'`
      );
    }
    // value = getSecurityClassFromVarDeclaration(declaration);
    // value.securityClass=declaration.securityClass;
    value.securityClass = getSecurityClassFromValue(declaration, env);
  }
  return env.declareVar(declaration.identifier, value, declaration.constant);
}

export function eval_conditional_stmt(
  cond: ConditionalStmt,
  env: Environment
): RuntimeVal {
  const condition = cond.condition as BinaryExpr; //use evaluate() instead
  const stmtVars: RuntimeVal[] = getVarsFromStmt(condition, env);
  let evaluatedVal: RuntimeVal;
  if (!getConditionValue(condition, env)) {
    // If the condition is falsy and there is no else block, return null.
    checkInformationFlow(condition, env, stmtVars);
    if (!cond.elseBody) {
      return MK_NULL();
    }
    //security class checks
    // If there is an else block, evaluate it.
    for (const statement of cond.elseBody) {
      checkInformationFlow(statement, env, stmtVars);
      evaluatedVal = evaluate(statement, env);
    }
    return MK_NULL();
  }

  // If the condition is true, evaluate the if block.

  for (const statement of cond.body) {
    checkInformationFlow(statement, env, stmtVars);
    evaluatedVal = evaluate(statement, env);
  }
  return evaluatedVal!; 
}

function checkInformationFlow(
  statement: Stmt,
  env: Environment,
  stmtVars: RuntimeVal[]
) {
  switch (statement.kind) {
    case "AssignmentExpr": {
      const assignment = statement as AssignmentExpr;
      const assigne = getVariableFromEnv(assignment, env); //difference to assignment.assigne is that we also get security class
      if (
        stmtVars.some(
          (stmtVar) => stmtVar.securityClass > assigne!.securityClass
        )
      ) {
        const problematicVar = (assignment.assigne as Identifier).symbol;
        throw `Implicit Information Flow Security breached. Check assignment of ${problematicVar}`;
      }
      break;
    }
    case "ConditionalStmt": {
      const conditionalStmt = checkControlStructureSecurity(
        statement,
        env,
        stmtVars
      ) as ConditionalStmt; 
      eval_conditional_stmt(conditionalStmt, env);
      break;
    }
    case "WhileStmt": {
      const whileStmt = checkControlStructureSecurity(
        statement,
        env,
        stmtVars
      ) as WhileStmt;
      eval_while_stmt(whileStmt, env);
    }
  }
}

export function eval_while_stmt(stmt: WhileStmt, env: Environment): RuntimeVal {
  const condition = stmt.condition as BinaryExpr;
  const stmtVars: RuntimeVal[] = getVarsFromStmt(condition, env);
  checkInformationFlow(condition, env, stmtVars);
  while (getConditionValue(condition, env)) {
    for (const statement of stmt.body) {
        checkInformationFlow(statement, env, stmtVars);
      evaluate(statement, env);
    }
  }

  return MK_NULL(); 
}
export function eval_debug_statement(
  stmt: DebugStmt,
  env: Environment
): RuntimeVal {
  let evaluatedVal = evaluate(stmt.expression, env);
  if (evaluatedVal.securityClass > SecurityLabel.Unclassified) {
    //Omit reason(Greater than unclassified) to not leak information about the security class
    throw new SecurityError("debug not allowed");
  }
  if (evaluatedVal.type === "int") {
    evaluatedVal = evaluatedVal as NumberVal;
  } else if (evaluatedVal.type === "bool") {
    evaluatedVal = evaluatedVal as BooleanVal;
  } else {
    //(evaluatedVal.type === "string")
    evaluatedVal = evaluatedVal as StringVal;
  }
  console.log(evaluatedVal.value);
  return evaluatedVal.value;
}
export function eval_input_statement(
  stmt: InputStmt,
  env: Environment
): RuntimeVal {
  const input = prompt(stmt.message); // Prompt user for input

  const targetSymbol = stmt.targetSymbol;
  const targetVar = env.lookupVar(targetSymbol);

  if (targetVar.type === "string") {
    return MK_STRING(input ?? "", targetVar.securityClass);
  } else if (targetVar.type === "int") {
    const parsedValue = parseInt(input!);
    if (isNaN(parsedValue)) {
      throw new CodeError(`Invalid input for int variable '${targetSymbol}'`);
    }
    return MK_NUMBER(parsedValue, targetVar.securityClass);
  } else if (targetVar.type === "bool") {
    const lowerCaseInput = input?.toLowerCase();
    if (lowerCaseInput === "true") {
      return MK_BOOL(true, targetVar.securityClass);
    } else if (lowerCaseInput === "false") {
      return MK_BOOL(false, targetVar.securityClass);
    } else {
      throw new CodeError(`Invalid input for bool variable '${targetSymbol}'`);
    }
  }
  return MK_NULL();
}

export function eval_declassify(
  stmt: DeclassifyProc,
  env: Environment
): RuntimeVal {
  const toDeclassify=env.lookupVar(stmt.identifier)
  const declassifiedValue = { ...toDeclassify }; 
  declassify(declassifiedValue);
  env.variables.set(stmt.identifier,declassifiedValue);
  return declassifiedValue;
}
export function eval_downgrade(
  stmt: DowngradeProc,
  env: Environment
): RuntimeVal {
  const toDowngrade = env.lookupVar(stmt.identifier);
  const downgradedValue = { ...toDowngrade }; 
  downgrade(downgradedValue);
  env.variables.set(stmt.identifier,downgradedValue);
  return downgradedValue;
}
export function eval_open_statement(stmt: OpenChannelStmt, env: Environment) {
  let channel = getChannel(stmt.channelName, env.channels);

  if (!channel) {
    channel = new Channel(stmt.channelName, stmt.accessMode);
    // throw new Error(`Channel '${stmt.channelName}' not found.`);
  }

  // channel.open(filePath); // Pass the file path as needed
  env.openChannel(stmt.channelName, stmt.accessMode);

  return MK_BOOL(true);
}
export function eval_close_stmt(stmt: CloseChannelStmt, env: Environment) {
  const channel = getChannel(stmt.channelName, env.channels);

  if (!channel) {
    throw new ChannelError(
      `at ${stmt.linePos}:${stmt.colPos}. Channel '${stmt.channelName}' not found.`
    );
  }
  if (!channel.fileDescriptor) {
    throw new ChannelError(
      `at ${stmt.linePos}:${stmt.colPos}. Channel '${stmt.channelName}' is not open.`
    );
  }
  env.closeChannel(channel.channelName);
  return MK_BOOL(true);
}
export function eval_read_stmt(stmt: ReadStmt, env: Environment): RuntimeVal {
  const sourceChannel = getChannel(stmt.sourceChannel, env.channels);
  if (!sourceChannel) {
    throw new ChannelError(
      `at ${stmt.linePos}:${stmt.colPos}. Channel '${stmt.sourceChannel}' not found.`
    );
  }
  let targetSecurityClass = SecurityLabel.Unclassified;
  if (stmt.targetVar) {
    targetSecurityClass = stmt.targetSecurityClass;
  }
  if (getSecurityClassAsInt(sourceChannel.channelName) > targetSecurityClass) {
    throw new ChannelError(
      `at ${stmt.linePos}:${stmt.colPos}. Channel read operation failed. Channel security breached`
    );
  }
  const data = sourceChannel.read();
  return convertDataToAppropriateType(data);
}
export function eval_write_stmt(stmt: WriteStmt, env: Environment): RuntimeVal {
  const targetChannel = getChannel(stmt.targetChannel, env.channels);
  if (!targetChannel) {
    throw new ChannelError(
      `at ${stmt.linePos}:${stmt.colPos}. Channel '${stmt.targetChannel}' not found.`
    );
  }
  if (stmt.value.kind == "Identifier") {
    const stmtValue = stmt.value as Identifier;
    const sourceVar = env.lookupVar(stmtValue.symbol);
    if (sourceVar.securityClass > getSecurityClassAsInt(stmt.targetChannel)) {
      throw new ChannelError(
        `at ${stmt.linePos}:${stmt.colPos}. Channel write operation failed. Channel security breached`
      );
    }
  }
  if (!targetChannel.isOpen()) {
    throw new ChannelError(
      `at ${stmt.linePos}:${stmt.colPos}. Attempt to perform write operation on a closed channel '${targetChannel.channelName}' `
    );
  }

  const data = evaluate(stmt.value, env);
  const writeRes = targetChannel.write(data);
  return MK_BOOL(writeRes);
}

function getSecurityClassFromValue(
  declaration: VarDeclaration,
  env: Environment
): number {
  const value = declaration.value;
  //Won't be undefined since we check before calling it
  switch (value!.kind) {
    case "StringLiteral":
    case "ReadStmt":
    case "BooleanLiteral":
    case "NumericLiteral": 
      return declaration.securityClass;
    case "Identifier": {
      const val = value as Identifier;
      const idSecurityClass = env.variables.get(val.symbol)!.securityClass; 
      if (idSecurityClass! > declaration.securityClass) {
        throw new SecurityError(
          `at ${declaration.value!.linePos}:${
            declaration.value!.colPos
          }. Information Flow Security breached:' ${
            declaration.identifier
          } ' security class is lower than ${getSecurityClassAsString(
            idSecurityClass
          )}`
        );
      }
      return declaration.securityClass; 
    }
    case "BinaryExpr": {
      const val = value as BinaryExpr;
      const binaryExprSecurityClass = getBinaryExprSecurityClass(
        evaluate(val.left, env) as NumberVal,
        evaluate(val.right, env) as NumberVal
      );
      const securityClass = Math.max(
        binaryExprSecurityClass.left,
        binaryExprSecurityClass.right
      );

      if (declaration.securityClass < securityClass) {
        throw new SecurityError(
          `at ${declaration.value!.linePos}:${declaration.value!.colPos}. Incoherence between security class definition & evaluated security class`
        );
      }
      if (binaryExprSecurityClass.left > declaration.securityClass) {
        throw new SecurityError(
          `at ${declaration.value!.linePos}:${declaration.value!.colPos}. Information Flow Security breached:'${binaryExprSecurityClass.left} is lower than ${declaration.securityClass}`
        );
      }
      if (binaryExprSecurityClass.right > declaration.securityClass) {
        throw new SecurityError(
          `at ${declaration.value!.linePos}:${declaration.value!.colPos}. Information Flow Security breached:'${binaryExprSecurityClass.right} is lower than ${declaration.securityClass}`
        );
      }
      return securityClass;
    }

    default:
      return 0;
  }
}
