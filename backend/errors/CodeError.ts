export default class CodeError extends Error {
  constructor(message: string) {
    super(message);
    // super(`CodeError: ${message}`);
    this.name = "CodeError";
  }
  toString() {
    return this.message;
  }
}
