"use client";

import { useState } from "react";

export const EMPTY_ADDRESS = {
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

const formatCep = (v) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

// formato padrão: "Rua X, 120, Apto 2 - Centro, Cidade - UF, 01234-567"
export function formatAddress(a) {
  const t = (s) => (s || "").trim();
  if (!t(a?.street)) return "";
  let out = [t(a.street), t(a.number) || "S/N", t(a.complement)].filter(Boolean).join(", ");
  if (t(a.neighborhood)) out += ` - ${t(a.neighborhood)}`;
  const city = [t(a.city), t(a.state).toUpperCase()].filter(Boolean).join(" - ");
  if (city) out += `, ${city}`;
  if (t(a.cep).length === 9) out += `, ${t(a.cep)}`;
  return out;
}

export const mapsUrl = (address) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

// canClear: mostra "Limpar endereço" mesmo com os campos vazios (ex.: endereço antigo em texto livre)
export default function AddressFields({
  value,
  onChange,
  inputClassName = "",
  inputStyle,
  hideNeighborhood = false,
  canClear = false,
}) {
  const [cepStatus, setCepStatus] = useState("");
  const a = { ...EMPTY_ADDRESS, ...value };
  const set = (patch) => onChange({ ...a, ...patch });

  const lookupCep = async (cep) => {
    setCepStatus("loading");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep.replace("-", "")}/json/`);
      const data = await res.json();
      if (data.erro) throw new Error("CEP não encontrado");
      set({
        cep,
        street: data.logradouro || a.street,
        neighborhood: data.bairro || a.neighborhood,
        city: data.localidade || a.city,
        state: data.uf || a.state,
      });
      setCepStatus("");
    } catch {
      setCepStatus("error");
    }
  };

  const input = (key, placeholder, props = {}) => (
    <input
      type="text"
      value={a[key]}
      placeholder={placeholder}
      aria-label={placeholder}
      onChange={(e) => set({ [key]: e.target.value })}
      className={inputClassName}
      style={inputStyle}
      {...props}
    />
  );

  return (
    <div className="grid grid-cols-6 gap-2">
      <div className="col-span-6">
        {input("cep", "CEP (preenche o resto)", {
          inputMode: "numeric",
          onChange: (e) => {
            const cep = formatCep(e.target.value);
            set({ cep });
            setCepStatus("");
            if (cep.length === 9) lookupCep(cep);
          },
        })}
        {cepStatus === "loading" && <p className="mt-1 text-xs opacity-60">Buscando CEP...</p>}
        {cepStatus === "error" && (
          <p className="mt-1 text-xs text-red-500">CEP não encontrado, preencha os campos manualmente.</p>
        )}
      </div>
      <div className="col-span-6">{input("street", "Rua / Avenida", { maxLength: 100 })}</div>
      <div className="col-span-2">
        {input("number", "Nº ou S/N", {
          maxLength: 10,
          onBlur: () => !a.number.trim() && set({ number: "S/N" }),
        })}
      </div>
      <div className="col-span-4">{input("complement", "Complemento (opcional)", { maxLength: 50 })}</div>
      {!hideNeighborhood && <div className="col-span-6">{input("neighborhood", "Bairro", { maxLength: 60 })}</div>}
      <div className="col-span-4">{input("city", "Cidade", { maxLength: 60 })}</div>
      <div className="col-span-2">
        {input("state", "UF", {
          maxLength: 2,
          onChange: (e) => set({ state: e.target.value.toUpperCase() }),
        })}
      </div>
      {(canClear || Object.values(a).some((v) => v)) && (
        <div className="col-span-6 text-right">
          <button
            type="button"
            className="cursor-pointer text-xs underline opacity-70 hover:opacity-100"
            onClick={() => {
              setCepStatus("");
              onChange({ ...EMPTY_ADDRESS });
            }}
          >
            Limpar endereço
          </button>
        </div>
      )}
    </div>
  );
}
