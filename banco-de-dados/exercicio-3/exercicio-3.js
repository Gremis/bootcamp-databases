const database = db.getSiblingDB("orion_db");

if (database.getCollectionNames().includes("posts")) {
    throw new Error("Collection orion_db.posts already exists. Execution stopped without changing data.");
}

database.createCollection("posts");

database.posts.insertMany([
    {
        _id: 1,
        titulo: "Primeiros passos com MongoDB",
        autor: "Ana Costa",
        conteudo: "Hoje estudamos documentos e coleções."
    },
    {
        _id: 2,
        titulo: "Documentos com campos diferentes",
        autor: "Pedro Oliveira",
        conteudo: "Este texto apresenta um exemplo de esquema flexível.",
        tags: ["nosql", "flexivel"]
    }
]);

const documents = database.posts.find().sort({ _id: 1 }).toArray();

printjson(documents);

if (
    documents.length !== 2 ||
    documents[0]._id !== 1 ||
    documents[1]._id !== 2 ||
    Object.prototype.hasOwnProperty.call(documents[0], "tags") ||
    !Object.prototype.hasOwnProperty.call(documents[1], "tags") ||
    !Array.isArray(documents[1].tags) ||
    documents[1].tags.length !== 2 ||
    !documents[1].tags.every((tag) => typeof tag === "string") ||
    !documents[1].tags.includes("nosql") ||
    !documents[1].tags.includes("flexivel")
) {
    throw new Error("Unexpected posts data: expected exactly two documents, IDs 1 and 2, with tags only on document 2 containing nosql and flexivel.");
}
