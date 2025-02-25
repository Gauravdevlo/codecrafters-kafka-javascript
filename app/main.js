import net from "net";
const PORT = 9092;
const server = net.createServer((connection) => {
  connection.on("data", (data) => {
    connection.write(data.subarray(4, 12));
  });
});
server.listen(PORT, "127.0.0.1");