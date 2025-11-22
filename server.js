import httpServer from "http-server";

const server = httpServer.createServer({ root: "." });

server.listen(5500, () => {
    console.log("Server running at http://localhost:5500");
});
