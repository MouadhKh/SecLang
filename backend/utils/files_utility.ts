import FileError from "../errors/FileError.ts";
import Channel from "../runtime/channels/channel.ts";
import { walk } from "https://deno.land/std@0.201.0/fs/mod.ts";

  // Open the file for writing and return the file descriptor
export function openFileForWrite(filePath: string): number {
  try {
    const file = Deno.openSync(filePath, {
      create: true,
      write: true,
      append: true,
    });
    return file.rid;
  } catch (error) {
    throw new FileError(
      `Failed to open file '${filePath}' for writing: ${error.message}`
    );
  }
}

export function openFileForRead(filePath: string): number {
  try {
    const file = Deno.openSync(filePath, {
      read: true,
      write: true,
    });
    return file.rid;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      Deno.createSync(filePath);
      const file = Deno.openSync(filePath, { read: true });
      return file.rid;
    } else {
      throw new FileError(
        `Failed to open file '${filePath}' for reading: ${error.message}`
      );
    }
  }
}
export function closeFile(fileDescriptor: number | null): void {
  try {
    Deno.close(fileDescriptor!);
  } catch (error) {
    throw new FileError(`Failed to close file: ${error.message}`);
  }
}

export function writeToFile(
  fileDescriptor: number,
  data: string
): Promise<boolean> {
  try {
    if (fileDescriptor != undefined) {
      Deno.writeSync(fileDescriptor, new TextEncoder().encode(data + "\n"));
      return Promise.resolve(true);
    } else {
      throw new FileError("File is not open.");
    }
  } catch (error) {
    console.error(`Error appending data to file: ${error.message}`); //this kind of errors should never reach the end-user
    return Promise.resolve(false);
  }
}

export function getFileContent(filePath: string): string[] {
  try {
    const fileContent = Deno.readTextFileSync(filePath);
    const contentList = fileContent.split("\n").map(line => line.trim());
    return contentList;
  } catch (error) {
    throw new FileError(`Error reading data from file: ${error.message}`);
  }
}
/**
 * Careful, this has a side effect:
 * it reads the top element at the file & ALSO deletes it
 * This is not used anymore in the channel read operations
 * @deprecated
 * @param filePath
 * @returns
 */
export function readFromFileAndDelete(filePath: string): string {
  try {
    const fileContent = Deno.readTextFileSync(filePath);

    // Find the position of the first newline character
    const newlineIndex = fileContent.indexOf("\n");

    if (newlineIndex !== -1) {
      // Extract the first line
      const firstLine = fileContent.slice(0, newlineIndex);

      // Overwrite the file with the content after the first line
      const remainingContent = fileContent.slice(newlineIndex + 1);
      Deno.writeTextFileSync(filePath, remainingContent);

      return firstLine;
    } else {
      Deno.writeTextFileSync(filePath, ""); // Empty the file
      return fileContent;
    }
  } catch (error) {
    throw new FileError(`Error reading data from file: ${error.message}`);
  }
}

//This is internally used to get channel content
// Shouldn't be confused with the readFromFile()
export function readChannelFile(channel: Channel): string {
  const filePath = channel.filePath;
  try {
    const fileContent = Deno.readTextFileSync(filePath);
    return fileContent;
  } catch (error) {
    console.error(
      `Error reading file for channel ${channel.channelName}:`,
      error
    );
    return ""; // Return empty content in case of error
  }
}
//not needed because we are dealing with our own static files
export async function checkFilePermissions(filePath: string): Promise<void> {
  const readPermission = await Deno.permissions.query({
    name: "read",
    path: filePath,
  });
  const writePermission = await Deno.permissions.query({
    name: "write",
    path: filePath,
  });

  if (readPermission.state === "denied" || writePermission.state === "denied") {
    throw new FileError(
      "You don't have the necessary permissions to read and write the file."
    );
  }

  console.log("File permissions are granted. You can read and write the file.");
}
export async function cleanUpFiles(sessionId: string) {
  const tempDirectory = "resources/channels/temp/";

  for await (const entry of walk(tempDirectory)) {
    if (entry.name.includes(sessionId)) {
      try {
        await Deno.remove(entry.path);
        console.log(`Deleted file: ${entry.name}`);
      } catch (err) {
        console.error(`Error deleting file ${entry.name}:`, err);
      }
    }
  }
}
