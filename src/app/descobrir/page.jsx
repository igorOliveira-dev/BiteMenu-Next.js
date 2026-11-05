"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FaMapMarkerAlt,
  FaSearch,
  FaStore,
  FaUser,
  FaCrosshairs,
} from "react-icons/fa";
import useUser, { updateCachedProfile } from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import { saveProfileAddress } from "@/lib/queries/profiles";
import BrandLogo from "@/components/BrandLogo";
import ThemeToggle from "@/components/ThemeToggle";
import CustomerMenu from "@/components/CustomerMenu";
import SignUpCta from "@/components/SignUpCta";
import GenericModal from "@/components/GenericModal";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import AddressFields, {
  EMPTY_ADDRESS,
  formatAddress,
} from "@/components/AddressFields";
import { currentPosition, geocodeAddress } from "@/lib/deliveryRadius";

const INFO_KEY = "customerInfo"; // mesmo endereço do carrinho e de /conta > Dados pessoais
// coordenadas em chave própria: o carrinho regrava customerInfo inteiro e apagaria um campo extra
const COORDS_KEY = "discoverCoords"; // { source: <endereço formatado> | "gps", lat, lng }
const DISTANCES = [
  { value: "", label: "Qualquer distância" },
  { value: "2", label: "Até 2 km" },
  { value: "5", label: "Até 5 km" },
  { value: "10", label: "Até 10 km" },
  { value: "25", label: "Até 25 km" },
];

const readJson = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};
const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

// mesmo endereço do carrinho e de /conta > Dados pessoais
const saveToDevice = (parts) =>
  writeJson(INFO_KEY, {
    ...(readJson(INFO_KEY) || {}),
    addressParts: parts,
    address: formatAddress(parts),
  });

// falha (ex.: SQL tasks/descobrir/profile-address.sql não rodado) não trava a tela: o endereço segue no aparelho
const saveToAccount = async (profileId, parts) => {
  const { error } = await saveProfileAddress(supabase, profileId, parts);
  if (error)
    console.warn("[descobrir] endereço não salvo na conta:", error.message);
  else updateCachedProfile({ address_details: parts, cep: parts.cep || null });
};

const inputClass =
  "w-full px-3 py-2 bg-translucid border border-brand-line rounded-xl focus:outline-none focus:ring-2 focus:ring-bite";

export default function DescobrirPage() {
  const { user, profile, loading } = useUser();
  const ready = !loading && (!user || !!profile);
  const isCustomer = profile?.account_type === "customer";

  const [address, setAddress] = useState(null); // addressParts ou null
  const [coords, setCoords] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [q, setQ] = useState("");
  const [local, setLocal] = useState("");
  const [km, setKm] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // endereço: aparelho → conta → CEP do cadastro (completa pelo ViaCEP), igual ao PersonalInfo
  useEffect(() => {
    if (!ready) return;
    const saved = readJson(INFO_KEY)?.addressParts;
    const fromAccount = profile?.address_details;
    if (saved?.street && saved?.city) {
      // informado antes de criar a conta (ou antes de existir o endereço na conta): leva para a conta
      if (profile?.id && !fromAccount?.street) saveToAccount(profile.id, saved);
      return setAddress(saved);
    }
    if (fromAccount?.street && fromAccount?.city) {
      saveToDevice(fromAccount); // o carrinho lê do aparelho
      return setAddress(fromAccount);
    }

    const gps = readJson(COORDS_KEY);
    if (gps?.source === "gps") return setCoords(gps);

    const cep = profile?.cep;
    if (cep?.length === 9) {
      fetch(`https://viacep.com.br/ws/${cep.replace("-", "")}/json/`)
        .then((res) => res.json())
        .then((d) => {
          if (d.erro) throw new Error();
          setAddress({
            ...EMPTY_ADDRESS,
            cep,
            street: d.logradouro,
            neighborhood: d.bairro,
            city: d.localidade,
            state: d.uf,
          });
        })
        .catch(() => user && setShowModal(true));
      return;
    }
    // visitante não é interrompido: ele informa o endereço pelo botão se quiser
    if (user) setShowModal(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user, profile?.id]);

  // coordenada do endereço, com cache para não chamar o Nominatim a cada visita
  useEffect(() => {
    if (!address) return;
    const source = formatAddress(address) || address.cep;
    const cached = readJson(COORDS_KEY);
    if (cached?.source === source) return setCoords(cached);
    let cancelled = false;
    geocodeAddress(address).then((pos) => {
      if (cancelled) return;
      setNotFound(!pos);
      setCoords(pos);
      if (pos) writeJson(COORDS_KEY, { source, ...pos });
    });
    return () => {
      cancelled = true;
    };
  }, [address]);

  // busca com debounce
  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams();
    if (coords) {
      params.set("lat", coords.lat);
      params.set("lng", coords.lng);
      if (km) params.set("km", km);
    }
    if (address?.city) params.set("cidade", address.city);
    if (address?.state) params.set("uf", address.state);
    if (q.trim()) params.set("q", q.trim());
    if (local.trim()) params.set("local", local.trim());

    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/descobrir?${params}`, { signal: ctrl.signal })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          setError(false);
          setResults(data.results);
        })
        .catch((e) => e?.name !== "AbortError" && setError(true));
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [ready, coords, address, q, local, km]);

  const saveAddress = (parts) => {
    saveToDevice(parts);
    if (profile?.id) saveToAccount(profile.id, parts);
    setAddress(parts);
    setShowModal(false);
  };

  const locateByGps = async () => {
    const pos = await currentPosition();
    if (!pos) return false;
    writeJson(COORDS_KEY, { source: "gps", ...pos });
    setAddress(null);
    setNotFound(false);
    setCoords(pos);
    setShowModal(false);
    return true;
  };

  const placeLabel = address
    ? [
        address.street &&
          `${address.street}${address.number ? `, ${address.number}` : ""}`,
        address.city,
      ]
        .filter(Boolean)
        .join(" · ")
    : coords
      ? "Sua localização atual"
      : null;

  return (
    <>
      <header className="z-10 backdrop-blur-xl flex items-center fixed top-0 w-[calc(100%-20px)] justify-between py-1.5 pl-4 pr-1.5 m-2 my-3 bg-brand-surface/85 border border-brand-line rounded-full">
        <BrandLogo as="a" href="/" />
        <div className="flex items-center gap-1">
          {ready && !user && (
            <Link
              href={`/login?tipo=cliente&next=${encodeURIComponent("/descobrir")}`}
              className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium hover-bg-translucid"
            >
              <FaUser size={12} /> Entrar
            </Link>
          )}
          {ready && isCustomer && <CustomerMenu profile={profile} />}
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[900px] px-4 pt-[90px] pb-10">
        <h1 className="text-2xl font-bold">Descobrir estabelecimentos</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Restaurantes, lanchonetes e deliveries que usam o Bite Menu.
        </p>

        {ready && !user && (
          <div className="mt-4">
            <SignUpCta next="/descobrir" />
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <FaMapMarkerAlt className="text-brand-red" />
          {placeLabel ? (
            <>
              <span>
                Perto de: <strong>{placeLabel}</strong>
              </span>
              <button
                onClick={() => setShowModal(true)}
                className="cursor-pointer underline opacity-70 hover:opacity-100"
              >
                trocar
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="cursor-pointer rounded-full border border-brand-line px-3 py-1.5 font-medium hover-bg-translucid"
            >
              Informar meu endereço
            </button>
          )}
        </div>
        {notFound && (
          <p className="mt-1 text-xs text-brand-red">
            Não achamos seu endereço no mapa: mostramos sua cidade primeiro, mas
            sem distância.
          </p>
        )}

        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_200px_auto]">
          <label className="relative">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs opacity-60" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Comida ou nome do estabelecimento"
              aria-label="Buscar por comida ou nome do estabelecimento"
              className={`${inputClass} pl-9`}
            />
          </label>
          <input
            type="search"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            placeholder="Cidade ou bairro"
            aria-label="Buscar por cidade ou bairro"
            className={inputClass}
          />
          {coords && (
            <select
              value={km}
              onChange={(e) => setKm(e.target.value)}
              aria-label="Distância máxima"
              className={`${inputClass} cursor-pointer`}
            >
              {DISTANCES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <section className="mt-6" aria-live="polite">
          {error ? (
            <p className="text-sm text-brand-red">
              Não foi possível carregar os estabelecimentos. Tente de novo.
            </p>
          ) : results === null ? (
            <p className="text-sm opacity-60">Carregando...</p>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-brand-line p-6 text-center">
              <p className="font-medium">
                Nenhum estabelecimento encontrado por aqui.
              </p>
              {km && (
                <button
                  onClick={() => setKm("")}
                  className="mt-3 cursor-pointer underline text-sm"
                >
                  Ver qualquer distância
                </button>
              )}
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {results.map((m) => (
                <li key={m.slug}>
                  <Link
                    href={`/menu/${m.slug}`}
                    className="block overflow-hidden rounded-2xl border border-brand-line bg-brand-surface transition hover:border-brand-red"
                  >
                    {/* metade de cima: faixa do banner (sem banner, faixa neutra do mesmo tamanho) */}
                    <span className="block h-16 bg-translucid">
                      {m.banner_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.banner_url}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </span>
                    {/* metade de baixo: foto do estabelecimento subindo sobre a faixa + dados */}
                    <span className="flex items-end gap-3 px-3 pb-2.5">
                      {m.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.logo_url}
                          alt=""
                          loading="lazy"
                          className="-mt-6 h-12 w-12 shrink-0 rounded-xl border-2 border-brand-surface bg-brand-surface object-cover"
                        />
                      ) : (
                        <span className="-mt-6 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-brand-surface bg-brand-surface">
                          <FaStore className="opacity-50" />
                        </span>
                      )}
                      <span className="min-w-0 pt-1.5">
                        <span className="block truncate font-semibold">
                          {m.title}
                        </span>
                        <span className="block truncate text-xs text-brand-muted">
                          {[
                            m.neighborhood,
                            [m.city, m.state].filter(Boolean).join(" - "),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                          {m.distance != null &&
                            ` · a ${m.distance.toLocaleString("pt-BR")} km`}
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <ScrollToTopButton />

      {showModal && (
        <AddressModal
          initial={address}
          onSave={saveAddress}
          onGps={locateByGps}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

function AddressModal({ initial, onSave, onGps, onClose }) {
  const [parts, setParts] = useState(initial || EMPTY_ADDRESS);
  const [gpsStatus, setGpsStatus] = useState("");
  const valid =
    parts.street?.trim() && parts.city?.trim() && parts.state?.trim();

  return (
    <GenericModal title="Onde você está?" onClose={onClose}>
      <p className="mb-3 text-sm text-brand-muted">
        Usamos seu endereço para mostrar primeiro os estabelecimentos da sua
        cidade. Ele também preenche seus pedidos e, se você tiver conta, fica
        salvo nela.
      </p>
      <AddressFields
        value={parts}
        onChange={setParts}
        inputClassName={inputClass}
      />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={async () => {
            setGpsStatus("loading");
            setGpsStatus((await onGps()) ? "" : "denied");
          }}
          className="flex cursor-pointer items-center gap-2 rounded-full border border-brand-line px-4 py-2 text-sm hover-bg-translucid"
        >
          <FaCrosshairs size={12} />{" "}
          {gpsStatus === "loading"
            ? "Localizando..."
            : "Usar minha localização"}
        </button>
        <button
          disabled={!valid}
          onClick={() => onSave(parts)}
          className="cursor-pointer rounded-full bg-verde px-4 py-2 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Salvar endereço
        </button>
      </div>
      {gpsStatus === "denied" && (
        <p className="mt-2 text-xs text-brand-red">
          Não foi possível obter sua localização.
        </p>
      )}
    </GenericModal>
  );
}
