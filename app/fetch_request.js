import { sendResponseMessage } from "./utils/index.js";
export const handleFetchRequest = (connection, responseMessage, buffer) => {
  try {
    let updatedResponse = {
      correlationId: responseMessage.correlationId,
      tagBuffer: Buffer.from([0]),
      throttleTimeMs: Buffer.from([0, 0, 0, 0]),
      error_code: Buffer.from([0, 0]),
      session_id: Buffer.from([0, 0, 0, 0]),
      responses: Buffer.from([1]),
      tagBuffer2: Buffer.from([0]),
    };
    const messageSizeBuffer = Buffer.alloc(4);
    // console.log(Buffer.concat(Object.values(updatedResponse)).length);
    messageSizeBuffer.writeInt32BE([
      Buffer.concat(Object.values(updatedResponse)).length,
    ]);
    updatedResponse = {
      messageSize: messageSizeBuffer,
      ...updatedResponse,
    };
    sendResponseMessage(connection, updatedResponse);
  } catch (e) {
    console.log(e);
  }
};