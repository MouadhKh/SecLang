import { globalConfig } from "../../config/config.ts";
import ChannelError from "../../errors/ChannelError.ts";
import ConfigError from "../../errors/ConfigError.ts";
import { RuntimeVal } from "../../runtime/values.ts";
import {
  closeFile,
  getFileContent,
  openFileForWrite,
  readFromFileAndDelete,
  writeToFile,
} from "../../utils/files_utility.ts";
import { openFileForRead } from "../../utils/files_utility.ts";

export default class Channel {
  channelName: string;
  accessMode: string;
  fileDescriptor: number | null; // File descriptor for the opened file or null if not opened
  filePath: string;
  contentList: string[];
  sessionId?: string;

  constructor(channelName: string, accessMode: string, sessionId?: string) {
    this.channelName = channelName;
    this.accessMode = accessMode;
    this.contentList = [];
    this.fileDescriptor = null; // Initialize with null to indicate the channel is not opened
    if (globalConfig.environment === "dev" && sessionId == undefined) {
      this.filePath = `resources/channels/${this.channelName}.txt`;
    } else if (globalConfig.environment === "prod") {
      this.sessionId = sessionId;
      this.filePath = `resources/channels/temp/${channelName}_${this.sessionId}.txt`; // Unique filename
    } else {
      throw new ConfigError("Invalid environment. Check the configuration");
    }
  }

  open() {
    if (this.fileDescriptor === null) {
      if (this.accessMode === "r") {
        // Open the file for reading and get the file descriptor
        this.fileDescriptor = openFileForRead(this.filePath);
      } else if (this.accessMode === "w") {
        // Open the file for writing and get the file descriptor
        this.fileDescriptor = openFileForWrite(this.filePath);
      }
    }
  }

  close() {
    if (this.fileDescriptor === null) {
      return; // File is already closed, do nothing
    }
    closeFile(this.fileDescriptor);
    this.fileDescriptor = null;
  }

  read() {
    if (!this.fileDescriptor) {
      throw new ChannelError(
        `Cannot perform read operations on closed channel '${this.channelName}'`
      );
    }
    if (this.accessMode !== "r") {
      throw new ChannelError("Impossible to read from channel in write mode.");
    }
    if (!this.contentList.length) {
      this.contentList = getFileContent(this.filePath);
    }
    const channelContent = this.contentList.shift();
    return channelContent !== undefined ? channelContent : "";
  }

  write(data: RuntimeVal) {
    if (!this.fileDescriptor) {
      throw new ChannelError(
        `Error: Cannot perform write operations on closed channel '${this.channelName}'`
      );
    }
    if (this.accessMode !== "w") {
      throw new ChannelError(
        `Cannot write to channel '${this.channelName}' in read mode.`
      );
    }
    let writeResult = false;
    writeToFile(this.fileDescriptor, data.value).then(
      (res) => (writeResult = res)
    );
    return writeResult;
  }

  public isOpen(): boolean {
    return this.fileDescriptor != null;
  }
}
