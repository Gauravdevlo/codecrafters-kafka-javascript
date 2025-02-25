import net from "net";
// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");
// Uncomment this block to pass the first stage
function responseApiVersionsV0(
  corr_id,
  err_code,
  api_key,
  min_version,
  max_version,
  throttle_time = 0
) {
  const response = Buffer.alloc(30);
  response.writeInt32BE(corr_id, 4);
  //body
  response.writeInt16BE(err_code, 8);
  response.writeInt8(3, 10);
  response.writeInt16BE(api_key, 11);
  response.writeInt16BE(min_version, 13);
  response.writeInt16BE(max_version, 15);
  response.writeInt8(0, 17);
  response.writeInt16BE(75, 18);
  response.writeInt16BE(0, 20);
  response.writeInt16BE(0, 22);
  response.writeInt8(0, 23);
  response.writeInt32BE(throttle_time, 24);
  response.writeInt8(0, 29);
  response.writeInt32BE(response.length - 4, 0);
  return response;
}
const validVersions = [0, 1, 2, 3, 4];
const server = net.createServer((connection) => {
  // Handle connection
  connection.on("connect", () => {
    console.log("Client connected");
  });
  connection.on("data", (data) => {
    "use strict";
    const len = data.readInt32BE(0);
    const header = data.subarray(4, data.length);
    console.log(`Received ${len} bytes`);
    const req_api_key = header.readInt16BE(0);
    const req_api_version = header.readInt16BE(2);
    const corr_id = header.readInt32BE(4);
    const cliend_id = header.reduce((acc, val) => {
      if (String.fromCharCode(val) === "\0") {
        return acc;
      }
      acc += String.fromCharCode(val);
    }, "");
    if (validVersions.indexOf(req_api_version) === -1) {
      console.log("Invalid API version");
      connection.write(responseApiVersionsV0(corr_id, 35, 0, 0, 0));
    } else {
      console.log(`API Key: ${req_api_key}`);
      console.log(`API Version: ${req_api_version}`);
      console.log(`Correlation ID: ${corr_id}`);
      console.log(`Client ID: ${cliend_id}`);
      connection.write(responseApiVersionsV0(corr_id, 0, 18, 0, 4));
    }
  });
});
server.listen(9092, "127.0.0.1");