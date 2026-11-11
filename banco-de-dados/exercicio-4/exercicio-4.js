const database = db.getSiblingDB("orion_db");
const posts = database.getCollection("posts");
const expectedFirst = {
    _id: 1,
    titulo: "Primeiros passos com MongoDB",
    autor: "Ana Costa",
    conteudo: "Hoje estudamos documentos e coleções."
};
const expectedSecond = {
    _id: 2,
    titulo: "Documentos com campos diferentes",
    autor: "Pedro Oliveira",
    conteudo: "Este texto apresenta um exemplo de esquema flexível.",
    tags: ["nosql", "flexivel"]
};
const expectedComments = [
    { autor: "Maria Silva", texto: "Gostei do exemplo de documentos." },
    { autor: "João Santos", texto: "As tags ajudam a organizar os textos." }
];

function matchesDocument(actual, expected, ignoredFields = []) {
    if (!actual) {
        return false;
    }
    const fields = Object.keys(actual).filter((field) => !ignoredFields.includes(field));
    return fields.length === Object.keys(expected).length &&
        Object.keys(expected).every((field) =>
            Object.prototype.hasOwnProperty.call(actual, field) &&
            JSON.stringify(actual[field]) === JSON.stringify(expected[field])
        );
}

const initialDocuments = posts.find().sort({ _id: 1 }).toArray();

if (
    initialDocuments.length !== 2 ||
    !matchesDocument(initialDocuments[0], expectedFirst) ||
    !matchesDocument(initialDocuments[1], expectedSecond, ["comentarios"])
) {
    throw new Error("Prerequisites failed: expected the two exercise 3 posts with unchanged original fields. No data was written.");
}

const updateResult = posts.updateOne(
    { _id: 2 },
    { $set: { comentarios: expectedComments } }
);

print("Update result");
printjson({
    acknowledged: updateResult.acknowledged,
    matchedCount: updateResult.matchedCount,
    modifiedCount: updateResult.modifiedCount
});

if (
    updateResult.acknowledged !== true ||
    updateResult.matchedCount !== 1 ||
    ![0, 1].includes(updateResult.modifiedCount)
) {
    throw new Error("Update failed: expected one acknowledged matching post and zero or one modified post.");
}

function printAndCheck(title, filter, expectedIds) {
    const documents = posts.find(filter).sort({ _id: 1 }).toArray();
    print(title);
    printjson(documents);
    if (JSON.stringify(documents.map((document) => document._id)) !== JSON.stringify(expectedIds)) {
        throw new Error("Unexpected result IDs for: " + title);
    }
}

printAndCheck("Updated post", { _id: 2 }, [2]);
printAndCheck("Posts tagged nosql", { tags: "nosql" }, [2]);
printAndCheck("Posts by Ana Costa", { autor: "Ana Costa" }, [1]);
printAndCheck("Comments by Maria Silva", { "comentarios.autor": "Maria Silva" }, [2]);

const finalDocuments = posts.find().sort({ _id: 1 }).toArray();

if (
    finalDocuments.length !== 2 ||
    !matchesDocument(finalDocuments[0], expectedFirst) ||
    !matchesDocument(finalDocuments[1], {
        ...expectedSecond,
        comentarios: expectedComments
    })
) {
    throw new Error("Final validation failed: expected two posts, unchanged post 1, and post 2 with original fields and the two expected comments.");
}
