import net from "net";
// Utility functions for encoding data
const toBufferFromInt8 = (value) => Buffer.from([value]);
const toBufferFromInt16BE = (value) => {
    const buf = Buffer.alloc(2);
    buf.writeInt16BE(value);
    return buf;
};
const toBufferFromInt32BE = (value) => {
    const buf = Buffer.alloc(4);
    buf.writeUInt32BE(value); // Change to writeUInt32BE for unsigned 32-bit integer
    return buf;
};
// Constants
const PORT = 9092;
const HOST = "127.0.0.1";
const VALID_API_VERSIONS = [0, 1, 2, 3, 4];
const INVALID_API_VERSION_ERROR = 35;
const API_VERSIONS_KEY = 18;
const NULL_TAG = Buffer.from([0, 0]);
// Helper functions
const parseRequestHeader = (data) => ({
    length: data.readUInt32BE(0),
    apiKey: data.readUInt16BE(4),
    apiVersion: data.readUInt16BE(6),
    correlationId: data.readUInt32BE(8), // Ensure it's unsigned
    clientId: data.slice(12, data.indexOf(0, 12)).toString(),
});
const createResponseBuffer = (length, correlationId, errorCode) => {
    const buffer = Buffer.alloc(errorCode ? 16 : 12);
    buffer.writeUInt32BE(length, 0);
    buffer.writeUInt32BE(correlationId, 4); // Ensure it's unsigned
    if (errorCode !== undefined) {
        buffer.writeUInt16BE(errorCode, 8);
    }
    return buffer;
};
// Handle ApiVersions request
const handleApiVersionRequest = (request) => {
    const { apiKey, apiVersion, correlationId } = request;
    const header = toBufferFromInt32BE(correlationId);
    const isValidApiVersion = VALID_API_VERSIONS.includes(apiVersion);
    const errorCode = toBufferFromInt16BE(isValidApiVersion ? 0 : INVALID_API_VERSION_ERROR);
    const api_keys = Buffer.concat([
        toBufferFromInt8(2), // Number of API keys (hardcoded to 2 for this example)
        toBufferFromInt16BE(apiKey),
        toBufferFromInt16BE(0), // Min version
        toBufferFromInt16BE(4), // Max version
        toBufferFromInt16BE(API_VERSIONS_KEY), // ApiVersions key
        toBufferFromInt16BE(0), // Min version for ApiVersions
        toBufferFromInt16BE(4), // Max version for ApiVersions
        NULL_TAG,
    ]);
    const throttle_time_ms = toBufferFromInt32BE(0);
    const body = Buffer.concat([errorCode, api_keys, throttle_time_ms, NULL_TAG]);
    const response = Buffer.concat([header, body]);
    const responseSize = toBufferFromInt32BE(response.length);
    return Buffer.concat([responseSize, response]);
};
// Client connection handler
const handleClientConnection = (connection) => {
    console.log("Client connected");
    connection.on("data", (data) => {
        console.log("Received data:", data.toString("hex"));
        if (data.length < 12) {
            console.error("Received insufficient data for request header");
            return;
        }
        try {
            const header = parseRequestHeader(data);
            console.log("Parsed header:", header);
            if (header.apiKey === API_VERSIONS_KEY) {
                console.log("Handling ApiVersions request");
                const response = handleApiVersionRequest(header);
                connection.write(response);
                console.log("ApiVersions response sent:", response.toString("hex"));
            } else {
                console.error("Unsupported API Key:", header.apiKey);
                const errorResponse = createResponseBuffer(12, header.correlationId, INVALID_API_VERSION_ERROR);
                connection.write(errorResponse);
            }
        } catch (error) {
            console.error("Error handling client data:", error);
        }
    });
    connection.on("end", () => {
        console.log("Client disconnected");
    });
};
// Create and start the server
const server = net.createServer(handleClientConnection);
server.listen(PORT, HOST, () => {
    console.log(`Kafka ApiVersions server is listening on ${HOST}:${PORT}`);
});
// Error handling for the server
server.on("error", (err) => {
    console.error("Server error:", err);
});