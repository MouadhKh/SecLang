import { VarType } from "./types.ts";


export type NodeType =
  // STATEMENTS
  | "Program"
  | "VarDeclaration"
  // EXPRESSIONS
  | "AssignmentExpr"
  | "NumericLiteral"
  | "BooleanLiteral"
  | "StringLiteral"
  | "Identifier"
  | "BinaryExpr"
  // User Interaction
  | "DebugStmt"
  | "InputStmt"
  //Conditional
  | "ConditionalStmt"
  //Loop
  | "WhileStmt"
  //Security Class Methods
  | "DowngradeProc"
  | "DeclassifyProc"
  //Channel
  | "OpenChannelStmt"
  | "CloseChannelStmt"
  | "WriteStmt"
  | "ReadStmt";


// A statement doesn't return a value; an expression returns a value
export interface Stmt {
  kind: NodeType;
  linePos?: number;
  colPos?: number;
}

export interface Program extends Stmt {
  kind: "Program";
  body: Stmt[];
}
export interface DebugStmt extends Stmt {
  kind: "DebugStmt";
  expression: Expr;
}

export interface InputStmt extends Stmt {
  kind: "InputStmt";
  message: string;
  targetSymbol: string;
}
export interface VarDeclaration extends Stmt {
  kind: "VarDeclaration";
  constant: boolean;
  identifier: string;
  securityClass: number;
  type: VarType;
  value?: Expr;
}

export interface ConditionalStmt extends Stmt {
  kind: "ConditionalStmt";
  condition: Expr;
  body: Stmt[];
  elseBody?: Stmt[];
}
export interface WhileStmt extends Stmt {
  kind: "WhileStmt";
  condition: Expr;
  body: Stmt[];
}
export interface DowngradeProc extends Stmt {
  kind: "DowngradeProc";
  identifier: string;
}

export interface DeclassifyProc extends Stmt {
  kind: "DeclassifyProc";
  identifier: string;
}
export interface OpenChannelStmt extends Stmt {
  kind: "OpenChannelStmt";
  channelName: string; 
  accessMode: string;
}
export interface CloseChannelStmt extends Stmt {
  kind: "CloseChannelStmt";
  channelName: string; 
}
export interface WriteStmt extends Stmt {
  kind: "WriteStmt";
  sourceChannel?: string; 
  targetChannel: string;
  value: Expr;
}
export interface ReadStmt extends Stmt {
  kind: "ReadStmt";
  sourceChannel: string;
  targetVar?: string;
  targetSecurityClass: number;

}

export interface AssignmentExpr extends Expr {
  kind: "AssignmentExpr";
  assigne: Expr;
  value: Expr;
}

export interface Expr extends Stmt {}

export interface BinaryExpr extends Expr {
  kind: "BinaryExpr";
  left: Expr;
  right: Expr;
  operator: string;
}

export interface Identifier extends Expr {
  kind: "Identifier";
  symbol: string;
}

export interface NumericLiteral extends Expr {
  kind: "NumericLiteral";
  value: number;
}
export interface BooleanLiteral extends Expr {
  kind: "BooleanLiteral";
  value: boolean;
}
export interface StringLiteral extends Expr {
  kind: "StringLiteral";
  value: string;
}
