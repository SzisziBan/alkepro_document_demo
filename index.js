import constructJson from './constructJson.js';
import * as http from "node:http";


http.createServer(async function (req, res) {


    res.writeHead(200, {'Content-Type': 'application/json'});
    const data = await constructJson();
    res.end(data);
}).listen(8080);