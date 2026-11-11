const form = document.querySelector("#filters");
const postsElement = document.querySelector("#posts");
const statusElement = document.querySelector("#status");
const countElement = document.querySelector("#count");
const template = document.querySelector("#post-template");
let activeRequest;

function renderPost(post) {
    const card = template.content.cloneNode(true);
    card.querySelector(".post-id").textContent = `POST ${String(post._id).padStart(2, "0")}`;
    card.querySelector(".post-author").textContent = post.autor;
    card.querySelector("h3").textContent = post.titulo;
    card.querySelector(".content").textContent = post.conteudo;
    for (const tag of post.tags ?? []) {
        const item = document.createElement("li");
        item.textContent = tag;
        card.querySelector(".tags").append(item);
    }
    const comments = post.comentarios ?? [];
    card.querySelector("h4").textContent = comments.length ? `Conversation / ${comments.length}` : "No comments yet";
    for (const comment of comments) {
        const item = document.createElement("li");
        const author = document.createElement("strong");
        const text = document.createElement("p");
        author.textContent = comment.autor;
        text.textContent = comment.texto;
        item.append(author, text);
        card.querySelector(".comments ul").append(item);
    }
    return card;
}

async function loadPosts() {
    activeRequest?.abort();
    const controller = new AbortController();
    activeRequest = controller;
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(form)) {
        if (value.trim()) params.set(key, value.trim());
    }
    postsElement.setAttribute("aria-busy", "true");
    postsElement.replaceChildren();
    statusElement.textContent = "Loading posts…";
    countElement.textContent = "—";
    try {
        const response = await fetch(`/api/posts?${params}`, { signal: controller.signal });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load posts.");
        for (const post of body.posts) postsElement.append(renderPost(post));
        countElement.textContent = `${body.count} ${body.count === 1 ? "post" : "posts"}`;
        statusElement.textContent = body.count === 0
            ? "No posts found. Clear the filters or load the exercise data into this environment."
            : `Showing ${body.count} ${body.count === 1 ? "document" : "documents"}, ordered by ID. Up to ${body.limit} results.`;
    } catch (error) {
        if (error.name !== "AbortError") statusElement.textContent = error.message;
    } finally {
        if (activeRequest === controller) postsElement.setAttribute("aria-busy", "false");
    }
}

form.addEventListener("submit", (event) => {
    event.preventDefault();
    loadPosts();
});
form.addEventListener("reset", () => setTimeout(loadPosts, 0));
loadPosts();
