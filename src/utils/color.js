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

const luminance = (hex) => {
  let clean = hex.replace("#", "");
  if (clean.length < 6) clean = [...clean.slice(0, 3)].map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(clean.substring(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Contraste WCAG entre duas cores hex (1 a 21)
export function contrastRatio(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
