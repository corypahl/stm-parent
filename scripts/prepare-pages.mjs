import { access, rename, rm } from "node:fs/promises";
import { resolve } from "node:path";

const clientRoot = resolve("dist", "client");
const nestedRoot = resolve(clientRoot, "stm-parent");
const nestedAssets = resolve(nestedRoot, "_next");
const rootAssets = resolve(clientRoot, "_next");

try {
  await access(nestedAssets);
} catch (error) {
  if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
    process.exit(0);
  }
  throw error;
}

await rm(rootAssets, { recursive: true, force: true });
await rename(nestedAssets, rootAssets);
await rm(nestedRoot, { recursive: true, force: true });

console.log("Normalized GitHub Pages assets to dist/client/_next.");
