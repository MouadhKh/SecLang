export default class ChannelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileError";
  }
  toString() {
    return this.message;
  }
}
