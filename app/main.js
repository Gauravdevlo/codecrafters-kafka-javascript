import net from "net";
// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");
// Uncomment this block to pass the first stage
const server = net.createServer((connection) => {
	connection.on("data", (data) => {
		let APIVersions = [0, 1, 2, 3, 4];
		let request_api_key = data.subarray(0, 2);
		let request_api_version = data.subarray(2, 4);
		let correlation_id = data.subarray(4, 12);
		if (APIVersions.includes(request_api_version)) {
			connection.write(correlation_id);
		}
		else {
			connection.write(correlation_id);
			connection.write(new Uint8Array([0, 35]));
		}
	})
});
server.listen(9092, "127.0.0.1");

