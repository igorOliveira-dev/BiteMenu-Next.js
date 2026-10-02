// "black" ou "white" para texto legível sobre `hex`.
// Aceita #rgb/#rgba (o HexColorInput salva cores curtas) além de #rrggbb.
export function getContrastTextColor(hex, fallback = "#ffffff") {
  let clean = (hex || fallback).replace("#", "");
  if (clean.length === 3 || clean.length === 4) {
    clean = [...clean.slice(0, 3)].map((c) => c + c).join("");
  }
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "black" : "white";
}
