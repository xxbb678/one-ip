// iOS 15 / Safari 16.4- compatibility: Tailwind 4 registers its --tw-* custom
// property initial values with @property, which older Safari ignores entirely.
// That leaves the variables undefined and the app renders blank. This copies
// every @property initial-value into a plain :root block so those engines still
// get the same defaults.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dist = join(process.cwd(), "dist", "assets");
let patched = 0;

for (const file of readdirSync(dist)) {
  if (!file.endsWith(".css")) continue;
  const path = join(dist, file);
  const css = readFileSync(path, "utf8");
  if (css.includes("one-ios15-fallback")) continue;

  const re = /@property\s+(--[a-zA-Z0-9-]+)\s*\{([^}]*)\}/g;
  const vars = [];
  let m;
  while ((m = re.exec(css)) !== null) {
    const name = m[1];
    const initial = m[2].match(/initial-value\s*:\s*([^;}]+)/);
    if (initial) {
      const value = initial[1].trim();
      if (value && value !== "unset") vars.push(`${name}:${value}`);
    }
  }
  if (!vars.length) continue;

  const banner =
    "\n/* one-ios15-fallback: @property initial values for Safari < 16.4 */\n" +
    ":root{" +
    vars.join(";") +
    "}\n";
  writeFileSync(path, css + banner);
  patched++;
  console.log(`[ios15-fallback] ${file}: +${vars.length} vars`);
}

console.log(`[ios15-fallback] patched ${patched} css file(s)`);
