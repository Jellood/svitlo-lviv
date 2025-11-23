import httpServer from "http-server";

// Використовуємо порт із змінної середовища або дефолт 5500
const PORT = process.env.PORT || 5500;

const server = httpServer.createServer({ root: "." });

server.listen(PORT, (err) => {
    if (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
    console.log(`Server running at http://localhost:${PORT}`);
});
