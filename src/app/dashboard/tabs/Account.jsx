"use client";

import React, { useState, useEffect } from "react";
import useUser from "@/hooks/useUser";
import { FaChevronLeft, FaPen } from "react-icons/fa";
import Loading from "@/components/Loading";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { supabase } from "@/lib/supabaseClient";
import { useAlert } from "@/providers/AlertProvider";
import { useConfirm } from "@/providers/ConfirmProvider";
import GenericModal from "@/components/GenericModal";

const Account = ({ setSelectedTab }) => {
  const { profile, loading } = useUser();
  const customAlert = useAlert();
  const confirm = useConfirm();

  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [name, setName] = useState(profile?.display_name);
  const [tempName, setTempName] = useState(profile?.display_name);

  const [phone, setPhone] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const [saving, setSaving] = useState(false);

  // quando o profile carregar, preenche o telefone
  useEffect(() => {
    if (profile?.phone) {
      const phoneStr = String(profile.phone);
      setPhone(phoneStr);
      setOriginalPhone(phoneStr); // valor inicial
    }
    if (profile?.display_name) {
      setName(profile.display_name);
      setTempName(profile.display_name);
    }
  }, [profile]);

  async function handleLogout() {
    const ok = await confirm("Quer mesmo sair da sua conta?");
    if (!ok) {
      console.log("[submit] usuário cancelou");
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Erro ao sair:", error.message);
    } else {
      console.log("Logout realizado com sucesso");
      window.location.href = "/login";
    }
  }

  const handleSaveName = async () => {
    if (!tempName.trim()) {
      customAlert("O nome não pode ficar vazio.", "error");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: tempName.trim() }).eq("id", profile.id);

    if (error) {
      console.error(error.message);
      customAlert("Não foi possível atualizar o nome.", "error");
    } else {
      customAlert("Nome atualizado com sucesso!", "success");
      setName(tempName);
      setTempName(tempName);
    }
    setSaving(false);
    setNameModalOpen(false);
  };

  const handleSavePhone = async () => {
    try {
      const rawValue = `+${phone}`;
      const phoneNumber = parsePhoneNumberFromString(rawValue);
      if (!phoneNumber || !phoneNumber.isValid()) {
        customAlert("Telefone inválido.", "error");
        return;
      }

      const fullPhone = phoneNumber.number.replace(/^\+/, "");
      setSaving(true);

      const { error } = await supabase.from("profiles").update({ phone: fullPhone }).eq("id", profile.id);

      if (error) {
        if (error.message.includes("duplicate key")) {
          customAlert("Esse telefone já está em uso.", "error");
        } else {
          customAlert("Não foi possível atualizar o telefone.", "error");
        }
      } else {
        customAlert("Telefone atualizado com sucesso!", "success");
        setOriginalPhone(phone);
      }
    } catch (err) {
      console.error(err);
      customAlert("Erro inesperado ao salvar telefone.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <div className="p-2">
        <div className="flex items-center mb-4">
          <div onClick={() => setSelectedTab("menu")}>
            <FaChevronLeft className="cursor-pointer" />
          </div>
          <h2 className="ml-2 xs:font-semibold">Conta</h2>
        </div>

        <div className="bg-translucid border-2 border-[var(--translucid)] rounded-lg p-4 max-w-[720px]">
          <div className="px-2 ">
            <div className="border-b-2 border-[var(--translucid)] pb-4">
              <div className="flex items-center gap-2">
                <p className="default-h1 font-bold line-clamp-1">{name}</p>
                <div onClick={() => setNameModalOpen(true)} className="cursor-pointer px-2">
                  <FaPen />
                </div>
              </div>

              {/* email */}
              <p className="color-gray">{profile?.email}</p>
            </div>

            <div className="flex gap-4 border-b-2 border-[var(--translucid)] xs:items-center pb-4 mt-4 flex-col xs:flex-row">
              {/* plano */}
              <div className="mt-4 min-w-[170px] xs:text-center flex flex-col xs:items-center xs:border-r-2 xs:pr-4 border-r-0 pr-0 border-b-2 xs:border-b-0 pb-4 xs:pb-0 border-[var(--translucid)]">
                <p className="color-gray text-sm">Plano atual:</p>
                <p className="capitalize default-h1">{profile?.role}</p>
                <p
                  className="text-sm mt-1 bg-translucid cursor-pointer p-2 rounded-lg border-2 border-translucid max-w-[180px] text-center hover:opacity-80 transition"
                  onClick={() => setSelectedTab("planDetails")}
                >
                  Detalhes do plano
                </p>
              </div>

              {/* Telefone */}
              <div className="mt-4">
                <label className="block text-sm color-gray mb-1">Telefone:</label>
                <div className="flex gap-2 items-center">
                  <div className="flex-shrink">
                    <PhoneInput
                      country="br"
                      value={phone}
                      onChange={(value) => setPhone(value)}
                      inputProps={{ required: true }}
                      inputClass="!w-[220px] !px-3 !py-2 !bg-[var(--translucid)] !border !border-[var(--low-gray)] !rounded !focus:outline-none !focus:ring-2 !focus:ring-blue-400 !pl-14"
                      buttonClass="!border-r !border-[var(--low-gray)] !bg-[transparent] !rounded-l !hover:bg-[var(--low-gray)]"
                      containerClass="!flex !items-center"
                    />
                  </div>
                  {phone !== originalPhone && (
                    <button
                      onClick={handleSavePhone}
                      disabled={saving}
                      className="cursor-pointer px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {saving ? "Salvando..." : "Salvar"}
                    </button>
                  )}
                </div>
                <p className="text-sm color-gray pt-1">Este é o número em que você receberá os pedidos.</p>
              </div>
            </div>

            {/* sair */}
            <button
              className="mt-4 text-white cursor-pointer bg-red-600/70 hover:bg-red-600/90 border-2 border-[var(--translucid)] rounded-lg p-2 transition"
              onClick={handleLogout}
            >
              Sair da conta
            </button>
            {profile?.role === "admin" && (
              <a href="/admin" className="ml-2 underline color-gray">
                Admin page
              </a>
            )}
          </div>
        </div>
      </div>
      {nameModalOpen && (
        <GenericModal onClose={() => setNameModalOpen(false)} maxWidth={"420px"} wfull>
          <div className="flex items-center gap-4 mb-4">
            <FaChevronLeft className="cursor-pointer" onClick={() => setNameModalOpen(false)} />
            <h3 className="font-bold">Alterar nome</h3>
          </div>
          <input
            type="text"
            placeholder="Novo nome"
            value={tempName ?? ""}
            maxLength={40}
            onChange={(e) => setTempName(e.target.value)}
            className="w-full p-2 rounded border bg-translucid mb-4"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setTempName(name);
                setNameModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded"
            >
              Cancelar
            </button>
            <button onClick={handleSaveName} className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </GenericModal>
      )}
    </>
  );
};

export default Account;
