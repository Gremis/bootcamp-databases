# Exercise 2: Joins, filters, and updates

## Objective

Use [exercicio-2.sql](exercicio-2.sql) to query the relationship between `alunos` and `cursos`, filter students by course, and move Maria Silva to another course.

`INNER JOIN` combines rows whose course IDs match. `WHERE` filters rows by a condition. `UPDATE` changes existing rows; `RETURNING` displays the changed record. `LEFT JOIN` keeps all courses, including those without students; `WHERE alunos.id IS NULL` selects only courses with no matching student.

## Prerequisite

[Exercise 1](../exercicio-1/README.md) must have been executed with its original data in `orion_db`: three courses and four students, with Maria Silva (`id = 1`) enrolled in Desenvolvimento Web (`curso_id = 1`). This script uses the existing tables and data without recreating tables or inserting records.

## Execution

The script was executed from `banco-de-dados` with psql and `ON_ERROR_STOP=1`, without errors:

```sh
docker compose exec -T db_postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1' < exercicio-2/exercicio-2.sql
```

## Script order and expected results

1. The first INNER JOIN returns four students, ordered by student ID:

   | Student ID used for ordering | nome | nome_curso |
   | --- | --- | --- |
   | 1 | Maria Silva | Desenvolvimento Web |
   | 2 | João Santos | Desenvolvimento Web |
   | 3 | Ana Costa | Ciência de Dados |
   | 4 | Pedro Oliveira | Ciência de Dados |

2. The INNER JOIN with WHERE returns Maria Silva and João Santos, in that order, for Desenvolvimento Web.
3. The query for student ID 1 shows Maria Silva in course 1, Desenvolvimento Web, before the change.
4. A transaction updates only the row matching `id = 1 AND curso_id = 1`. RETURNING is expected to show ID 1, Maria Silva, `maria.silva@example.com`, and `curso_id = 2`. COMMIT saves the change.
5. The next JOIN shows Maria Silva in course 2, Ciência de Dados.
6. The LEFT JOIN returns course ID 3, Redes de Computadores, which remains without students. Results are ordered by course ID.

João Santos remains in course 1; Ana Costa and Pedro Oliveira remain in course 2. The foreign key continues to link `alunos.curso_id` to `cursos.id`.

## Reexecution

Reexecuting the file changes the initial query results because Maria's update has already been applied. The first JOIN shows Maria in Ciência de Dados, the Desenvolvimento Web filter returns only João, and the query before UPDATE already shows Maria in course 2. The guarded UPDATE then changes zero rows and RETURNING produces no record. The script does not automatically reset data.

## Completed validation

- [x] The script completed without errors using psql with `ON_ERROR_STOP=1`.
- [x] The initial INNER JOIN returned all four students with their correct courses.
- [x] Before UPDATE, the Desenvolvimento Web filter returned Maria Silva and João Santos.
- [x] Maria Silva, student ID 1, was initially in course 1, Desenvolvimento Web.
- [x] `UPDATE 1` confirmed that exactly one row was changed.
- [x] The transaction completed with `COMMIT`.
- [x] The next JOIN confirmed Maria in course 2, Ciência de Dados.
- [x] LEFT JOIN with `WHERE alunos.id IS NULL` returned only course 3, Redes de Computadores.
- [x] The JOIN, course filter, state after UPDATE, and course without students were also queried in pgAdmin and recorded in screenshots.

Script execution and the validation checks above are complete.
