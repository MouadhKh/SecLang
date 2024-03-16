export default class ConfigError extends Error {
    constructor(message: string) {
      super(message);
    }
    toString() {
      return this.message;
    }
  }
  