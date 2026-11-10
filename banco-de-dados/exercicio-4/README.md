# Exercise 4: MongoDB updates and queries

## Scope and prerequisites

The MongoDB script [exercicio-4.js](exercicio-4.js) adds nested comments to a post and queries fields, arrays, and nested documents. This directory also provides a read-only API, a responsive posts viewer, and separate Docker development and local production environments. The mandatory PDF requirements and additional validation checks have been completed as recorded below. API/interface features are optional complements. Destructive lifecycle and write-capable tests used isolated temporary projects; existing database data was preserved. The local-production storage and network limitations remain documented.

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

Reexecution was tested in isolated temporary development and production MongoDB instances. Both returned `acknowledged: true`, `matchedCount: 1`, and `modifiedCount: 0`. Each collection retained two posts, exactly two comments on post 2, and the same document fingerprint. No existing environment was modified for this test.

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
- [x] Reexecution in both temporary instances preserved the expected data and returned zero modified documents without duplicating comments.

Initial MongoDB execution, result validation, and temporary-instance reexecution validation are complete. The application and Docker environments described below have completed the runtime and interface checks recorded in the validation results.

## PDF requirements and implementation

| Challenge requirement | Implementation |
| --- | --- |
| Add comments using updateOne | Existing validated `exercicio-4.js`, preserved unchanged |
| Query tags and authors | Existing script plus the read-only API and interface |
| Development Compose with local mounts, ports, and development Dockerfile | `docker-compose.dev.yml`, source/public bind mounts, port 3001, `Dockerfile.dev` |
| Production Compose using an optimized final image without declared mounts | `docker-compose.prod.yml`, multistage `Dockerfile`, port 3002 |
| Independent environments | Distinct Compose projects, networks, MongoDB instances, storage, and app image tags |
| Optimized layers, small runtime, and .dockerignore | Alpine Node.js 24 runtime, cached dependency layer, production dependencies, non-root user, allowlisted build context |
| Validate both environments | Recorded results and remaining checklist below |

The API/interface is an optional complement to the PDF's explicit database and Docker requirements. No frontend framework, external assets, or separate frontend service is needed. The production build checks JavaScript syntax and assembles runtime files; this application does not need transpilation. Production declares no mounts in Compose; the MongoDB image's anonymous volumes are explained separately below.

The MongoDB driver is pinned directly to version `7.0.0`, and `app/package-lock.json` records the resolved dependency versions and integrity hashes. The lockfile was generated in a temporary `node:24-alpine` container mounting only `app`, using `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`. No local node_modules directory was created. Both Dockerfiles copy the package manifest and lockfile before installing dependencies with `npm ci`; production additionally uses `--omit=dev`. Dependency installation happens only inside Docker build stages.

Git ignores `.env.dev` and `.env.prod` while allowing `.env.example`. The allowlisted build context excludes all environment files, including the example, because configuration belongs at runtime. The example remains available in the repository for local setup. The lockfile is included in the build context.

## Application

The `app` service serves both the interface and API on container port 3000. Source changes restart the development server through Node.js watch mode; public assets are read from the mounted files on each request. Reload the browser after editing assets. Dependency changes require an image rebuild; dependencies remain in the image rather than a stale mounted node_modules directory.

| Endpoint | Behavior |
| --- | --- |
| `GET /` | Responsive posts viewer with tags, comments, filters, loading, empty, and error states |
| `GET /health` | MongoDB ping; returns 200 when available and 503 otherwise |
| `GET /api/posts` | Up to 100 posts ordered by `_id` |
| `GET /api/posts?tag=nosql` | Exact array element filter |
| `GET /api/posts?autor=Ana%20Costa` | Exact post author filter |
| `GET /api/posts?comentarioAutor=Maria%20Silva` | Exact nested comment author filter |

Filters can be combined with AND semantics. Each accepts one plain text value up to 120 characters; values are trimmed, blank filters omitted, and unsupported or repeated parameters rejected with 400. Filters are case-sensitive. Write methods return 405. No endpoint inserts, updates, deletes, or initializes data. An empty database returns an empty list until scripts are loaded explicitly.

Only known static assets and post fields are returned. Credentials are supplied at container runtime, never embedded in images, sent to the browser, or included in API errors. The local study application uses the configured MongoDB root account; its HTTP API exposes only reads. This is a local demonstration, not an internet deployment with application authentication or a restricted database account.

## Environment isolation and storage

| Resource | Development | Local production |
| --- | --- | --- |
| Compose file | `docker-compose.dev.yml` | `docker-compose.prod.yml` |
| Project | `orion-ex4-dev` | `orion-ex4-prod` |
| App image | `orion-ex4-app:dev` | `orion-ex4-app:prod` |
| Mac URL | `http://127.0.0.1:3001` | `http://127.0.0.1:3002` |
| Network | `orion-ex4-dev_app_network` | `orion-ex4-prod_app_network` |
| MongoDB | `db_mongo:27017`, database `orion_db` | `db_mongo:27017`, database `orion_db` |
| Declared mounts | Read-only local `app/src` and `app/public`; named MongoDB volumes | None |

Both Compose files are standalone: use each with its own environment file, without combining them or overriding project names. Neither joins `orion-databases_orion_network` or uses its volumes. Identical service and database names resolve within separate networks. Neither new MongoDB publishes a port on the Mac; inspect them through their own Compose service. The existing infrastructure and its data are untouched.

Runtime inspection confirmed that all established MongoDB sockets in each existing app pointed only to its own MongoDB, and direct TCP probes between development and production MongoDB networks were blocked in both directions. A reversible marker written only to temporary development appeared only in its app, while temporary production retained its own data. This verifies application data separation, not a universal firewall: TCP probes from the exercise 4 app networks could reach the original infrastructure's published MongoDB by its container IP. Those probes performed no authentication or database writes. The original infrastructure's network and publication settings were preserved.

Development uses `orion-ex4-dev_mongo_data` at `/data/db` and `orion-ex4-dev_mongo_config` at `/data/configdb`. These named volumes survive ordinary `down`. Initialization credentials apply only to empty data directories; changing the environment file does not change existing users.

Production declares no mounts in Compose. However, the [official MongoDB image Dockerfile](https://github.com/docker-library/mongo/blob/ea5191cbb2fe8958dc3e8dd0364b6d1f0d1b61a1/8.0/Dockerfile) declares `VOLUME /data/db /data/configdb`, so Docker creates anonymous volumes. They are separate from all named development and existing infrastructure volumes. In an isolated temporary production project, `up --force-recreate` reused both anonymous volumes and retained identical document data. After `down` without `-v`, those volumes still existed; a subsequent `up` allocated different anonymous volumes and the collection had zero posts. Production here is disposable: do not rely on data surviving removal and later startup, and do not treat it as a durable deployment. No automatic cleanup, reset, or seeding is configured. The existing production project and its anonymous volumes were not recreated or removed during this test.

## Configure from the repository root

Docker Desktop with Compose v2 must be available, with ports 3001 and 3002 free. No Node.js installation is needed on the Mac; dependency installation and the production build occur inside Docker.

```sh
cd banco-de-dados/exercicio-4
cp -n .env.example .env.dev
cp -n .env.example .env.prod
```

All remaining commands run from `banco-de-dados/exercicio-4`. The copy commands preserve existing environment files. Use fictitious credentials only for local study. `.env.dev` and `.env.prod` are ignored by the existing Git rules; `.env.example` is allowed. Set `MONGO_DATABASE=orion_db` to match the preserved scripts. Both credential variables and the database variable are mandatory. Exported shell variables take precedence over environment files. Do not print resolved configuration containing passwords.

## Start and inspect development

```sh
docker compose --env-file .env.dev -f docker-compose.dev.yml config --quiet
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d --build --wait
docker compose --env-file .env.dev -f docker-compose.dev.yml ps
docker compose --env-file .env.dev -f docker-compose.dev.yml logs --tail=100 app db_mongo
```

MongoDB has an authenticated ping healthcheck. The application waits for MongoDB health and has its own HTTP healthcheck that includes database connectivity. Check both services are healthy before loading data.

For a fresh development MongoDB, explicitly load exercise 3 first, then exercise 4:

```sh
docker compose --env-file .env.dev -f docker-compose.dev.yml exec -T db_mongo sh -c 'mongosh --quiet --host 127.0.0.1 --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --file /dev/stdin' < ../exercicio-3/exercicio-3.js
docker compose --env-file .env.dev -f docker-compose.dev.yml exec -T db_mongo sh -c 'mongosh --quiet --host 127.0.0.1 --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --file /dev/stdin' < exercicio-4.js
```

## Start and inspect local production

```sh
docker compose --env-file .env.prod -f docker-compose.prod.yml config --quiet
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build --wait
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=100 app db_mongo
```

The final `production` stage contains only the application runtime files and production dependencies. It runs as the unprivileged `node` user with no source mounts. No credential build arguments or environment files are copied into either app image.

For a fresh production MongoDB, load the same scripts into its separate database:

```sh
docker compose --env-file .env.prod -f docker-compose.prod.yml exec -T db_mongo sh -c 'mongosh --quiet --host 127.0.0.1 --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --file /dev/stdin' < ../exercicio-3/exercicio-3.js
docker compose --env-file .env.prod -f docker-compose.prod.yml exec -T db_mongo sh -c 'mongosh --quiet --host 127.0.0.1 --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --file /dev/stdin' < exercicio-4.js
```

Exercise 3 must only run when `posts` is absent; otherwise it stops to preserve data. Stop on any script error and inspect the intended environment. Do not rerun it to reset an existing collection. Exercise 4's deterministic reexecution behavior remains as described above. Neither script runs automatically at container startup.

## Validate HTTP and interface behavior

After loading each environment, run the following against both ports:

```sh
curl --fail-with-body http://127.0.0.1:3001/health
curl --fail-with-body http://127.0.0.1:3001/api/posts
curl --fail-with-body 'http://127.0.0.1:3001/api/posts?tag=nosql'
curl --fail-with-body 'http://127.0.0.1:3001/api/posts?autor=Ana%20Costa'
curl --fail-with-body 'http://127.0.0.1:3001/api/posts?comentarioAutor=Maria%20Silva'
curl --fail-with-body http://127.0.0.1:3002/health
curl --fail-with-body http://127.0.0.1:3002/api/posts
curl --fail-with-body 'http://127.0.0.1:3002/api/posts?tag=nosql'
curl --fail-with-body 'http://127.0.0.1:3002/api/posts?autor=Ana%20Costa'
curl --fail-with-body 'http://127.0.0.1:3002/api/posts?comentarioAutor=Maria%20Silva'
```

Expect two posts without filters, only post 2 for `nosql`, only post 1 for Ana Costa, and only post 2 for Maria Silva's comment. Open each Mac URL to check the interface, combined filters, clearing filters, mobile layout, and keyboard navigation. A filter with no match should show the empty state. No credentials should appear in browser responses or assets.

The API handler also has dependency-free tests using an in-memory store rather than MongoDB. They can be rerun inside the development image without installing dependencies on the Mac; the command temporarily mounts only the test files:

```sh
docker compose --env-file .env.dev -f docker-compose.dev.yml run --rm --no-deps -v "$PWD/app/test:/app/test:ro" app node --test 'test/*.test.js'
```

## Shutdown

```sh
docker compose --env-file .env.dev -f docker-compose.dev.yml down
docker compose --env-file .env.prod -f docker-compose.prod.yml down
```

Each command targets only its own project. Development named volumes remain. Production data has the disposable anonymous-volume lifecycle explained above. No command here removes the original infrastructure's volumes or runs the existing scripts against its MongoDB.

## Implementation checks

Seven handler tests passed using an in-memory store, covering filter mapping, input rejection, write-method rejection, empty results, database-error sanitization, health responses, and static asset restrictions. They were also rerun successfully inside the temporary development image using Node.js 24.22.2. JavaScript syntax, YAML parsing and structural assertions, HTML label associations, production file assembly in a temporary directory, environment ignore rules, and whitespace were checked separately. No dependencies were installed on the Mac.

## Validated mandatory PDF requirements

- [x] The script adds nested comments with `updateOne` and returns the expected tag and author query results, as recorded in the MongoDB validation status.
- [x] Static review confirmed development's local source mounts, published app port, and use of `Dockerfile.dev`.
- [x] Static review confirmed production's multistage build, production dependencies, non-root runtime user, `.dockerignore`, and absence of Compose-declared mounts.
- [x] Development and production image builds completed.
- [x] Both environments ran simultaneously with healthy services.
- [x] Exercise 3 and exercise 4 scripts executed successfully in each environment's MongoDB.
- [x] Production continued working while development was stopped.
- [x] Development continued working while production was stopped, including a query by comment author.

Static review and direct runtime inspection confirmed distinct project names, networks, and MongoDB storage configuration. The independent-operation checks above demonstrate that stopping either environment did not interrupt the other. Application connection inspection and the temporary marker test are described in the network scope and validation results.

## Completed supporting and optional checks

- [x] Development configuration validation passed: `docker compose --env-file .env.dev -f docker-compose.dev.yml config --quiet`.
- [x] Production configuration validation passed: `docker compose --env-file .env.prod -f docker-compose.prod.yml config --quiet`.
- [x] The optional development interface was validated with individual filters for tag, post author, and comment author.
- [x] Generate and inspect the repository lockfile in a temporary Node.js 24 container without local node_modules, then switch Dockerfiles to `npm ci`.

Recorded evidence filenames:

- `database-exercicio-4-dev-prod-healthy.png`
- `database-exercicio-4-prod-funcionando-dev-parado.png`
- `database-exercicio-4-dev-funcionando-prod-parado.png`

## Additional validation results

- [x] Verify HTTP results and all three filters on both ports. Ports 3001 and 3002 returned HTTP 200 for health and expected IDs: all posts `[1, 2]`, tag `nosql` `[2]`, author Ana Costa `[1]`, and comment author Maria Silva `[2]`. All three compatible filters together returned `[2]`; incompatible filters and a nonexistent tag returned `[]`. Clearing filter values restored `[1, 2]`. Duplicate parameters returned 400 and POST returned 405.
- [x] Verify the responsive interface, keyboard access, empty state, and unavailable-service state. Headless Chrome validated both existing interfaces at widths 390 and 320 pixels, with a single-column layout and no horizontal overflow. Individual and combined filters, the empty message, and Clear filters worked. Tab order covered the three inputs and both buttons; focus was visible, and Enter submitted a filter. Stopping only temporary development's MongoDB produced API HTTP 503 and the browser message `Service temporarily unavailable. Try again shortly.`, without stale cards. Restarting it restored HTTP 200.
- [x] Verify source reload in development and production execution as a non-root user. Changing only the temporary development source copy changed its health response without a rebuild or manual restart. The copy was restored byte-for-byte and the original response returned. Existing production's effective UID was 1000, and its configured user was `node`.
- [x] Verify each app's actual MongoDB connection target. Established MongoDB sockets in each existing app pointed exclusively to the MongoDB IP in its own project network. The temporary marker test confirmed independent data reads. The original published MongoDB's TCP reachability remains a network limitation explicitly documented above.
- [x] Inspect runtime MongoDB port publication and container mounts. Both existing MongoDB containers had no host port bindings. The existing development app had exactly the two read-only source/public bind mounts, and its MongoDB had project-prefixed named volumes. The existing production app had no mounts, while its MongoDB had two anonymous image-declared volumes at `/data/db` and `/data/configdb`; production Compose declares no mounts.
- [x] Verify development data survives recreation and document production's disposable lifecycle. A temporary replica using the development Compose configuration retained the same named volumes and identical data after forced container recreation. The temporary production lifecycle result is recorded in the storage section. No existing volumes were deleted.

The additional validation checklist is complete for the stated local-study scope. Production retains its disposable anonymous-volume lifecycle, API/interface features remain optional complements, and application data separation does not imply a firewall against the original published MongoDB. Existing database fingerprints and repository application-source hashes were compared after testing. Temporary source changes were restored, and only validation-created projects and their volumes were removed.

Browser evidence was saved outside the repository under `/private/tmp/orion-validation-20261110/`: `mobile-3001.png`, `mobile-3002.png`, and `service-unavailable.png`. The earlier recorded evidence filenames above remain unchanged. No screenshots or credentials were added to the repository.
