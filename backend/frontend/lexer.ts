import CodeError from "../errors/CodeError.ts";
import { TokenType } from "./tokenTypes.ts";

const KEYWORDS: Record<string, TokenType> = {
  //var: TokenType.Var,
  int: TokenType.Int,
  bool: TokenType.Bool,
  const: TokenType.Const,
  string: TokenType.String,
  true: TokenType.Boolean,
  false: TokenType.Boolean,
  //User interaction: channel independent
  debug: TokenType.Debug,
  input: TokenType.Input,
  //Conditional Keywords
  if: TokenType.If,
  endif: TokenType.EndIf,
  then: TokenType.Then,
  else: TokenType.Else,
  //Loop
  while: TokenType.While,
  do: TokenType.Do,
  endwhile: TokenType.EndWhile,
  //Security Labels
  TS: TokenType.TopSecret,
  S: TokenType.Secret, 
  C: TokenType.Confidential,
  U: TokenType.Unclassified,
  //security class procedures
  declassify: TokenType.Declassify,
  downgrade: TokenType.Downgrade,
  //Channel
  open: TokenType.OpenChannel,
  close: TokenType.CloseChannel,
  write: TokenType.Write,
  read: TokenType.Read,
  unclassified: TokenType.UnclassifiedCh,
  confidential: TokenType.ConfidentialCh,
  secret: TokenType.SecretCh,
  topsecret: TokenType.TopSecretCh,
};

export interface Token {
  value: string;
  type: TokenType;
  lineNumber?: number;
  columnNumber?: number;
}
function token(
  value = "",
  type: TokenType,
  lineNumber?: number,
  columnNumber?: number
): Token {
  return { value, type, lineNumber, columnNumber };
}

//is alphabetic
function isAlpha(src: string) {
  const pattern = /^[a-zA-Z]+$/;
  return pattern.test(src);
}

function isNumeric(src: string) {
  const numericRegex = /^-?\d+\.?\d*$/;
  return numericRegex.test(src);
}

/**
 * The advantage of using a Set is that it provides constant-time lookups, so the function can quickly
 *  determine if the input string contains a whitespace character. This implementation is more
 * optimized than the original function because it only needs to perform a single lookup in the set,
 * rather than multiple comparisons.
 */
function isSkippable(src: string) {
  const skippables = new Set([" ", "\n", "\r", "\t"]);
  return skippables.has(src);
}

export function tokenize(sourceCode: string): Token[] {
  const tokens = new Array<Token>();
  const lines = sourceCode.split("\n");
  let lineNumber = 1;
  let line;
  while (lines.length > 0) {
    line = lines.shift();
    if (line === undefined) {
      break;
    }
    let columnNumber = -1;
    const src = line.split("");

    const createToken = (
      stringValue: string | undefined,
      tokenType: TokenType
    ) => {
      return token(stringValue, tokenType, lineNumber, columnNumber);
    };

    while (src.length > 0) {
      switch (src[0]) {
        case "(":
          tokens.push(createToken(src.shift(), TokenType.LParen));
          break;
        case ")":
          tokens.push(createToken(src.shift(), TokenType.RParen));
          break;
        case "+":
        case "-":
        case "*":
        case "/":
        case "%":
          tokens.push(createToken(src.shift(), TokenType.BinaryOperator));
          break;
        case ">":
        case "<":
          // this handles <,>,>= & <=
          {
            if (src[1] == "=") {
              tokens.push(createToken(src.shift()+'=', TokenType.BinaryOperator));
              src.shift();
              columnNumber++;
            } else {
              tokens.push(createToken(src.shift(), TokenType.BinaryOperator));
            }
          }
          break;
        case "=": {
          // this handles = and ==
          if (src[1] == "=") {
            columnNumber++;
            tokens.push(createToken(src.shift()+'=', TokenType.BinaryOperator));
            src.shift();
          } else {
            tokens.push(createToken(src.shift(), TokenType.Equals));
          }
          break;
        }
        case ",":
          tokens.push(createToken(src.shift(), TokenType.Comma));
          break;
        case ":":
          tokens.push(createToken(src.shift(), TokenType.Colon));
          break;
        default:
          //Multicharacters tokens
          //handle Numeric Type Tokens
          if (isNumeric(src[0])) {
            let num = "";
            while (src.length > 0 && isNumeric(src[0])) {
              num += src.shift();
            }
            if (num.length > 1) {
              columnNumber += num.length;
            }
            tokens.push(createToken(num, TokenType.Number));
            //handle strings
          } else if (src[0] == "'") {
            let string = "";
            tokens.push(createToken(src.shift(), TokenType.SingleQuote));
            while (src[0] !== "'" && src.length > 0) {
              string += src.shift();
            }
            columnNumber += string.length;
            tokens.push(createToken(string, TokenType.StringValue));
            if (src[0] === "'") {
              columnNumber++; 
              tokens.push(createToken(src.shift(), TokenType.SingleQuote));
            }
            //handle aphabetic type tokens
          } else if (isAlpha(src[0])) {
            let identifier = "";
            while (src.length > 0 && isAlpha(src[0])) {
              identifier += src.shift();
            }
            //check for reserved keywords
            const reserved = KEYWORDS[identifier];
            if (typeof reserved != "number") {
              if (identifier.length > 1) {
                columnNumber += identifier.length;
              }
              tokens.push(createToken(identifier, TokenType.Identifier));
            } else {
              if (identifier.length > 1) {
                columnNumber += identifier.length;
              }
              tokens.push(createToken(identifier, reserved));
            }
          } else if (isSkippable(src[0])) {
            src.shift(); // SKIP THE CURRENT CHARACTER
          } else {
            throw new CodeError(
              `Unrecognized character '${src[0]}' found at ${lineNumber}:${columnNumber} `
            );
          }
          break;
      }
      columnNumber++;
    }
    lineNumber++;
  }
  lineNumber--; //EndOfLine
  tokens.push({
    type: TokenType.EOF,
    value: "EndOfFile",
    lineNumber,
    columnNumber: line!.length,
  });
  return tokens;
}
