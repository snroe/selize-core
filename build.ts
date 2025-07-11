import { build } from "bun";
import fs from "fs-extra";
import path from "path";

function getTsFiles(dir: string, baseDir = dir) {
  const result: string[] = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file.startsWith("__") || file === "node_modules" || file === ".git") continue;
      getTsFiles(fullPath, baseDir);
    } else if (file.endsWith(".ts") && !file.endsWith(".d.ts")) {
      result.push(fullPath);
    }
  }

  return result;
}

const entrypoints = getTsFiles("src");

if (entrypoints.length === 0) {
  console.error("No .ts files found.");
  process.exit(1);
}

const result = await build({
  root: 'src',
  entrypoints,
  outdir: "./lib",
  naming: "[dir]/[name].mjs",
  minify: false,
  splitting: true,
  target: "node",
  format: "esm",
  external: ["*"],
  sourcemap: "none",
});

if (result.success) {
  console.log("bun build successful");
} else {
  console.error("bun build failed");
  for (const message of result.logs) {
    console.error(message);
  }
}