export default class ChannelError extends Error {
    constructor(message: string) {
      super(message);
      this.name="ChannelError";
    }
    toString() {
      return this.message;
    }
  }
  