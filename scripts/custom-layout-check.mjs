// Self-check da sanitização do layout personalizado:  node scripts/custom-layout-check.mjs
import assert from "node:assert/strict";
import { cleanHtml, cleanCss, scopeCss, fill, cleanLayout, defaultLayout, layoutCss, normalizeLayout, basePalette, fixContrast, blockCss, layoutPalette, mergeAiLayout } from "../src/lib/customLayout.js";
import { contrastRatio } from "../src/utils/color.js";

const bad = /<script|onerror|onload|onclick|javascript:|<iframe|<svg|<style|<form|<input|srcdoc/i;
const xss = [
  `<img src=x onerror=alert(1)>`,
  `<img src="x"/onerror=alert(1)>`,
  `<script>alert(1)</script>`,
  `<scr<script>ipt>alert(1)</script>`,
  `<a href="javascript:alert(1)">x</a>`,
  `<a href="&#x6A;avascript:alert(1)">x</a>`,
  `<a href=" javascript:alert(1)">x</a>`,
  `<a href="{{description}}">x</a>`,
  `<svg onload=alert(1)>`,
  `<iframe srcdoc="<script>alert(1)</script>">`,
  `<div title="a" onclick="alert(1)">x</div>`,
  `<div title='"><script>alert(1)</script>'>`,
  `<form action="https://evil"><input name=p></form>`,
  `<style>body{display:none}</style>`,
  `<div style="background:url(javascript:alert(1))">x</div>`,
  `<!--><img src=x onerror=alert(1)>-->`,
  `<img src="https://ok.png" data-action="evil">`,
];
for (const h of xss) {
  const out = cleanHtml(h);
  assert.ok(!bad.test(out.replace(/&lt;|&gt;|&quot;/g, "")), `vazou: ${h} -> ${out}`);
  // nenhum "<" fora de tag da lista branca
  for (const [, name] of out.matchAll(/<\/?([a-z0-9]+)/g)) assert.ok(name !== "script" && name !== "iframe", out);
}

// tags sempre balanceadas: não fecha nem deixa aberto o container do bloco
assert.equal(cleanHtml(`</div></div><p>x`), "<p>x</p>");
assert.equal(cleanHtml(`<div><span>a</div>`), "<div><span>a</span></div>");
assert.equal(cleanHtml(`a < b > c`), "a &lt; b &gt; c");

// o que é permitido continua
assert.equal(
  cleanHtml(`<a class="x" href="https://wa.me/55" target="_blank">W</a>`),
  `<a class="x" href="https://wa.me/55" target="_blank" rel="noopener noreferrer">W</a>`,
);
assert.equal(cleanHtml(`<img src="{{image}}" alt="{{name}}">`), `<img src="{{image}}" alt="{{name}}">`);
assert.equal(cleanHtml(`<button data-action="hours">H</button>`), `<button data-action="hours">H</button>`);

// valores do dono sempre escapados, inclusive em atributo
const tpl = cleanHtml(`<p title="{{name}}">{{name}}</p>`);
assert.equal(fill(tpl, { name: `"><script>alert(1)</script>` }), `<p title="&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;">&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;</p>`);

// CSS: não fecha o <style>, sem @import, url só https/data:image
assert.ok(!cleanCss(`</style><script>alert(1)</script>`).includes("<"));
assert.ok(!/@import/i.test(cleanCss(`@import url(https://evil.css); @\\69mport "x";`)));
assert.ok(cleanCss(`a{background:url(http://evil/t.png)}`).includes("none"));
assert.ok(cleanCss(`a{background:url("https://ok/x.png")}`).includes("https://ok/x.png"));

// escopo: chaves sobrando não deixam regra escapar do bloco
const scoped = scopeCss(".bm-b-x", `} body{display:none} .a{color:red}}} @keyframes k{from{opacity:0}to{opacity:1}}`);
assert.ok(scoped.startsWith("@keyframes k{"), scoped);
const inner = scoped.slice(scoped.indexOf(".bm-b-x{"));
let depth = 0;
for (const ch of inner) {
  if (ch === "{") depth++;
  if (ch === "}") depth--;
  assert.ok(depth >= 0, scoped);
}
assert.equal(depth, 0);

// primeiro produto maior: 2x2 só com 3+ colunas; nada com 1 coluna
const feat = (cols, mob) => blockCss(normalizeLayout({ blocks: [{ type: "items", id: "f", display: "grid", columns: cols, columnsMobile: mob, featured: true }] }).blocks[0]);
assert.match(feat(3, 1), /@media\(min-width:768px\)\{[^\n]*grid-column:span 2;grid-row:span 2/);
assert.match(feat(3, 1), /@media\(max-width:767px\)\{\}/);
assert.match(feat(2, 2), /grid-column:span 2;grid-row:auto\}\}/);
assert.ok(!/first-child/.test(blockCss(normalizeLayout({ blocks: [{ type: "items", id: "n", display: "grid" }] }).blocks[0])));

// cores do painel: 3 cores bastam, o resto sai legível
for (const colors of [{ bg: "#141414", accent: "#f5c518" }, { bg: "#fbf5ef", accent: "#b5401f" }, { bg: "#0f1e2e", accent: "#4fc3f7" }]) {
  const p = layoutPalette(normalizeLayout({ colors, blocks: [] }), basePalette({ background_color: "#ffffff" }));
  assert.ok(contrastRatio(p.text, p.bg) >= 4.5 && contrastRatio(p.muted, p.bg) >= 4.5, JSON.stringify(p));
  assert.ok(contrastRatio(p["accent-text"], p.accent) >= 4.5 && contrastRatio(p.text, p.soft) >= 4.5, JSON.stringify(p));
}
assert.equal(normalizeLayout({ colors: { bg: "red" }, blocks: [] }).colors.bg, "");
// fundo de seção sem cor de texto: texto legível automático
assert.ok(blockCss(normalizeLayout({ blocks: [{ type: "html", id: "z", style: { bg: "#111111" } }] }).blocks[0]).includes("color:#fafafa"));

// layout inválido/estranho
assert.equal(normalizeLayout(null), null);
assert.equal(normalizeLayout({ blocks: "x" }), null);
const n = normalizeLayout({ blocks: [{ type: "nope" }, { type: "items", id: "a b", style: { bg: "red;}" }, display: "x", columns: 99 }] });
assert.equal(n.blocks.length, 1);
assert.match(n.blocks[0].id, /^[a-z0-9]+$/i);
assert.equal(n.blocks[0].style.bg, "");
assert.equal(n.blocks[0].display, "list");
assert.equal(n.blocks[0].columns, 6);

// layout padrão passa limpo e gera CSS
const def = cleanLayout(defaultLayout());
assert.equal(def.blocks.length, 7);
const light = basePalette({ background_color: "#ffffff", title_color: "#111111", details_color: "#7b1730" });
assert.ok(layoutCss(def, light).startsWith(".bm-custom{--bm-bg:#ffffff;"));
assert.ok(layoutCss(def, light).includes(".bm-b-items"));
// coluna única: largura e margens laterais travadas; padding/maxWidth do bloco não mexem nas laterais
assert.ok(layoutCss(def, light).includes("--bm-page:1100px"));
assert.ok(layoutCss(def, light).includes(".bm-custom>:not(.bm-full){width:100%!important;max-width:min(var(--bm-w,100%),var(--bm-page))!important"));
const wide = normalizeLayout({ blocks: [{ type: "html", id: "w", style: { padding: 20, maxWidth: 600 } }] }).blocks[0];
assert.ok(blockCss(wide).startsWith(".bm-b-w{padding-top:20px;padding-bottom:20px;--bm-w:600px}"), blockCss(wide));

// contraste: IA escurece o fundo e esquece o texto (paleta base é de fundo claro)
const ai = normalizeLayout({
  css: "--bm-bg:#111111; --bm-accent:#ffd400; --bm-accent-text:#ffffff;",
  blocks: [
    { type: "items", id: "it", css: ".bm-card{background:#1a1a1a;color:#333333}.bm-tag{background:var(--bm-accent)}.bm-ok{background:#000;color:#fff}" },
    { type: "html", id: "h", style: { bg: "#000000", color: "#222222" } },
  ],
});
const fixed = fixContrast(ai, light);
const v = (k) => fixed.css.match(new RegExp(`--bm-${k}:\\s*(#[0-9a-f]+)`, "i"))?.[1];
assert.ok(contrastRatio(v("text"), "#111111") >= 4.5, fixed.css);
assert.ok(contrastRatio(v("muted"), "#111111") >= 4.5, fixed.css);
assert.ok(contrastRatio(v("accent-text"), "#ffd400") >= 4.5, fixed.css);
const items = fixed.blocks[0].css;
assert.match(items, /\.bm-card\{background:#1a1a1a;color:#fafafa\}/, items);
assert.match(items, /\.bm-tag\{background:var\(--bm-accent\);color:#171717\}/, items); // amarelo + texto herdado claro
assert.match(items, /\.bm-ok\{background:#000;color:#fff\}/, items); // o que já estava bom não muda
assert.ok(contrastRatio(fixed.blocks[1].style.color, "#000000") >= 4.5);
assert.equal(fixContrast(normalizeLayout({ blocks: [] }), light).css, ""); // paleta do dono boa: nada muda
assert.ok(def.blocks.find((b) => b.type === "header").html.includes('data-action="hours"'));

// edição manual x IA: vale a última alteração (a IA só aplica o que mudou e o dono não mexeu depois do envio)
{
  const mk = (blocks, extra = {}) => normalizeLayout({ font: "", pageWidth: 1100, colors: {}, css: "", blocks, ...extra });
  const blk = (id, type = "html", extra = {}) => ({ id, type, ...extra });
  const base = mk([blk("a", "html", { html: "<p>a</p>" }), blk("b", "items"), blk("c", "html", { html: "<p>c</p>" })]);
  const edit = (l, f) => { const c = structuredClone(l); f(c); return c; };
  const get = (l, id) => l.blocks.find((b) => b.id === id);

  // IA muda a fonte e o html de "a"; o dono mexeu em outros campos durante a geração: tudo sobrevive
  const ai = edit(base, (l) => { l.font = "Lora"; get(l, "a").html = "<p>ia</p>"; });
  const cur = edit(base, (l) => { l.pageWidth = 1400; get(l, "b").display = "grid"; get(l, "a").style.padding = 48; });
  let m = mergeAiLayout(base, ai, cur);
  assert.equal(m.font, "Lora");
  assert.equal(m.pageWidth, 1400);
  assert.equal(get(m, "a").html, "<p>ia</p>");
  assert.equal(get(m, "a").style.padding, 48); // mesmo bloco: campo do dono + campo da IA
  assert.equal(get(m, "b").display, "grid");

  // os dois mexeram no mesmo campo durante a geração: vale o do dono
  m = mergeAiLayout(base, edit(base, (l) => { l.colors.accent = "#ff0000"; get(l, "a").style.bg = "soft"; }), edit(base, (l) => { l.colors.accent = "#00ff00"; get(l, "a").style.bg = "accent"; }));
  assert.equal(m.colors.accent, "#00ff00");
  assert.equal(get(m, "a").style.bg, "accent");

  // IA não mexeu em nada que o dono mexeu: nada da tela é desfeito
  m = mergeAiLayout(base, edit(base, (l) => { l.font = "Lora"; }), edit(base, (l) => { get(l, "c").html = "<p>manual</p>"; l.css = "x{}"; }));
  assert.equal(get(m, "c").html, "<p>manual</p>");
  assert.equal(m.css, "x{}");
  assert.equal(m.font, "Lora");

  // IA sem mudanças: a tela fica como está
  assert.deepEqual(mergeAiLayout(base, base, cur), cur);

  // blocos: IA adiciona (entra), IA remove bloco intocado (sai), IA remove bloco que o dono editou (fica),
  // dono removeu bloco que a IA alterou (continua removido)
  const aiB = edit(base, (l) => { l.blocks = [get(l, "a"), ...l.blocks.filter((b) => b.id === "c"), mk([blk("n", "search")]).blocks[0]]; get(l, "a").html = "<p>ia</p>"; });
  m = mergeAiLayout(base, aiB, base);
  assert.deepEqual(m.blocks.map((b) => b.id), ["a", "c", "n"]);
  m = mergeAiLayout(base, aiB, edit(base, (l) => { get(l, "b").display = "carousel"; }));
  assert.deepEqual(m.blocks.map((b) => b.id).sort(), ["a", "b", "c", "n"]);
  assert.equal(get(m, "b").display, "carousel");
  m = mergeAiLayout(base, edit(base, (l) => { get(l, "a").html = "<p>ia</p>"; }), edit(base, (l) => { l.blocks = l.blocks.filter((b) => b.id !== "a"); }));
  assert.deepEqual(m.blocks.map((b) => b.id), ["b", "c"]);

  // ordem: dono não reordenou -> ordem da IA; dono reordenou -> ordem do dono
  const aiO = edit(base, (l) => { l.blocks.reverse(); });
  assert.deepEqual(mergeAiLayout(base, aiO, base).blocks.map((b) => b.id), ["c", "b", "a"]);
  const curO = edit(base, (l) => { l.blocks = [get(l, "b"), get(l, "a"), get(l, "c")]; });
  assert.deepEqual(mergeAiLayout(base, aiO, curO).blocks.map((b) => b.id), ["b", "a", "c"]);
}

console.log("custom-layout-check ok");
