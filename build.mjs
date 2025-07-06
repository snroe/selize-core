import { build } from "bun";
import fs from "fs";
import path from "path";

// 遍历目录获取所有 .ts 文件（递归）
function getTsFiles(dir, baseDir = dir, result = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // 排除特定目录（如 __tests__）
      if (file.startsWith("__") || file === "node_modules" || file === ".git") continue;
      getTsFiles(fullPath, baseDir, result);
    } else if (file.endsWith(".ts") && !file.endsWith(".d.ts")) {
      // result.push(fullPath.substring(baseDir.length + 1));
      result.push(fullPath);
    }
  }

  return result;
}

// 获取 entrypoints
const entrypoints = getTsFiles("src");

if (entrypoints.length === 0) {
  console.error("没有找到任何 .ts 文件");
  process.exit(1);
}

const result = await build({
  root: 'src',
  entrypoints,
  outdir: "./lib",
  naming: "[dir]/[name].[ext]",
  minify: false,
  splitting: true,
  target: "node",
  format: "esm",
  external: ["*"],
  sourcemap: "none",
});

if (result.success) {
  console.log("bun 构建成功！");
} else {
  console.error("bun 构建失败：");
  for (const message of result.logs) {
    console.error(message);
  }
}