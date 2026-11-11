import { createServer } from "node:http";
import { MongoClient } from "mongodb";
import { createHandler } from "./app.js";

const required = ["MONGO_DATABASE", "MONGO_INITDB_ROOT_USERNAME", "MONGO_INITDB_ROOT_PASSWORD"];
if (required.some((key) => !process.env[key]?.trim())) {
    console.error("Required MongoDB configuration is missing.");
    process.exit(1);
}

const client = new MongoClient("mongodb://db_mongo:27017", {
    auth: {
        username: process.env.MONGO_INITDB_ROOT_USERNAME,
        password: process.env.MONGO_INITDB_ROOT_PASSWORD
    },
    authSource: "admin",
    serverSelectionTimeoutMS: 3000,
    connectTimeoutMS: 3000,
    socketTimeoutMS: 5000,
    maxPoolSize: 5
});
const database = client.db(process.env.MONGO_DATABASE);
const store = {
    ping: () => database.command({ ping: 1 }),
    findPosts: (filter) => database.collection("posts")
        .find(filter, {
            projection: { _id: 1, titulo: 1, autor: 1, conteudo: 1, tags: 1, comentarios: 1 },
            maxTimeMS: 3000
        })
        .sort({ _id: 1 })
        .limit(100)
        .toArray()
};
const server = createServer(createHandler(store));
server.requestTimeout = 10000;

try {
    await client.connect();
    server.listen(3000, "0.0.0.0", () => console.log("Posts explorer listening on port 3000."));
} catch {
    console.error("MongoDB connection failed. Check the container configuration and database health.");
    await client.close();
    process.exit(1);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, () => {
        const deadline = setTimeout(() => process.exit(1), 8000);
        deadline.unref();
        server.close(async () => {
            await client.close();
            clearTimeout(deadline);
            process.exit(0);
        });
    });
}
