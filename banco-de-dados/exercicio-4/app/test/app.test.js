import test from "node:test";
import assert from "node:assert/strict";
import { createHandler, parseFilters } from "../src/app.js";

async function request(store, url, method = "GET") {
    const response = {
        headers: {},
        setHeader(key, value) { this.headers[key] = value; },
        writeHead(status, headers) { this.status = status; Object.assign(this.headers, headers); },
        end(body) { this.body = body.toString(); }
    };
    await createHandler(store)({ url, method }, response);
    return response;
}

test("filters combine exact strings and map nested author fields", () => {
    assert.deepEqual(parseFilters(new URLSearchParams("tag=nosql&autor=Ana+Costa&comentarioAutor=Maria+Silva")), {
        tags: "nosql", autor: "Ana Costa", "comentarios.autor": "Maria Silva"
    });
});

test("operators are never interpreted from filter values", () => {
    assert.deepEqual(parseFilters(new URLSearchParams('tag={"$ne":null}')), { tags: '{"$ne":null}' });
    for (const query of ["tag[$ne]=x", "tag=a&tag=b", `autor=${"a".repeat(121)}`]) {
        assert.throws(() => parseFilters(new URLSearchParams(query)));
    }
});

test("API returns store data and handles empty results", async () => {
    for (const posts of [[{ _id: 2, titulo: "Sample" }], []]) {
        const response = await request({ findPosts: async (filter) => {
            assert.deepEqual(filter, { tags: "nosql" });
            return posts;
        } }, "/api/posts?tag=nosql");
        assert.equal(response.status, 200);
        assert.deepEqual(JSON.parse(response.body), { posts, count: posts.length, limit: 100 });
    }
});

test("write methods and invalid filters never reach the store", async () => {
    const store = { findPosts: () => assert.fail("Store must not be called") };
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
        const response = await request(store, "/api/posts", method);
        assert.equal(response.status, 405);
        assert.equal(response.headers.Allow, "GET");
    }
    assert.equal((await request(store, "/api/posts?tag[$ne]=x")).status, 400);
});

test("health reflects database availability without exposing driver errors", async () => {
    const healthy = await request({ ping: async () => ({ ok: 1 }) }, "/health");
    assert.equal(healthy.status, 200);
    const unavailable = await request({ ping: async () => { throw new Error("private connection details"); } }, "/health");
    assert.equal(unavailable.status, 503);
    assert.equal(unavailable.body.includes("private"), false);
});

test("database query errors are sanitized", async () => {
    const response = await request({ findPosts: async () => { throw new Error("secret"); } }, "/api/posts");
    assert.equal(response.status, 503);
    assert.equal(response.body.includes("secret"), false);
});

test("static assets are allowlisted and protected by a same-origin policy", async () => {
    for (const path of ["/", "/app.js", "/style.css"]) {
        const response = await request({}, path);
        assert.equal(response.status, 200);
        assert.match(response.headers["Content-Security-Policy"], /default-src 'self'/);
    }
    for (const path of ["/.env", "/package.json", "/src/server.js", "/../server.js"]) {
        assert.equal((await request({}, path)).status, 404);
    }
});
