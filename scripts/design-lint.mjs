#!/usr/bin/env node
/**
 * surfsync design-lint — enforces the mechanical rules in DESIGN.md §11.
 *
 *   node scripts/design-lint.mjs [dirs…] [--product "src/app/(app),app/(app)"] [--tokens src/app/globals.css]
 *
 * Defaults: scans ./src ./app ./components ./lib (whichever exist).
 * Exit 1 if any error-level rule fires. Warnings never fail the build.
 *
 * Suppress one line with a reason (reviewed in PR):
 *   // design-lint-disable-next-line SS09 -- weekday labels
 *   {/* design-lint-disable-next-line SS09 -- weekday labels *\/}
 */
import fs from "node:fs";
import path from "node:path";

// ---------- args ----------
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(name);
  if (i === -1) return fallback;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
};
const PRODUCT_DIRS = opt("--product", "src/app/(app),app/(app),src/features,features")
  .split(",").map((s) => path.normalize(s.trim())).filter(Boolean);
const TOKENS_FILES = opt("--tokens", "tokens.css,src/app/globals.css,app/globals.css,src/styles/globals.css")
  .split(",").map((s) => path.normalize(s.trim()));
const roots = argv.length ? argv : ["src", "app", "components", "lib"].filter((d) => fs.existsSync(d));

const CODE = new Set([".tsx", ".ts", ".jsx", ".js", ".mjs", ".css", ".mdx"]);
const COPY = new Set([".json", ".po", ".yml", ".yaml"]);
const SKIP_DIRS = new Set(["node_modules", ".next", "dist", "build", ".turbo", "coverage", ".git"]);

// ---------- rules ----------
const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const COLOR_UTIL =
  "bg|text|border|border-[trblxy]|ring|ring-offset|outline|fill|stroke|from|via|to|divide|placeholder|caret|accent|decoration|shadow";

/** @type {{id:string, level:"error"|"warn", re:RegExp, msg:string, files?:"code"|"copy"|"all", skipTokens?:boolean, productOnly?:boolean}[]} */
const RULES = [
  { id: "SS01", level: "error", files: "code",
    re: new RegExp(`(?<![\\w-])(?:[\\w-]+:)*(?:${COLOR_UTIL})-(?:${PALETTE})-\\d{2,3}\\b`, "g"),
    msg: "Tailwind default palette colour. Use a semantic token (bg-primary, text-muted-foreground, bg-tint…)." },
  { id: "SS02", level: "error", files: "code", skipTokens: true,
    re: /(?:-\[(?:#|rgba?\(|hsla?\(|oklch\(|color-mix\())|(?<![\w&-])#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?\b/g,
    msg: "Colour literal in a component. Components consume semantic tokens only." },
  { id: "SS03", level: "error", files: "code",
    re: /(?<![\w-])italic(?![\w-])|font-style\s*:\s*italic|fontStyle\s*:\s*["']italic/g,
    msg: "Italic is not part of the system. Use weight 500/600 for emphasis." },
  { id: "SS04", level: "error", files: "code",
    re: /(?<![\w-])font-(?:bold|extrabold|black)(?![\w-])|font-weight\s*:\s*(?:[789]00|bold)|fontWeight\s*:\s*["']?(?:[789]00|bold)/g,
    msg: "UI weights are 400/500/600 only." },
  { id: "SS05", level: "error", files: "code", productOnly: true,
    re: /(?<![\w-])font-display(?![\w-])/g,
    msg: "BD Sans (font-display) is for brand surfaces only, never operational screens." },
  { id: "SS06", level: "error", files: "code", skipTokens: true,
    re: /(?<![\w-])backdrop-blur(?:-[\w[\]]+)?(?![\w-])|backdrop-filter\s*:|backdropFilter/g,
    msg: "Hand-rolled blur. Use the `glass` utility." },
  { id: "SS07", level: "error", files: "code", skipTokens: true,
    re: /(?<![\w-])bg-(?:gradient|linear|radial|conic)-[\w[\]/-]+|(?:linear|radial|conic)-gradient\(/g,
    msg: "Gradients are not allowed in UI chrome. For legibility over photos use `scrim`." },
  { id: "SS08", level: "error", files: "code",
    re: /(?<![\w-])animate-(?:bounce|ping)(?![\w-])/g,
    msg: "No bounce/ping. Motion settles, it doesn't play." },
  { id: "SS09", level: "warn", files: "code",
    re: /(?<![\w-])(?:uppercase|tracking-(?:wide|wider|widest))(?![\w-])|text-transform\s*:\s*uppercase/g,
    msg: "Sentence case. Uppercase only for calendar weekday labels (suppress with a reason)." },
  { id: "SS10", level: "error", files: "code", skipTokens: true,
    re: /(?<![\w-])shadow-(?:xl|2xl|inner|\[[^\]]*\])(?![\w-])/g,
    msg: "Use shadow-card / shadow-float / shadow-overlay only." },
  { id: "SS11", level: "error", files: "code", skipTokens: true,
    re: /#000(?:000)?\b|rgba?\(\s*0[\s,]+0[\s,]+0\s*[,)/]/g,
    msg: "No pure black in product UI. Product black is Azul Atlântico (text-foreground / bg-inverse)." },
  { id: "SS12", level: "warn", files: "all", stringsOnly: true,
    re: /\b(?:Buscar|Busque|Salvar|Usuári[oa]s?|Cadastr\w*|Celular|Tela|Configurações|Compartilhar|Arquivo|Intermediário|Você|você|sua aula|seu perfil|suas aulas|seus dados)\b/g,
    msg: "PT-BR vocabulary. Use PT-PT with 'tu' (Pesquisar, Guardar, Utilizador, Registo, Ecrã, Definições, Partilhar, Intermédio, a tua…)." },
  { id: "SS13", level: "warn", files: "all", stringsOnly: true,
    re: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}](?<!\u{1F44B})/gu,
    msg: "Emoji in system copy. The only sanctioned emoji is the 👋 greeting on Início." },
  { id: "SS16", level: "warn", files: "code", skipTokens: true,
    re: /(?<![\w-])(?:rounded(?:-[trblse]{1,2})?|(?:p|m)[trblxyse]?|gap(?:-[xy])?|space-[xy]|[hw]|size|min-[hw]|max-[hw]|inset(?:-[xy])?|top|left|right|bottom)-\[\d+(?:\.\d+)?(?:px|rem)\]/g,
    msg: "Arbitrary radius/spacing. Use the scale or semantic tokens (rounded-card, px-gutter, gap-stack…)." },
];

// ---------- helpers ----------
const isTokens = (f) => TOKENS_FILES.some((t) => path.normalize(f).endsWith(t));
const isProduct = (f) => PRODUCT_DIRS.some((d) => path.normalize(f).split(path.sep).join("/").includes(d.split(path.sep).join("/")));
const DISABLE = /design-lint-disable-next-line\s+([A-Z0-9 ,]+)/;

function* walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

/** Crude string-literal / JSX-text extraction for copy rules on code files. */
function copyFragments(line, ext) {
  if (COPY.has(ext)) return [line];
  const out = [];
  for (const m of line.matchAll(/(["'`])((?:\\.|(?!\1).)*)\1/g)) out.push(m[2]);
  for (const m of line.matchAll(/>([^<>{}]+)</g)) out.push(m[1]);
  if (!/[<>{};=()]/.test(line)) out.push(line); // bare JSX text lines
  return out;
}

// ---------- run ----------
const findings = [];
for (const root of roots) {
  const files = fs.statSync(root).isFile() ? [root] : [...walk(root)];
  for (const file of files) {
    const ext = path.extname(file);
    const kind = CODE.has(ext) ? "code" : COPY.has(ext) ? "copy" : null;
    if (!kind) continue;
    const text = fs.readFileSync(file, "utf8");
    const lines = text.split(/\r?\n/);
    const tokens = isTokens(file);
    const product = isProduct(file);

    lines.forEach((line, i) => {
      const prev = lines[i - 1] || "";
      const disabled = (prev.match(DISABLE)?.[1] || "").split(/[ ,]+/).filter(Boolean);
      for (const r of RULES) {
        if (r.files === "code" && kind !== "code") continue;
        if (r.skipTokens && tokens) continue;
        if (r.productOnly && !product) continue;
        if (disabled.includes(r.id)) continue;
        const targets = r.stringsOnly ? copyFragments(line, ext) : [line];
        for (const t of targets) {
          r.re.lastIndex = 0;
          const m = r.re.exec(t);
          if (m) {
            findings.push({ file, line: i + 1, id: r.id, level: r.level, msg: r.msg, hit: m[0] });
            break;
          }
        }
      }
    });

    // SS14 — more than one filled primary <Button> per file
    if (kind === "code" && /\.(t|j)sx$/.test(ext)) {
      const tags = [...text.matchAll(/<Button\b(?:=>|[^>])*>/g)];
      const filled = tags.filter((m) => {
        const v = m[0].match(/variant=\{?["'](\w[\w-]*)["']\}?/);
        return !v || v[1] === "default";
      });
      if (filled.length > 1) {
        const lineOf = (idx) => text.slice(0, idx).split("\n").length;
        findings.push({
          file, line: lineOf(filled[1].index), id: "SS14", level: "warn",
          msg: `${filled.length} filled primary Buttons in one file. One per view — make the others outline/ghost/link.`,
          hit: "<Button>",
        });
      }
    }
  }
}

// ---------- report ----------
const errors = findings.filter((f) => f.level === "error");
const warns = findings.filter((f) => f.level === "warn");
const fmt = (f) => `${f.file}:${f.line}  ${f.level === "error" ? "✖" : "⚠"} ${f.id}  ${f.msg}  [${f.hit}]`;
findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line).forEach((f) => console.log(fmt(f)));
console.log(`\nsurfsync design-lint: ${errors.length} error(s), ${warns.length} warning(s) in ${roots.join(", ") || "(nothing)"}`);
process.exit(errors.length ? 1 : 0);
