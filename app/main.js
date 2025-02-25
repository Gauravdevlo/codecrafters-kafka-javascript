import net from "net";
// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");
// Uncomment this block to pass the first stage
//
// The message_size field is a 32-bit signed integer. It specifies the size of the header and body.
const server = net.createServer((connection) => {
   connection.on("data", data => {
	console.log(data);
	if (data.length >= 8) {
		
		const parsedApiVersion = data.readInt16BE(6);
		console.log(`API version is ${parsedApiVersion}`);
		const correlationId = data.readInt32BE(8);
		
		const corr_buffer = Buffer.alloc(4);
		corr_buffer.writeInt32BE(correlationId, 0);
		let errorCode;
		if (0 <= parsedApiVersion && parsedApiVersion <= 4) { 
			errorCode = 0;
		}
		else {
			errorCode = 35;
		}
		
		const error_code_buffer = Buffer.alloc(2);
                error_code_buffer.writeInt16BE(errorCode, 0);
		let response_buffer;
		
		if(errorCode == 0) {
			const numApiVersions = 2;
			const num_api_versions_buffer = Buffer.alloc(1);
			num_api_versions_buffer.writeInt8(numApiVersions, 0);
		
			const apiVersion = 18;
			const api_version_buffer = Buffer.alloc(2);
			api_version_buffer.writeInt16BE(apiVersion, 0);
			const minVersion = 0;
			const min_version_buffer = Buffer.alloc(2);
			min_version_buffer.writeInt16BE(minVersion, 0);
			const maxVersion = 4;
			const max_version_buffer = Buffer.alloc(2);
			max_version_buffer.writeInt16BE(maxVersion, 0);		
			const tagBuffer = 0;
			const tag_buffer = Buffer.alloc(1);
			tag_buffer.writeUInt8(tagBuffer, 0);
			const throttleTimeMs = 0;
			const throttle_buffer = Buffer.alloc(4);
			throttle_buffer.writeInt32BE(throttleTimeMs, 0);
			
			const tagBuffer2 = 0;
			const tag_buffer2 = Buffer.alloc(1);
			tag_buffer2.writeUInt8(tagBuffer2, 0);
			response_buffer = Buffer.concat([error_code_buffer, num_api_versions_buffer, api_version_buffer, min_version_buffer, max_version_buffer, tag_buffer, throttle_buffer, tag_buffer2]);
		}
		else {
			response_buffer = error_code_buffer;
		}
			
		const response_body_buffer = Buffer.concat([corr_buffer, response_buffer])
		const messageSize = response_body_buffer.length;
		const message_size_buffer = Buffer.alloc(4);
		message_size_buffer.writeInt32BE(messageSize, 0);
		
		const final_response = Buffer.concat([message_size_buffer, response_body_buffer]);
		
		connection.write(final_response);
		//connection.end();
	} else {
		console.log("Not enough data received");
	}
   })
});
server.listen(9092, "127.0.0.1");