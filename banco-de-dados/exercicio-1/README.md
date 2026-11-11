# Exercise 1: Relational schema and inserts

## Objective

Practice PostgreSQL table creation, primary keys, foreign keys, inserts, and ordered queries using [exercicio-1.sql](exercicio-1.sql).

## Execution requirements

The script is intended for the first execution in an empty schema in the study database `orion_db`. It creates both tables and inserts the initial data in one transaction, then queries each table ordered by `id`.

The script does not reset existing data or hide unexpected state. Running it again against the same schema should fail because the tables already exist. Confirm the database and schema before execution.

The confirmed execution command, run from `banco-de-dados`, is:

```sh
docker compose exec -T db_postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1' < exercicio-1/exercicio-1.sql
```

## Schema

| Table | Column | Type | Constraint |
| --- | --- | --- | --- |
| cursos | id | INTEGER | Primary key |
| cursos | nome_curso | TEXT | NOT NULL |
| alunos | id | INTEGER | Primary key |
| alunos | nome | TEXT | NOT NULL |
| alunos | email | TEXT | NOT NULL |
| alunos | curso_id | INTEGER | NOT NULL, foreign key referencing cursos(id) |

A primary key (PK) uniquely identifies each row and cannot be null. A foreign key (FK) requires a referenced row to exist: every `alunos.curso_id` must match a `cursos.id`.

## Expected data

All IDs are explicit. Names and email addresses are fictitious.

| cursos.id | nome_curso | Expected student count |
| --- | --- | --- |
| 1 | Desenvolvimento Web | 2 |
| 2 | Ciência de Dados | 2 |
| 3 | Redes de Computadores | 0 |

| alunos.id | nome | email | curso_id |
| --- | --- | --- | --- |
| 1 | Maria Silva | maria.silva@example.com | 1 |
| 2 | João Santos | joao.santos@example.com | 1 |
| 3 | Ana Costa | ana.costa@example.com | 2 |
| 4 | Pedro Oliveira | pedro.oliveira@example.com | 2 |

Maria Silva starts in Desenvolvimento Web so exercise 2 can move her to Ciência de Dados. Redes de Computadores has no students so exercise 2 can query courses without enrollments.

## Acceptance criteria and verified results

- Tables `cursos` and `alunos` were created without errors.
- Three courses and four students were inserted with the IDs and relationships above.
- The final SELECT queries returned the expected data ordered by `id`.
- The foreign key `alunos.curso_id` references `cursos.id`.
- Both tables were also queried in pgAdmin, and the relationship was visually inspected in the foreign key properties.

## Separate foreign key test

The rejection test was executed separately from the main script, inside a transaction completed with `ROLLBACK`. It attempted to insert a student with `curso_id = 999`, which has no matching course. The expected result is a foreign key violation with SQLSTATE `23503`; PostgreSQL rejected the insertion with that code.

After the test, `alunos` still contained four students and zero records with `id = 999`. The main script contains no intentionally invalid insert.
