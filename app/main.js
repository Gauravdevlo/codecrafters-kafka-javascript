import { Buffer } from "node:buffer";
import net from "net";
// Big Endian - 32-bit signed integer - correlationId
// 16 -bit signed - error_code
// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");
export function getBuffer(value, bits) {
  let buf;
  buf = Buffer.alloc(bits / 8);
  switch (bits) {
    case 8:
      buf.writeUInt8(value);
      break;
    case 16:
      buf.writeInt16BE(value);
      break;
    case 32:
      buf.writeInt32BE(value);
      break;
  }
  return buf;
}
function parseRequest(data) {
  return {
    size: data.readInt32BE(0),
    header: {
      apiKey: data.readInt16BE(4),
      apiVersion: data.readInt16BE(6),
      correlationId: data.readInt32BE(8),
      clientId: {
        length: data.readInt16BE(12),
        contents: data.toString("utf-8", 14, 14 + data.readInt16BE(12)),
      },
      tag: 1,
      end: 15 + data.readInt16BE(12),
    },
    data: data,
  };
}
function serializeResponse(response) {
  const keys = Object.keys(response);
  const responseArray = [];
  let length = 0;
  for (const key of keys) {
    length = length + response[key].length;
    responseArray.push(response[key]);
  }
  responseArray.push(getBuffer(0, 8));
  length = length + getBuffer(0, 8).length;
  responseArray.unshift(getBuffer(length, 32));
  return Buffer.concat(responseArray);
}
function handleRequest(data, connection) {
  const request = parseRequest(data);
  const response = {
    correlationId: getBuffer(request.header.correlationId, 32),
  };
  if (request.header.apiVersion < 0 || request.header.apiVersion > 4) {
    response.error = getBuffer(35, 16);
    connection.write(serializeResponse(response));
  } else {
    respondByAPI_KEY(response, request);
    connection.write(serializeResponse(response));
  }
}
function respondByAPI_KEY(response, request) {
  switch (request.header.apiKey) {
    case 18:
      response.error = getBuffer(0, 16);
      response.num_api_keys = getBuffer(3, 8);
      response.api_keys = Buffer.concat([
        getBuffer(18, 16),
        getBuffer(0, 16),
        getBuffer(4, 16),
        getBuffer(0, 8),
        getBuffer(75, 16),
        getBuffer(0, 16),
        getBuffer(0, 16),
        getBuffer(0, 8),
      ]);
      response.throttle_time_ms = getBuffer(0, 32);
      break;
    case 75:
      handleDescribePartition(response, request);
      break;
  }
}
const server = net.createServer((connection) => {
  connection.on("data", (data) => {
    handleRequest(data, connection);
  });
});
server.listen(9092, "127.0.0.1");
function parseRequestByAPIKey(request) {
  switch (request.header.apiKey) {
    case 75:
      const end = request.header.end;
      request.describePartitionBody = {
        topicsArray: {
          length: request.data.readUInt8(request.header.end) - 1,
          topics: [],
        },
      };
      for (
        let i = 0;
        i < request.describePartitionBody.topicsArray.length;
        i++
      ) {
        request.describePartitionBody.topicsArray.topics.push({
          nameLen: request.data.readUInt8(end + 1) - 1,
          name: request.data.toString(
            "utf-8",
            end + 2,
            end + 2 + request.data.readUInt8(end + 1) - 1
          ),
        });
      }
      break;
  }
}
function handleDescribePartition(response, request) {
  parseRequestByAPIKey(request);
  response.NULL_TAG = getBuffer(0, 8);
  response.throttle_time_ms = getBuffer(0, 32);
  getTopicArrayResponse(response, request);
  const buf = Buffer.alloc(1);
  buf.write("ff", "hex");
  response.nextCursor = buf;
}
function getTopicArrayResponse(response, request) {
  response.topics_len = getBuffer(
    request.describePartitionBody.topicsArray.length + 1,
    8
  );
  getTopicEntry(response, request);
}
function getTopicEntry(response, request) {
  // const buffer = request.data
  const topicBuffArr = [];
  for (let i = 0; i < response.topics_len.readUInt8(0) - 1; i++) {
    let meta = getBuffer(3, 16);
    let buf = Buffer.alloc(
      request.describePartitionBody.topicsArray.topics[i].nameLen
    );
    buf.write(
      request.describePartitionBody.topicsArray.topics[i].name,
      "utf-8"
    );
    meta = Buffer.concat([
      meta,
      getBuffer(
        request.describePartitionBody.topicsArray.topics[i].nameLen + 1,
        8
      ),
      buf,
    ]);
    for (let j = 0; j < 16; j++) {
      meta = Buffer.concat([meta, getBuffer(0, 8)]); // topic id
    }
    meta = Buffer.concat([meta, getBuffer(0, 8)]); // is internal
    meta = Buffer.concat([meta, getBuffer(1, 8)]);
    buf = Buffer.alloc(4);
    buf.write("00000df8", "hex");
    meta = Buffer.concat([meta, buf]);
    meta = Buffer.concat([meta, getBuffer(0, 8)]);
    topicBuffArr.push(meta);
  }
  response.topics_array = Buffer.concat(topicBuffArr);
}