// Taxa de entrega por raio (Plus+): distância em linha reta entre a loja e o cliente.
// delivery_radius = { lat, lng, tiers: [{ id, km, fee }] } — vale a menor faixa que cobre a distância.

export function distanceKm(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

// null = fora da área de entrega
export function feeForDistance(tiers, km) {
  const tier = (tiers || [])
    .filter((t) => Number(t.km) > 0)
    .sort((a, b) => Number(a.km) - Number(b.km))
    .find((t) => km <= Number(t.km));
  return tier ? Number(tier.fee) || 0 : null;
}

// ponytail: Nominatim (OpenStreetMap) grátis, sem chave, limite ~1 req/s; trocar por Google/Mapbox se a precisão ou o volume apertarem
async function nominatim(params) {
  const qs = new URLSearchParams({ format: "json", limit: "1", countrycodes: "br", ...params });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${qs}`);
  const [hit] = await res.json();
  return hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null;
}

// endereço no formato do AddressFields → { lat, lng } ou null
export async function geocodeAddress(a) {
  const t = (s) => (s || "").trim();
  try {
    const number = t(a?.number).toUpperCase() === "S/N" ? "" : t(a?.number);
    if (t(a?.street) && t(a?.city)) {
      const hit = await nominatim({
        street: `${number} ${t(a.street)}`.trim(),
        city: t(a.city),
        state: t(a.state),
      });
      if (hit) return hit;
    }
    // rua não achada: centro do CEP é uma boa aproximação
    if (t(a?.cep).length === 9) return await nominatim({ postalcode: t(a.cep) });
  } catch (e) {
    console.warn("geocodeAddress error:", e);
  }
  return null;
}

export function currentPosition() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  });
}
