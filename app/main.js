import net from "net";
import  requestHeader  from "./requestHeader.js";
// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");
const API_VERSIONS_KEY = 18;
const NULL_TAG = Buffer.from([0, 0]);
const toBufferFromInt8 = (value) => Buffer.from([value]);
// function toBufferFromInt8(value){
//     const buff = Buffer.from([value.toString()])
//     return buff
// }
function toBufferFromInt16BE(value){
    const buff = Buffer.alloc(2)
    buff.writeInt16BE(value);
    return buff
}
function toBufferFromInt32BE(value){
    const buff = Buffer.alloc(4)
    buff.writeInt32BE(value);
    return buff
}
const server = net.createServer((socket) => {
  // Handle connection
  socket.on('data',(req)=>{
    //socket.write("TEST RES: "+req.readInt32BE(0).toString(16))
    // const correlation_ID = 7;
    // const buff = Buffer.from([0, 0, 0, 0, 0, 0, 0, correlation_ID])
    const test = requestHeader(req);
    // const testArr = Array.from( test.correlation_id.toString(16) )
    // console.log("test array: " + testArr);
    // console.log(Buffer.from(test.correlation_id.toString(16),'hex'));
    // console.log("api VERSION!!!!!!!")
    // console.log(test.request_api_version)
    // console.log(parseInt("0x" + test.request_api_version.toString("hex")))
    try{
        console.log("length: " + req.length )
        if (req.length < 12) {
           // throw new Error("Received insufficient data for request header");
        }
    }
    catch(error)
    {
        console.error("Error handling client data:", error);
        const error_code = new Buffer.alloc(2)
        error_code.writeInt16BE(35)//error code 35
        const error_response = Buffer.concat([
            test.message_size,
            test.correlation_id,
            error_code
        ])
        console.log("ERROR!!!")
        console.log(error_response)
        //return socket.write(error_response)
    }
    if(![0,1,2,3,4].includes(parseInt("0x" + test.request_api_version.toString("hex")) )){//if(parseInt("0x" + test.request_api_version.toString("hex")) > 4){
        const error_code = new Buffer.alloc(2)
        error_code.writeInt16BE(35)//error code 35
        const error_response = Buffer.concat([
            test.message_size,
            test.correlation_id,
            error_code
        ])
        console.log("ERROR WRONG api VERSION!!! " + parseInt("0x" + test.request_api_version.toString("hex")) )
        console.log(error_response)
        return socket.write(error_response)
    }
    // console.log("api VERSION END!!!!!!!")
    // console.log("test.message_size")
    // console.log(test.message_size)
    //const responseBuffer = Buffer.from(
        
            //...Array.from(test.request_api_key.toString(16)),
            //...Array.from(test.request_api_version.toString(16)),
      //      test.correlation_id.toString(16)
            //...Array.from(test.correlation_id.toString(10)),
        
        //,'hex')//Buffer.from( test.request_api_key.toString()) + Buffer.from( test.request_api_version.toString()) + Buffer.from( test.correlation_id.toString())//Buffer.from([0,0,0,0,Buffer.from( test.correlation_id.toString())])
        //ønsket respons 0000001b 6f7fc661 0000020012000000040012000000040000000000000000
        
        // const api_keys = Buffer.concat([
        //     toBufferFromInt8(2), // Number of API keys (hardcoded to 2 for this example)
        //     toBufferFromInt16BE(apiKey),
        //     toBufferFromInt16BE(0), // Min version
        //     toBufferFromInt16BE(4), // Max version
        //     toBufferFromInt16BE(API_VERSIONS_KEY), // ApiVersions key
        //     toBufferFromInt16BE(0), // Min version for ApiVersions
        //     toBufferFromInt16BE(4), // Max version for ApiVersions
        //     NULL_TAG,
        // ]);
        
        
        const header = test.correlation_id//toBufferFromInt32BE(correlationId);
        const isValidApiVersion = 0 <= parseInt("0x" + test.request_api_version.toString("hex")) && parseInt("0x" + test.request_api_version.toString("hex")) <= 4;
        const errorCode = toBufferFromInt16BE(isValidApiVersion ? 0 : 35)//new Buffer.alloc(2).write(isValidApiVersion ? '0' : '35');//toBufferFromInt16BE(isValidApiVersion ? 0 : 35);
        console.log("API KEY")
        console.log(toBufferFromInt8(2))
        console.log("API KEY")
        const api_keys = Buffer.concat([
            toBufferFromInt8(2),//new Buffer.alloc(1).write('2'),//toBufferFromInt8(2), // Number of API keys (hardcoded to 2 for this example)
            test.request_api_key,//toBufferFromInt16BE(apiKey),
            toBufferFromInt16BE(0), // Min version
            toBufferFromInt16BE(4), // Max version
            toBufferFromInt16BE(API_VERSIONS_KEY), // ApiVersions key
            toBufferFromInt16BE(0), // Min version for ApiVersions
            toBufferFromInt16BE(4), // Max version for ApiVersions
            NULL_TAG,
        ]);
        console.log("API KEY END!!")
        const throttle_time_ms = toBufferFromInt32BE(0);
        const body = Buffer.concat([errorCode, api_keys, throttle_time_ms, NULL_TAG]);
        const response = Buffer.concat([header, body]);
        const responseSize = toBufferFromInt32BE(response.length);
        const responseBuffer = Buffer.concat([responseSize, response]);
        // const responseBuffer = Buffer.concat([
        //         test.message_size,
        //         test.request_api_key,
        //         test.request_api_version,
        //         test.correlation_id,
        //         new Buffer.alloc(1),
        //         new Buffer.alloc(1),
        //         // new Buffer.from('00','hex'),
        //         // new Buffer.from(test.request_api_key.toString(16),'hex'),
        //         // new Buffer.from('00','hex'),
        //         // new Buffer.from(test.request_api_version.toString(16),'hex'),
        //         // new Buffer.from(test.correlation_id.toString(16),'hex')
        //     ])
    // console.log("responsebuffer: ")
    // console.log(test.request_api_key.toString())
    // console.log(test.request_api_version.toString())
    // console.log(test.correlation_id.toString())
    // console.log(new Buffer.from('04','hex'))
    // console.log(new Buffer.from(test.request_api_version.toString(16)))
    // console.log("response buffer!!")
    //  console.log( responseBuffer)
    //  console.log("response buffer end!!")
    // console.log("responsebuffer end")
    // console.log(Buffer.from([test.correlation_id.toString()]))
    // console.log(test.correlation_id.toString(16) )
    // console.log(test.correlation_id.toString(10) )
    // console.log(test.correlation_id.toString() )
    // console.log(req)
     console.log(req.subarray(4, 12))
    //console.log(req.subarray(4, 12).toString())
    //console.log(test.message_size.toString(16) + test.correlation_id.toString(16) )
    console.log("BUFFER RESPONSE")
    console.log(test.message_size)
    console.log(test.request_api_key)
    console.log(test.request_api_version)
    console.log(test.correlation_id)
    console.log("BUFFER RESPONSE END !!!!!")
    console.log(responseBuffer)
    console.log( JSON.stringify(test) )
    //console.log(  )
    socket.write(responseBuffer)
  })
  //socket.write("hello world")
});
// server.
// server.on('connection',(connection)=>{
//     console.log('connected')
//     connection.on('data',(req, res)=>{
//         console.log(req.buffer.readUint)
//        //server.res("hello")
    
//     })
//     connection.on('')
// })
server.listen(9092, "127.0.0.1");