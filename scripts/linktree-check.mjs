// Self-check das regras da linktree:  node scripts/linktree-check.mjs
import assert from "node:assert/strict";
import { cleanLinktree, safeUrl, normalizeUrl, iconFor, linktreeColors, defaultLinktree, linkHref, MAX_LINKS } from "../src/lib/linktree.js";

// protocolos proibidos, inclusive disfarçados
for (const bad of [
  "javascript:alert(1)",
  "JavaScript:alert(1)",
  " javascript:alert(1)",
  "java\tscript:alert(1)",
  "java\nscript:alert(1)",
  "data:text/html,<script>alert(1)</script>",
  "vbscript:msgbox(1)",
  "file:///etc/passwd",
  "https://localhost",
  "tel:",
  "",
  null,
  42,
  "https://a.com/" + "x".repeat(600),
]) {
  assert.equal(safeUrl(bad), null, `deveria recusar: ${JSON.stringify(bad)}`);
}
for (const ok of ["https://instagram.com/x", "http://exemplo.com.br", "tel:+5511999999999", "mailto:oi@loja.com"]) {
  assert.ok(safeUrl(ok), `deveria aceitar: ${ok}`);
}

assert.equal(normalizeUrl("instagram.com/loja"), "https://instagram.com/loja");
assert.equal(normalizeUrl("  wa.me/5511 "), "https://wa.me/5511");
assert.equal(normalizeUrl("oi@loja.com"), "mailto:oi@loja.com");
assert.equal(normalizeUrl("javascript:alert(1)"), "javascript:alert(1)"); // não "conserta": safeUrl recusa
assert.equal(safeUrl(normalizeUrl("javascript:alert(1)")), null);

// cleanLinktree
const t = cleanLinktree({
  links: [
    { id: "a", kind: "menu", label: " Ver cardápio " },
    { id: "b", kind: "url", label: "Insta", url: "https://instagram.com/x", icon: "gift" },
    { id: "c", kind: "url", label: "Mal", url: "javascript:alert(1)" },
    { id: "d", kind: "url", label: "", url: "https://a.com" },
    { id: "b", kind: "url", label: "Dup", url: "https://b.com", icon: "__proto__", hidden: true },
    "lixo",
    null,
  ],
  style: { button: "neon", shape: "rounded", colors: { bg: "#fff", title: "red", details: "#000" }, showLogo: false },
});
assert.deepEqual(
  t.links.map((l) => l.label),
  ["Ver cardápio", "Insta", "Dup"],
);
assert.equal(t.links[0].kind, "menu");
assert.equal(t.links[0].url, undefined);
assert.equal(t.links[1].icon, "gift");
assert.equal(t.links[2].icon, null); // chave fora de ICONS (inclusive __proto__) vira automático
assert.equal(t.links[2].hidden, true);
assert.notEqual(t.links[2].id, t.links[1].id); // ids únicos
assert.equal(t.style.button, "fill");
assert.equal(t.style.shape, "rounded");
assert.equal(t.style.colors, null); // "red" não é hex: volta às cores do cardápio
assert.equal(t.style.showLogo, false);
assert.equal(t.style.showBanner, true);

const many = cleanLinktree({ links: Array.from({ length: 50 }, (_, i) => ({ label: `L${i}`, url: "https://a.com" })) });
assert.equal(many.links.length, MAX_LINKS);
assert.equal(cleanLinktree({ links: [{ label: "x".repeat(200), url: "https://a.com" }] }).links[0].label.length, 60);

for (const junk of [null, undefined, "x", 1, [], { links: "x", style: [] }]) {
  const r = cleanLinktree(junk);
  assert.deepEqual(r.links, []);
  assert.equal(r.style.button, "fill");
}
assert.equal(defaultLinktree().links[0].kind, "menu");
assert.equal(linkHref({ kind: "menu" }, "loja"), "/menu/loja");

// ícones
assert.equal(iconFor({ kind: "url", url: "https://www.instagram.com/x" }), "instagram");
assert.equal(iconFor({ kind: "url", url: "https://wa.me/5511" }), "whatsapp");
assert.equal(iconFor({ kind: "url", url: "https://www.google.com.br/maps/place/x" }), "maps");
assert.equal(iconFor({ kind: "url", url: "https://box.com" }), "link"); // não confunde com x.com
assert.equal(iconFor({ kind: "url", url: "tel:+5511" }), "phone");
assert.equal(iconFor({ kind: "menu" }), "menu");
assert.equal(iconFor({ kind: "url", url: "https://instagram.com/x", icon: "star" }), "star");

// cores
const menu = { background_color: "#ffffff", title_color: "#ffff00", details_color: "#ffffff" };
const c = linktreeColors({ colors: null }, menu);
assert.equal(c.bg, "#ffffff");
assert.equal(c.title, "#171717"); // amarelo sobre branco: ilegível, cai para o texto
assert.equal(c.border, "#171717"); // detalhes brancos sobre branco
assert.equal(c.onDetails, "#000000");
const own = linktreeColors({ colors: { bg: "#111111", title: "#ff8800", details: "#ff8800" } }, menu);
assert.equal(own.bg, "#111111");
assert.equal(own.title, "#ff8800");
assert.equal(own.foreground, "#fafafa");

console.log("ok");
