// deno-lint-ignore-file no-explicit-any
import ChannelError from "../errors/ChannelError.ts";
import CodeError from "../errors/CodeError.ts";
import { SecurityLabel } from "../security_extension/labels.ts";
import {
  AssignmentExpr,
  BinaryExpr,
  BooleanLiteral,
  CloseChannelStmt,
  ConditionalStmt,
  DeclassifyProc,
  DowngradeProc,
  Expr,
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
} from "./ast.ts";
import { Token, tokenize } from "./lexer.ts";
import { TokenType } from "./tokenTypes.ts";
import { VarType } from "./types.ts";
import { getSecurityClassAsInt } from "../utils/security_utility.ts";
import { getPreviousTokens } from "../utils/utility.ts";

export default class Parser {
  private tokens: Token[] = [];
  private tokensHistory: Token[] = [];
  private openChannelsStack: string[] = []; // Keep track of opened channels

  private not_eof(): boolean {
    return this.tokens[0].type != TokenType.EOF;
  }

  public produceAST(sourceCode: string): Program {
    this.tokens = tokenize(sourceCode);
    this.tokensHistory = Array.from(this.tokens);
    const program: Program = { kind: "Program", body: [] };
    //Parse until end of file
    while (this.not_eof()) {
      program.body.push(this.parse_stmt());
    }
    return program;
  }

  private at() {
    return this.tokens[0] as Token;
  }

  private parse_stmt(): Stmt {
    switch (this.at().type) {
      case TokenType.Int:
      case TokenType.String:
      case TokenType.Bool:
      case TokenType.Const:
        return this.parse_var_declaration();
      case TokenType.Debug:
        return this.parse_debug_stmt();
      case TokenType.Input:
        return this.parse_input_stmt();
      case TokenType.If:
        return this.parse_conditional_stmt();
      case TokenType.While:
        return this.parse_while_loop();
      case TokenType.Declassify:
        return this.parse_declassify();
      case TokenType.Downgrade:
        return this.parse_downgrade();
      case TokenType.OpenChannel:
        return this.parse_open_stmt();
      case TokenType.CloseChannel:
        return this.parse_close_stmt();
      case TokenType.Write:
        return this.parse_write_stmt();
      default:
        // skip to parse_expr
        return this.parse_expr();
    }
  }
  private parse_declassify(): DeclassifyProc {
    this.expect(
      TokenType.Declassify,
      `Expected 'declassify' keyword, found '${this.at()}'`
    );
    const identifier=this.expect(
      TokenType.Identifier,
      `Expected identifier, found '${this.at()}'`
    ).value;
    return {
      kind: "DeclassifyProc",
      identifier,
      ...this.createPositionalObject(),
    } as DeclassifyProc;
  }
  private parse_downgrade(): DowngradeProc {
    this.expect(
      TokenType.Downgrade,
      `Expected 'downgrade' keyword, found '${this.at()}'`
    );
    const identifier=this.expect(
      TokenType.Identifier,
      `Expected identifier, found '${this.at()}'`
    ).value;
    return {
      kind: "DowngradeProc",
      identifier,
      ...this.createPositionalObject(),
    } as DowngradeProc;
  } 

  private parse_debug_stmt(): DebugStmt {
    this.expect(
      TokenType.Debug,
      `Expected 'debug' keyword, found '${this.at()}'`
    );
    const expression = this.parse_expr();

    return {
      kind: "DebugStmt",
      expression,
      ...this.createPositionalObject(),
    } as DebugStmt;
  }

  private parse_input_stmt(): InputStmt {
    this.expect(
      TokenType.Input,
      `Expected 'input' keyword, found '${this.at().value}'`
    );

    // Parse the identifier where the input will be stored
    const identifier = this.expect(
      TokenType.Identifier,
      `Expected target of 'input' operation, found '${this.at().value}'`
    ).value; 
    this.expect(
      TokenType.SingleQuote,
      `Quote expected, found ${this.at().value}`
    );
    const message = this.expect(
      TokenType.StringValue,
      `Input message expected, found ${this.at().value}`
    ).value;
    this.expect(
      TokenType.SingleQuote,
      `closing quote expected, found ${this.at().value}`
    );
    return {
      kind: "InputStmt",
      message,
      targetSymbol: identifier,
      ...this.createPositionalObject(),
    } as InputStmt;
  }
  private parse_while_loop(): WhileStmt {
    this.expect(
      TokenType.While,
      `Expected 'while' keyword, found '${this.at().value}'`
    );
    const condition = this.parse_expr();
    this.expect(
      TokenType.Do,
      `Expected 'do' keyword, found '${this.at().value}'`
    );

    const body: Stmt[] = [];
    while (
      this.at().type != TokenType.EndWhile &&
      this.at().type != TokenType.EOF
    ) {
      body.push(this.parse_stmt());
    }

    this.expect(
      TokenType.EndWhile,
      `Expected 'endwhile' keyword, found '${this.at().value}'`
    );

    return {
      kind: "WhileStmt",
      condition,
      body,
      ...this.createPositionalObject(),
    } as WhileStmt;
  }

  private parse_var_declaration(): VarDeclaration {
    let isConstant = false;

    if (this.at().type == TokenType.Const) {
      this.advance(); // Eat the const token
      isConstant = true;
    }

    let securityClass = SecurityLabel.Unclassified;
    const type = this.expect(
      [TokenType.Int, TokenType.String, TokenType.Bool],
      "Expected type specifier in variable declaration."
    ).value as VarType;

    const identifier = this.expect(
      TokenType.Identifier,
      `Expected identifier name following variable type keywords, found '${
        this.at().value
      }'`
    ).value;

    if (this.at().type == TokenType.Colon) {
      this.advance(); // Eat the colon

      // if (this.at().type == TokenType.Number) {
      //   securityClass = parseInt(
      //     this.expect(
      //       TokenType.Number,
      //       `Expected Security class definition. Found '${this.at().value}'. `
      //     ).value
      //   );
      // } else {
        const securityClassStr: string = this.expect(
          [
            TokenType.TopSecret,
            TokenType.Secret,
            TokenType.Confidential,
            TokenType.Unclassified,
          ],
          `Expected Security class definition. Found '${this.at().value}'. `
        ).value;
        securityClass = getSecurityClassAsInt(securityClassStr);
      // }
    }

    if (this.at().type == TokenType.Equals) {
      this.advance(); // Eat the equals token
      const declaration = {
        kind: "VarDeclaration",
        value: this.parse_expr(),
        identifier,
        securityClass,
        type,
        constant: isConstant,
      } as VarDeclaration;
      return declaration;
    } else {
      if (isConstant) {
        throw new CodeError(
          `at line ${
            this.at().lineNumber
          }. Must assign value to constant '${identifier}' at declaration.`
        );
      }

      const declaration = {
        kind: "VarDeclaration",
        identifier,
        constant: false,
        securityClass,
        type,
      } as VarDeclaration;

      return declaration;
    }
  }

  private parse_conditional_stmt(): ConditionalStmt {

    this.expect(
      TokenType.If,
      `Expected 'if' keyword, found '${this.at().value}'`
    ); 
    const condition = this.parse_expr();
    this.expect(
      TokenType.Then,
      `Expected 'then' keyword, found '${this.at().value}'`
    );
    const body: Stmt[] = [];
    while (
      this.at().type != TokenType.EndIf &&
      this.at().type != TokenType.Else
    ) {
      body.push(this.parse_stmt());
    }
    // Check for else statement
    let elseBody: Stmt[] | undefined = undefined;
    if (this.at().type == TokenType.Else) {
      elseBody = [];
      this.advance();
      while (this.at().type != TokenType.EndIf) {
        elseBody.push(this.parse_stmt());
      }
    }
    this.expect(
      TokenType.EndIf,
      `Expected 'endif' keyword,found '${this.at()}'`
    );

    return {
      kind: "ConditionalStmt",
      condition,
      body,
      elseBody,
      ...this.createPositionalObject(),
    } as ConditionalStmt;
  }

  private parse_expr(): Expr {
    return this.parse_assignment_expr();
  }
  private parse_assignment_expr(): Expr {
    const left = this.parse_additive_expr();
    if (this.at().type == TokenType.Equals) {
      this.advance(); //advance past =
      const value = this.parse_assignment_expr();
      return {
        value,
        assigne: left,
        kind: "AssignmentExpr",
        ...this.createPositionalObject(),
      } as AssignmentExpr;
    }
    return left;
  }
  private advance(): Token {
    const [head, ...rest] = this.tokens;
    this.tokens = rest;
    return head as Token;
  }
  private expect(type: TokenType | TokenType[], err: string): Token {
    const head = this.tokens.shift();
    if (Array.isArray(type)) {
      if (!type.includes(head!.type)) {
        throw new CodeError(
          ` at ${head?.lineNumber}:${head?.columnNumber}\n. ${err}`
        );
      }
    } else {
      if (!head || head.type != type) {
        throw new CodeError(
          ` at ${head?.lineNumber}:${head?.columnNumber}. ${err}`
        );
      }
    }
    return head!;
  }

  private parse_additive_expr(): Expr {
    let left = this.parse_multiplicative_expr();
    while (this.at().value == "+" || this.at().value == "-") {
      const operator = this.advance().value;
      const right = this.parse_multiplicative_expr();
      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator,
      } as BinaryExpr;
    }
    return left;
  }

  private parse_multiplicative_expr(): Expr {
    let left = this.parse_primary_expr();
    //Supports *,/ & mod
    while (
      this.at().value == "*" ||
      this.at().value == "/" ||
      this.at().value == "%" ||
      this.at().value == ">" ||
      this.at().value == "<" ||
      this.at().value == ">=" ||
      this.at().value == "<=" ||
      this.at().value == "==" ||
      this.at().value == "!="
    ) {
      const operator = this.advance().value;
      const right = this.parse_primary_expr();
      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator,
        linePos: this.at().lineNumber,
        colPos: this.at().columnNumber,
      } as BinaryExpr;
    }
    return left;
  }

  private parse_primary_expr(): Expr {
    const tokenType = this.at().type;
    switch (tokenType) {
      case TokenType.Identifier:
        return {
          kind: "Identifier",
          symbol: this.advance().value,
          ...this.createPositionalObject(),
        } as Identifier;
      case TokenType.Number:
        return {
          kind: "NumericLiteral",
          value: parseFloat(this.advance().value),
          ...this.createPositionalObject(),
        } as NumericLiteral;
      case TokenType.Boolean: {
        const boolValue = this.advance().value === "true";
        return {
          kind: "BooleanLiteral",
          value: boolValue,
          ...this.createPositionalObject(),
        } as BooleanLiteral;
      }
      case TokenType.LParen: {
        this.advance();
        const value = this.parse_expr();
        this.expect(
          TokenType.RParen,
          "Unexpected token found inside parenthesized expression."
        );
        return value;
      }
      case TokenType.SingleQuote: {
        this.advance();
        const value = this.expect(
          TokenType.StringValue,
          "Expected string value"
        ).value;
        this.expect(
          TokenType.SingleQuote,
          "Expected closing single quote for string literal."
        );
        return {
          kind: "StringLiteral",
          value,
          ...this.createPositionalObject(),
        } as StringLiteral;
      }
      case TokenType.Read: {
        return this.parse_read_stmt();
      }
      default: {
        throw new CodeError(
          `Unexpected token '${this.at().value}' found at ${
            this.at().lineNumber
          }:${this.at().columnNumber} during parsing!`
        );
      }
    }
  }
  //---------------Channel Parsers------------

  private parse_open_stmt(): OpenChannelStmt {
    const openToken = this.expect(
      TokenType.OpenChannel,
      `Expected 'open' keyword, found '${this.at().value}'`
    );
    this.expect(
      TokenType.LParen,
      `Expected opening parenthesis after 'open' keyword. Found '${
        this.at().value
      }'`
    );
    this.expect(
      TokenType.SingleQuote,
      `Expecting single quote before channel name. Found '${this.at().value}'`
    );
    const channelName = this.expect(
      TokenType.StringValue,
      `Expected channel name after 'open' keyword. Found '${this.at().value}`
    ).value;
    this.expect(
      TokenType.SingleQuote,
      `Expected closing single quote. Found ${this.at().value}`
    );
    this.expect(TokenType.Comma, `Expected Comma. Found ${this.at().value}`);
    this.expect(
      TokenType.SingleQuote,
      `Expected opening single quote. Found ${this.at().value}`
    );
    const accessModeToken = this.expect(
      TokenType.StringValue,
      `Expected access mode ('r' or 'w') after channel name. Found ${
        this.at().value
      }`
    );
    if (!["r", "w"].includes(accessModeToken.value)) {
      throw new ChannelError(
        ` at ${accessModeToken.lineNumber}:${accessModeToken.columnNumber} : Make sure you entered a correct access mode`
      );
    }
    this.expect(
      TokenType.SingleQuote,
      `Expected closing single quote. Found ${this.at().value}`
    );
    this.expect(
      TokenType.RParen,
      `Expected closing parenthesis. Found '${this.at().value}'`
    );

    // Store the opened channel in the stack
    this.openChannelsStack.push(channelName);

    return {
      kind: "OpenChannelStmt",
      channelName,
      accessMode: accessModeToken.value,
      ...this.createPositionalObject(openToken),
    };
  }

  private parse_close_stmt(): CloseChannelStmt {
    const closeToken = this.expect(
      TokenType.CloseChannel,
      `Expected 'close' keyword, found '${this.at().value}'`
    );
    this.expect(
      TokenType.LParen,
      `Expected opening parenthesis after 'close' keyword. Found '${
        this.at().value
      }'`
    );
    this.expect(
      TokenType.SingleQuote,
      `Expecting single quote before channel name. Found '${this.at().value}'`
    );
    const channelName = this.expect(
      TokenType.StringValue,
      `Expected channel name after 'close' keyword. Found '${this.at().value}`
    ).value;
    this.expect(TokenType.SingleQuote, `Found ${this.at().value}`);
    this.expect(
      TokenType.RParen,
      `Expected closing parenthesis. Found '${this.at().value}'`
    );

    if (this.openChannelsStack.length === 0) {
      throw new ChannelError(
        "Attempting to close a channel, but no channel is open."
      );
    }
    if (!this.openChannelsStack.includes(channelName)) {
      throw new ChannelError(
        "Attempting to close a channel that is not open or does not exist"
      );
    }

    const topChannel = this.openChannelsStack.pop();
    if (channelName !== topChannel) {
      throw new ChannelError(
        "Attempt to close a channel failed! Channels must be closed in the reverse open order."
      );
    }
    //open('Unclassified','r') open('Confidential','r') close('Confidential') close('Unclassified')
    return {
      kind: "CloseChannelStmt",
      channelName,
      ...this.createPositionalObject(closeToken),
    };
  }
  private parse_write_stmt(): WriteStmt {
    const writeToken = this.expect(
      TokenType.Write,
      `Expected 'write' keyword, found '${this.at()}'`
    );
    this.expect(
      TokenType.LParen,
      `Expected opening parenthesis after 'write' keyword. Found '${
        this.at().value
      }'`
    );
    this.expect(
      TokenType.SingleQuote,
      `Expecting single quote before channel name. Found '${this.at().value}'`
    );
    const targetChannel = this.expect(
      TokenType.StringValue,
      `Expected channel name after 'write' keyword. Found '${this.at().value}`
    ).value; //may use this.parse_expr() to make it possible to store channel names in variables ?
    this.expect(TokenType.SingleQuote, `Found ${this.at().value}`);
    this.expect(TokenType.Comma, `Found ${this.at().value}`);
    const value = this.parse_expr();
    this.expect(
      TokenType.RParen,
      `Expected closing parenthesis. Found '${this.at().value}`
    );

    return {
      kind: "WriteStmt",
      targetChannel,
      value,
      ...this.createPositionalObject(writeToken),
    } as WriteStmt;
  }
  private parse_read_stmt(): ReadStmt {
    let targetVar = undefined;
    let targetSecurityClass = SecurityLabel.Unclassified;
    const prevTokens = getPreviousTokens(this.tokens, this.tokensHistory, 5);
    if (prevTokens[prevTokens.length - 1].value == "=") {
      //set target variable when read is called as part of assignment
      prevTokens.forEach((token) => {
        if (token.type == TokenType.Identifier) {
          targetVar = token.value;
        }
      });
    }
    if (prevTokens[2].type == TokenType.Colon) {
      targetSecurityClass = getSecurityClassAsInt(prevTokens[3].value);
    }
    const readToken = this.expect(
      TokenType.Read,
      `Expected 'read' keyword, found '${this.at()}'`
    );
    this.expect(
      TokenType.LParen,
      `Expected opening parenthesis after 'read' keyword. Found '${
        this.at().value
      }'`
    );
    this.expect(
      TokenType.SingleQuote,
      `Expecting single quote before channel name. Found '${this.at().value}'`
    );
    const sourceChannel = this.expect(
      TokenType.StringValue,
      `Expected channel name after 'read' keyword. Found '${this.at().value}`
    ).value;
    this.expect(TokenType.SingleQuote, `Found ${this.at().value}`);
    this.expect(
      TokenType.RParen,
      `Expected closing parenthesis. Found '${this.at().value}`
    );
    return {
      kind: "ReadStmt",
      sourceChannel,
      targetVar,
      targetSecurityClass,
      ...this.createPositionalObject(readToken),
    } as ReadStmt;
  }
  private createPositionalObject(token?: Token): {
    linePos: number;
    colPos: number;
  } {
    if (token) {
      return {
        linePos: token.lineNumber!, 
        colPos: token.columnNumber!,
      };
    }
    return { linePos: this.at().lineNumber!, colPos: this.at().columnNumber! };
  }
}
