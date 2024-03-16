import CodeError from "../errors/CodeError.ts";
import SecurityError from "../errors/SecurityError.ts";
import { Stmt,ConditionalStmt } from "../frontend/ast.ts";
import Environment from "../runtime/environment.ts";
import { RuntimeVal } from "../runtime/values.ts";
import { SecurityLabel } from "../security_extension/labels.ts";
import { getVarsFromStmt } from "./utility.ts";

export function getSecurityClassAsInt(securityClass: string) {
    switch (securityClass) {
      case "U":
      case "Unclassified":
        return SecurityLabel.Unclassified;
      case "C":
      case "Confidential":
        return SecurityLabel.Confidential;
      case "S":
      case "Secret":
        return SecurityLabel.Secret;
      case "TS":
      case "TopSecret":
        return SecurityLabel.TopSecret;
      default:
        return 0;
    }
  }
  //Control structure as a general term for loops and conditional Statements
export function checkControlStructureSecurity(
    statement: Stmt,
    env: Environment,
    stmtVars: RuntimeVal[]
  ): Stmt {
    let stmt;
    let stmtKind = "";
    if (statement.kind == "ConditionalStmt") {
      stmt = statement as ConditionalStmt;
      stmtKind = "conditional";
    } else if (statement.kind == "WhileStmt") {
      stmt = statement as ConditionalStmt;
      stmtKind = "while";
    } else {
      throw new CodeError("This statement is invalid and can't be handled");
    }
    const conditionVars = getVarsFromStmt(stmt, env);
    for (const conditionVar of conditionVars) {
      if (
        stmtVars.some(
          (stmtVar) => stmtVar.securityClass > conditionVar.securityClass
        )
      ) {
        throw new SecurityError(
          `Implicit Information Flow Security breached. Check nested ${stmtKind} statements`
        ); 
      }
    }
    return stmt;
  }
  export function declassify(val: RuntimeVal) {
    val.securityClass = SecurityLabel.Unclassified;
  }
  export function downgrade(val: RuntimeVal) {
    if (val.securityClass == SecurityLabel.TopSecret) {
      val.securityClass = SecurityLabel.Secret;
    } else if (val.securityClass == SecurityLabel.Secret) {
      val.securityClass = SecurityLabel.Confidential;
    } else if (val.securityClass == SecurityLabel.Confidential) {
      val.securityClass = SecurityLabel.Unclassified;
    } else if (val.securityClass == SecurityLabel.Unclassified) {
      // can't downgrade further
      val.securityClass = SecurityLabel.Unclassified;
    } else {
      throw new CodeError("Error occured while downgrading.");
    }
  }
  