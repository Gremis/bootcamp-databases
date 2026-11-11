SELECT aluno.nome, curso.nome_curso
FROM alunos AS aluno
INNER JOIN cursos AS curso ON aluno.curso_id = curso.id
ORDER BY aluno.id;

SELECT aluno.nome, curso.nome_curso
FROM alunos AS aluno
INNER JOIN cursos AS curso ON aluno.curso_id = curso.id
WHERE curso.nome_curso = 'Desenvolvimento Web'
ORDER BY aluno.id;

SELECT aluno.id, aluno.nome, aluno.curso_id, curso.nome_curso
FROM alunos AS aluno
INNER JOIN cursos AS curso ON aluno.curso_id = curso.id
WHERE aluno.id = 1;

BEGIN;

UPDATE alunos
SET curso_id = 2
WHERE id = 1 AND curso_id = 1
RETURNING id, nome, email, curso_id;

COMMIT;

SELECT aluno.id, aluno.nome, aluno.curso_id, curso.nome_curso
FROM alunos AS aluno
INNER JOIN cursos AS curso ON aluno.curso_id = curso.id
WHERE aluno.id = 1;

SELECT cursos.id, cursos.nome_curso
FROM cursos
LEFT JOIN alunos ON cursos.id = alunos.curso_id
WHERE alunos.id IS NULL
ORDER BY cursos.id;
