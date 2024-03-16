import axios, { HttpStatusCode } from "axios";
import { ErrorObject } from "./types";

export async function initSession(sessionId: string) {
  const response = await axios.post("http://localhost:8000/init", {
    sessionId,
  });
  return response.data;
}

export async function runCode(
  sessionId: string,
  code: string
): Promise<any> {
  return await axios
    .post("http://localhost:8000/run-code", {
      sessionId,
      code,
    })
    .then((response) => {
      if (response.status == HttpStatusCode.Ok) {
        if (response.data.error == null) {
          return response.data;
        } else {
          return response.data.error as ErrorObject;
        }
      }
    });
}
export async function getChannelsContent(sessionId: string) {
  const response = await axios.post(
    "http://localhost:8000/channels/:sessionId",
    {
      sessionId,
    }
  );
  return response.data;
}
