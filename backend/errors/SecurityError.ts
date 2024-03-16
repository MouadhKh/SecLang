export default class SecurityError extends Error {
    constructor(message: string) {
      super(message);
      this.name="SecurityError";
    }
    toString() {
      return this.message;
    }
  }
  