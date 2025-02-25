import net from "net";
// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");
// Uncomment this block to pass the first stage
const server = net.createServer((connection) => {
  // Handle connection
    connection.on("data", (data) => {
        const request_api_key = data.subarray(0, 2);
        const request_api_version = data.subarray(2, 4);
        const correlation_id = data.subarray(4, 12);
        connection.write(correlation_id);
    })
});