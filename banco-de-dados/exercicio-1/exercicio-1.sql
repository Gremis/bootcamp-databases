BEGIN;

CREATE TABLE cursos (
    id INTEGER PRIMARY KEY,
    nome_curso TEXT NOT NULL
);

CREATE TABLE alunos (
    id INTEGER PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    curso_id INTEGER NOT NULL REFERENCES cursos(id)
);

INSERT INTO cursos (id, nome_curso) VALUES
    (1, 'Desenvolvimento Web'),
    (2, 'Ciência de Dados'),
    (3, 'Redes de Computadores');

INSERT INTO alunos (id, nome, email, curso_id) VALUES
    (1, 'Maria Silva', 'maria.silva@example.com', 1),
    (2, 'João Santos', 'joao.santos@example.com', 1),
    (3, 'Ana Costa', 'ana.costa@example.com', 2),
    (4, 'Pedro Oliveira', 'pedro.oliveira@example.com', 2);

COMMIT;

SELECT * FROM cursos ORDER BY id;

SELECT * FROM alunos ORDER BY id;
