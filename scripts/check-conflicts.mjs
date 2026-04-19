import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["src", "electron", "docs", "README.md"];
const markers = ["<<<<<<<", "=======", ">>>>>>>"];
const skipDirs = new Set(["node_modules", "dist", ".git"]);
const offenders = [];

const walk = (target) => {
  const stat = statSync(target);

  if (stat.isDirectory()) {
    for (const entry of readdirSync(target)) {
      if (skipDirs.has(entry)) continue;
      walk(join(target, entry));
    }
    return;
  }

  const content = readFileSync(target, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, index) => {
    if (markers.some((marker) => line.includes(marker))) {
      offenders.push(`${target}:${index + 1}: ${line.trim()}`);
    }
  });
};

for (const root of roots) {
  try {
    walk(root);
  } catch {
    // optional root
  }
}

if (offenders.length > 0) {
  console.error("Merge conflict markers found:\n");
  offenders.forEach((offender) => console.error(`- ${offender}`));
  process.exit(1);
}

console.log("No merge conflict markers found.");
