# Local databases

This directory provides PostgreSQL and MongoDB infrastructure for local study.

## Exercises

- [Exercise 1: Relational schema and inserts](exercicio-1/README.md)
- [Exercise 2: Joins, filters, and updates](exercicio-2/README.md)

## Prerequisites

Use Docker Desktop for Mac with Docker Compose v2 and a running Docker engine. Ports 5432 and 27017 must be available. The images support Intel and Apple Silicon Macs through Linux containers.

## Setup from the repository root

Copy the fictitious study credentials into the local environment file:

```sh
cp banco-de-dados/.env.example banco-de-dados/.env
```

The repository ignores `.env` and allows `.env.example`. Keep real credentials out of version control. The example credentials are only for local study.

Run the following commands from the repository root to validate configuration without printing resolved credentials, then start the services:

```sh
docker compose --env-file banco-de-dados/.env -f banco-de-dados/docker-compose.yml config --quiet
docker compose --env-file banco-de-dados/.env -f banco-de-dados/docker-compose.yml up -d
```

All five environment variables are required and must be nonempty. Compose uses the explicit environment file for interpolation; exported shell variables take precedence.

## Status and logs

```sh
docker compose --env-file banco-de-dados/.env -f banco-de-dados/docker-compose.yml ps
docker compose --env-file banco-de-dados/.env -f banco-de-dados/docker-compose.yml logs --tail=100 db_postgres db_mongo
```

Wait for both services to become healthy before connecting. PostgreSQL checks readiness with the configured user and database. MongoDB checks an authenticated ping and returns a nonzero exit code on failure. Its healthcheck suppresses output to avoid exposing credentials in health results.

## Connections

| Database | From the Mac | From containers on the project network | Working database | User variable |
| --- | --- | --- | --- | --- |
| PostgreSQL | `localhost:5432` | `db_postgres:5432` | `POSTGRES_DB` (`orion_db` in the example) | `POSTGRES_USER` |
| MongoDB | `localhost:27017` | `db_mongo:27017` | `orion_db` | `MONGO_INITDB_ROOT_USERNAME` |

Use the corresponding password from your local environment file in your database client. Published ports bind only to `127.0.0.1`. Inside a container, `localhost` refers to that container; use the service names to reach the databases over `orion_network`.

The MongoDB root user authenticates against `admin`: set `authSource=admin` in a client URI or `--authenticationDatabase admin` in mongosh. The exercises will use `orion_db` as the working database. MongoDB creates that database on the first write; this infrastructure does not create exercise collections or data.

## Persistence and shutdown

```sh
docker compose --env-file banco-de-dados/.env -f banco-de-dados/docker-compose.yml down
```

The named volumes retain data after `down`: `postgres_data` mounts at `/var/lib/postgresql/data`, and `mongo_data` mounts at `/data/db`. Compose automatically prefixes the volumes and network with the project name, producing `orion-databases_postgres_data`, `orion-databases_mongo_data`, and `orion-databases_orion_network`.

Initialization credentials apply only to empty data directories. Editing the environment file does not update users or passwords in existing databases.

To delete the stored database data intentionally:

```sh
docker compose --env-file banco-de-dados/.env -f banco-de-dados/docker-compose.yml down -v
```

`down -v` deletes the database volumes and their data. The next startup initializes fresh databases.

## Images and reference changes

PostgreSQL keeps `postgres:16-alpine` from the supplied Compose. MongoDB uses the explicit stable release `mongo:8.0.34` instead of `latest`. The [Docker Official Images manifest](https://github.com/docker-library/official-images/blob/master/library/mongo) lists this tag with `arm64v8` support (`linux/arm64`). The [official image documentation](https://hub.docker.com/_/mongo) documents the included mongosh client and `/data/db` persistence path. The [8.0 image Dockerfile](https://github.com/docker-library/mongo/blob/ea5191cbb2fe8958dc3e8dd0364b6d1f0d1b61a1/8.0/Dockerfile) also declares that data path.

Compared with the supplied Compose, this configuration adds the project name, requires environment interpolation, restricts published ports to loopback, updates both healthchecks, and removes fixed container names and the obsolete `version` key. Service names, named volumes, network, drivers, and healthcheck timing are preserved. Resource names retain Compose's automatic project prefix.

## Optional pgAdmin

pgAdmin is an auxiliary visualization tool, optional for the two-database stack. The auxiliary container used image `dpage/pgadmin4:9.19.0`, joined `orion-databases_orion_network`, and published its interface only at `127.0.0.1:8080`. It is managed separately and is not included in this Compose file.

Register PostgreSQL with host `db_postgres`, port `5432`, and database `orion_db`. Use the locally configured credentials without storing passwords in commands or version control.

Stop the auxiliary container before running `docker compose down` to remove the project network. A stopped container can still retain a network attachment; remove the auxiliary container or disconnect it from the network before network removal.

## Verified results and remaining validation

- `docker compose config --quiet` passed.
- PostgreSQL and MongoDB started and became healthy.
- PostgreSQL was queried through psql inside its container and reported database `orion_db` and user `orion_user`.
- MongoDB returned `ok: 1` for an authenticated ping.
- pgAdmin also connected to PostgreSQL over the Docker network using hostname `db_postgres`.
- Local credentials are stored in the Git-ignored `.env` file.

Connections through the Mac's published database ports and persistence after container recreation were not tested in this activity.
