import { cp, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";

for (const file of ["src/app.js", "src/server.js", "public/app.js"]) {
    execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
}
await mkdir("dist", { recursive: true });
await cp("src", "dist/src", { recursive: true });
await cp("public", "dist/public", { recursive: true });
