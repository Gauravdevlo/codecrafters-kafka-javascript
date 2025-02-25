import net from "net";
// Utility functions (you might want to move these to a separate file)
const toBufferFromInt8 = (value) => Buffer.from([value]);
const toBufferFromInt16BE = (value) => {
    const buf = Buffer.alloc(2);
    buf.writeInt16BE(value);
    return buf;
};
const toBufferFromInt32BE = (value) => {
    const buf = Buffer.alloc(4);
    buf.writeInt32BE(value);
    return buf;
};
const NULL_TAG = Buffer.from([0, 0]);
// Constants
const PORT = 9092;
const HOST = "127.0.0.1";
const API_VERSIONS_KEY = 18;
// Helper functions
const parseRequestHeader = (data) => ({
    length: data.readInt32BE(0),
    apiKey: data.readInt16BE(4),
    apiVersion: data.readInt16BE(6),
    correlationId: data.readInt32BE(8),
    clientId: data.slice(12, data.indexOf(0, 12)).toString(),
});
const handleApiVersionRequest = (request) => {
    const { apiKey, apiVersion, correlationId } = request;
    const header = toBufferFromInt32BE(correlationId);
    const isValidApiVersion = 0 <= apiVersion && apiVersion <= 4;
    const errorCode = toBufferFromInt16BE(isValidApiVersion ? 0 : 35);
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
const handleClientConnection = (connection) => {
    console.log("Client connected");
    connection.on("data", (data) => {
        console.log("Received data:", data.toString("hex"));
        try {
            if (data.length < 12) {
                throw new Error("Received insufficient data for request header");
            }
            const header = parseRequestHeader(data);
            console.log("Parsed header:", header);
            if (header.apiKey === API_VERSIONS_KEY) {
                console.log("Handling ApiVersions request");
                const response = handleApiVersionRequest(header);
                connection.write(response);
                console.log("ApiVersions response sent:", response.toString("hex"));
            }
            else {
                console.error("Unsupported API Key:", header.apiKey);
                // In a full implementation, you'd handle other API requests or send an error response
            }
        }
        catch (error) {
            console.error("Error handling client data:", error);
            // In a production environment, you might want to send an error response to the client
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