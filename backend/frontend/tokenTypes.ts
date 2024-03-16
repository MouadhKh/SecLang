export enum TokenType {
  // Literal types
  Number,
  Boolean,
  Identifier,
  StringValue,
  //Types
  Int,
  String,
  Bool,
  Const,
  //SecurityClasses
  Colon,
  TopSecret,
  Secret,
  Confidential,
  Unclassified,

  Equals,
  Comma,
  LParen,
  RParen,
  BinaryOperator,
  ComparisonOperator,
  SingleQuote,
  EOF,
  //Conditional tokens
  If,
  EndIf,
  Then,
  Else,
  While,
  Do,
  EndWhile,
  Debug,
  Input,
  // Security class change
  Declassify,
  Downgrade,
  //Channel
  OpenChannel,
  CloseChannel,
  TopSecretCh,
  SecretCh,
  ConfidentialCh,
  UnclassifiedCh,
  Write,
  Read,
}
