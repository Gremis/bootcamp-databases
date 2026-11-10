# Exercise 4: MongoDB updates and queries

## Scope and prerequisites

This stage prepares only the MongoDB portion of exercise 4 in [exercicio-4.js](exercicio-4.js). It adds nested comments to a post and queries fields, arrays, and nested documents. Exercise 4 is not complete: API/interface work and independent development/production environments are later stages and have not been implemented.

[Exercise 3](../exercicio-3/README.md) must have created `orion_db.posts` with exactly its two expected documents. MongoDB and mongosh must be available with authorization to read and update that collection. The script explicitly selects `orion_db` using `db.getSiblingDB`.

Before writing, the script checks both document IDs, their original fields and values, and the collection's two-document count. Post 1 must have neither `tags` nor `comentarios`. Post 2 must retain its original tags; an existing `comentarios` field is allowed for reexecution. Missing documents, unexpected original fields, or changed original values stop execution with an error before any write. The script does not create or remove documents.

## Execution

The script was executed with mongosh from `banco-de-dados`, without errors:

```sh
docker compose exec -T db_mongo sh -c 'mongosh --quiet --host 127.0.0.1 --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --file /dev/stdin' < exercicio-4/exercicio-4.js
```

## Update and queries

`updateOne` updates one matching document. `$set` assigns a field's value; here it deterministically assigns the complete `comentarios` array to post ID 2 without changing its other fields. No upsert is used.

The expected array is:

```json
[
  { "autor": "Maria Silva", "texto": "Gostei do exemplo de documentos." },
  { "autor": "João Santos", "texto": "As tags ajudam a organizar os textos." }
]
```

The script prints `acknowledged`, `matchedCount`, and `modifiedCount`. It requires an acknowledged update and exactly one matched document. On the first execution, one document is expected to change.

An equality filter on an array field, such as `{ tags: "nosql" }`, matches documents containing that element. Dot notation, such as `{ "comentarios.autor": "Maria Silva" }`, queries a field inside the documents contained in the comments array.

| Query, in execution order | Expected IDs | Expected result |
| --- | --- | --- |
| Updated post, `_id: 2` | 2 | Post with both comments |
| `tags: "nosql"` | 2 | Post tagged nosql |
| `autor: "Ana Costa"` | 1 | Post authored by Ana Costa |
| `"comentarios.autor": "Maria Silva"` | 2 | Post containing Maria's comment |

Each query materializes its results, sorts by `_id`, and prints an English title followed by `printjson` output. Unexpected IDs raise an error. Final validation requires exactly two documents, unchanged post 1, and post 2 with all original fields plus the expected comments.

## Reexecution

Reexecution assigns the same comments array rather than appending duplicates. `matchedCount` must remain 1; `modifiedCount = 0` is accepted when the values are already identical. Existing comments on post 2 are replaced by the expected array. Post 1 and the other fields of post 2 remain unchanged. There is no automatic reset or extra insertion.

Reexecution has not been tested. The behavior above describes the script's implementation.

## MongoDB validation status

- [x] `exercicio-4.js` completed with mongosh without errors.
- [x] `updateOne` with `$set` added the two expected comments to post 2.
- [x] The update returned `acknowledged: true`, `matchedCount: 1`, and `modifiedCount: 1`.
- [x] The `tags: "nosql"` query returned only post 2.
- [x] The `autor: "Ana Costa"` query returned only post 1.
- [x] The `"comentarios.autor": "Maria Silva"` query returned only post 2.
- [x] Final script validations passed: the collection retained exactly two documents, post 1 remained unchanged without tags or comments, and post 2 retained its original fields and tags alongside the two expected comments.
- [x] The updated post and all three filters were also queried in MongoDB Compass.
- [x] Original terminal and Compass screenshots were recorded.
- [ ] Verify reexecution preserves the expected data and accepts zero modified documents.

Initial MongoDB execution and result validation are complete. Reexecution validation remains pending. API/interface work and development/production environments are later stages that remain unimplemented; exercise 4 as a whole is not complete.
