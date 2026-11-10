# Exercise 3: Documents and flexible schemas

## Objective

Use [exercicio-3.js](exercicio-3.js) to create the `posts` collection and insert two blog documents with different fields in MongoDB database `orion_db`.

A document stores fields and their values. A collection groups documents. A flexible schema allows documents in the same collection to have different fields, such as `tags` appearing in only one document. This flexibility does not prevent the database from enforcing validation rules when configured.

## Prerequisites and first execution

MongoDB must be available, with mongosh and credentials authorized to inspect and create collections and read and write documents in `orion_db`. The infrastructure's root user authenticates against `admin`; the script explicitly selects the working database with `db.getSiblingDB("orion_db")`.

The `posts` collection must not exist before the first execution, even as an empty collection. Exercises 1 and 2 use PostgreSQL and are independent of this MongoDB exercise.

## Execution

The script was executed with mongosh from `banco-de-dados`, without errors:

```sh
docker compose exec -T db_mongo sh -c 'mongosh --quiet --host 127.0.0.1 --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --file /dev/stdin' < exercicio-3/exercicio-3.js
```

## Expected documents

The script explicitly creates `posts` and uses one `insertMany` call to insert exactly these two documents:

| Field | Document 1 | Document 2 |
| --- | --- | --- |
| _id | 1 | 2 |
| titulo | Primeiros passos com MongoDB | Documentos com campos diferentes |
| autor | Ana Costa | Pedro Oliveira |
| conteudo | Hoje estudamos documentos e coleções. | Este texto apresenta um exemplo de esquema flexível. |
| tags | Field absent | `["nosql", "flexivel"]` |

The names and texts are fictitious. Document 1 has exactly `_id`, `titulo`, `autor`, and `conteudo`: it has no `tags` field, including no null or empty array placeholder. Document 2 adds the string array `tags`. Neither document includes `comentarios`; that field is reserved for exercise 4.

The final `find().sort({ _id: 1 })` query is materialized with `toArray()` and printed with `printjson` so both documents appear when the script runs as a file. The script checks that there are exactly two documents with IDs 1 and 2 and that only document 2 has the expected tags. A mismatch raises an error.

## Reexecution and data preservation

Before any write, the script checks whether `posts` already exists. If it does, execution stops with a clear error without modifying or deleting data. Reexecution therefore preserves the existing collection. There is no automatic reset or cleanup, including after a partial failure; inspect any failure before deciding how to proceed.

The protection against reexecution was tested at runtime in isolated temporary development and production MongoDB instances. Reexecution failed with a nonzero exit code and the message `Collection orion_db.posts already exists. Execution stopped without changing data.` The collection data fingerprint remained identical before and after the rejected attempt. The original infrastructure and existing exercise environments were not used for this write-capable test.

## Validation status

- [x] The script completed with mongosh without errors and created `orion_db.posts`.
- [x] Exactly two documents were inserted, with IDs 1 and 2.
- [x] Document 1 contains `titulo`, `autor`, and `conteudo`, with no `tags` field.
- [x] Document 2 contains the same fields and `tags: ["nosql", "flexivel"]`.
- [x] `find().sort({ _id: 1 }).toArray()` returned both documents ordered by `_id`.
- [x] The script's internal checks passed.
- [x] Both documents were also queried in MongoDB Compass, connected to the local MongoDB instance through port `27017`.
- [x] Terminal and Compass screenshots were recorded.
- [x] The protection against reexecution was inspected in the code.
- [x] Runtime reexecution stopped before writing in both temporary instances and preserved the existing document fingerprints.

Initial execution, document validation, and runtime validation of the reexecution protection are complete. The temporary database resources were removed after testing; existing database data was preserved.
