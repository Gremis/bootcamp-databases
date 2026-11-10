import { readFile } from "node:fs/promises";

const assets = new Map([
    ["/", ["index.html", "text/html; charset=utf-8"]],
    ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
    ["/style.css", ["style.css", "text/css; charset=utf-8"]]
]);
const filterFields = new Map([
    ["tag", "tags"],
    ["autor", "autor"],
    ["comentarioAutor", "comentarios.autor"]
]);

export function parseFilters(searchParams) {
    const filter = {};
    for (const [key, value] of searchParams) {
        if (!filterFields.has(key) || searchParams.getAll(key).length !== 1 || value.length > 120) {
            throw new Error("Use one plain text value per supported filter, up to 120 characters.");
        }
        if (value.trim()) {
            filter[filterFields.get(key)] = value.trim();
        }
    }
    return filter;
}

export function createHandler(store) {
    return async (request, response) => {
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("Referrer-Policy", "no-referrer");
        response.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
        response.setHeader("Cache-Control", "no-store");

        const json = (status, body) => {
            response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
            response.end(JSON.stringify(body));
        };

        if (request.method !== "GET") {
            response.setHeader("Allow", "GET");
            json(405, { error: "Only GET requests are supported." });
            return;
        }

        try {
            const url = new URL(request.url, "http://localhost");
            if (url.pathname === "/health") {
                await store.ping();
                json(200, { status: "ok" });
                return;
            }
            if (url.pathname === "/api/posts") {
                let filter;
                try {
                    filter = parseFilters(url.searchParams);
                } catch (error) {
                    json(400, { error: error.message });
                    return;
                }
                const posts = await store.findPosts(filter);
                json(200, { posts, count: posts.length, limit: 100 });
                return;
            }
            const asset = assets.get(url.pathname);
            if (!asset) {
                json(404, { error: "Resource not found." });
                return;
            }
            const content = await readFile(new URL(`../public/${asset[0]}`, import.meta.url));
            response.writeHead(200, { "Content-Type": asset[1] });
            response.end(content);
        } catch {
            json(503, { error: "Service temporarily unavailable. Try again shortly." });
        }
    };
}
