"use client";

import { useEffect, useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import AddressFields, { EMPTY_ADDRESS, formatAddress } from "@/components/AddressFields";
import { useAlert } from "@/providers/AlertProvider";
import useUser from "@/hooks/useUser";

const KEY = "customerInfo"; // mesma chave que o carrinho (CartDrawer) usa para preencher o pedido

// Dados de entrega deste aparelho: o carrinho já lê daqui ao fazer pedido
export default function PersonalInfo() {
  const customAlert = useAlert();
  const { profile } = useUser();
  const [info, setInfo] = useState({ name: "", phone: "", addressParts: EMPTY_ADDRESS });

  // Aparelho primeiro; o que faltar vem do cadastro (nome, telefone, CEP)
  useEffect(() => {
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch {}
    // endereço antigo em texto livre vira a rua, igual ao carrinho
    const addressParts = { ...EMPTY_ADDRESS, ...(saved.addressParts ?? { street: saved.address || "" }) };
    if (!addressParts.cep && profile?.cep) addressParts.cep = profile.cep;
    setInfo({
      name: saved.name || profile?.display_name || "",
      phone: saved.phone || (profile?.phone ? String(profile.phone) : ""),
      addressParts,
    });

    // Só com o CEP do cadastro: completa rua, bairro e cidade pelo ViaCEP
    if (addressParts.cep.length === 9 && !addressParts.street) {
      fetch(`https://viacep.com.br/ws/${addressParts.cep.replace("-", "")}/json/`)
        .then((res) => res.json())
        .then((data) => {
          if (data.erro) return;
          setInfo((prev) => ({
            ...prev,
            addressParts: {
              ...prev.addressParts,
              street: prev.addressParts.street || data.logradouro || "",
              neighborhood: prev.addressParts.neighborhood || data.bairro || "",
              city: prev.addressParts.city || data.localidade || "",
              state: prev.addressParts.state || data.uf || "",
            },
          }));
        })
        .catch(() => {});
    }
  }, [profile]);

  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...info, address: formatAddress(info.addressParts) }));
      customAlert("Informações salvas!", "success");
    } catch {
      customAlert("Não foi possível salvar neste navegador.", "error");
    }
  };

  const inputClass =
    "w-full px-3 py-2 bg-translucid border border-low-gray rounded-xl focus:outline-none focus:ring-2 focus:ring-bite";

  return (
    <div className="space-y-4 rounded-2xl border border-brand-line bg-translucid p-4">
      <p className="text-sm color-gray">Usadas para preencher seus pedidos automaticamente neste aparelho.</p>
      <div>
        <label className="mb-1 block text-sm font-medium">Nome</label>
        <input
          className={inputClass}
          value={info.name}
          maxLength={60}
          onChange={(e) => setInfo({ ...info, name: e.target.value })}
          placeholder="Nome para o pedido"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Telefone</label>
        <PhoneInput
          country="br"
          value={info.phone}
          onChange={(phone) => setInfo({ ...info, phone })}
          inputClass="!w-full !px-3 !py-2 !bg-[var(--translucid)] !border !border-[var(--low-gray)] !rounded-xl !pl-14"
          buttonClass="!border-r !border-[var(--low-gray)] !bg-[transparent] !rounded-l"
          containerClass="!flex !items-center"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Endereço de entrega</label>
        <AddressFields
          value={info.addressParts}
          onChange={(addressParts) => setInfo({ ...info, addressParts })}
          inputClassName={inputClass}
          canClear
        />
      </div>
      <div className="flex justify-end">
        <button
          onClick={save}
          className="cursor-pointer rounded-full bg-verde px-4 py-2 text-white transition hover:opacity-90"
        >
          Salvar
        </button>
      </div>
    </div>
  );
}
