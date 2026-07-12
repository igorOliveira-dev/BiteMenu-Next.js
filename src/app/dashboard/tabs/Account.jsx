"use client";

import React, { useState, useEffect } from "react";
import useUser from "@/hooks/useUser";
import { FaChevronLeft, FaPen, FaChevronRight } from "react-icons/fa";
import Loading from "@/components/Loading";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { supabase } from "@/lib/supabaseClient";
import { useAlert } from "@/providers/AlertProvider";
import { useConfirm } from "@/providers/ConfirmProvider";
import GenericModal from "@/components/GenericModal";
import ActionMenu from "@/components/ActionMenu";
import ActionsMenu from "@/components/ActionMenu";

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

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [tempEmail, setTempEmail] = useState(profile?.email);

  // quando o profile carregar, preenche o telefone
  useEffect(() => {
    if (profile?.phone) {
      const phoneStr = String(profile.phone);
      setPhone(phoneStr);
      setOriginalPhone(phoneStr);
    }
    if (profile?.display_name) {
      setName(profile.display_name);
      setTempName(profile.display_name);
    }
    if (profile?.email) {
      setTempEmail(profile.email); // adicionado
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

  const handleSaveEmail = async () => {
    const trimmed = tempEmail.trim();

    // validação simples de formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      customAlert("Digite um email válido.", "error");
      return;
    }

    if (trimmed === profile.email) {
      setEmailModalOpen(false);
      return;
    }

    setSaving(true);

    const { error } = await supabase.auth.updateUser(
      { email: trimmed },
      { emailRedirectTo: "https://www.bitemenu.com.br/dashboard" },
    );

    if (error) {
      console.error(error.message);
      if (error.message.toLowerCase().includes("already registered")) {
        customAlert("Esse email já está em uso.", "error");
      } else {
        customAlert("Não foi possível atualizar o email.", "error");
      }
    } else {
      customAlert("Verifique sua caixa de entrada para confirmar o novo email.", "success");
      setEmailModalOpen(false);
    }

    setSaving(false);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <div className="p-2 max-w-[720px]">
        <div className="flex items-center mb-4">
          <button
            type="button"
            className="p-2 rounded hover:bg-[var(--translucid)] transition cursor-pointer"
            onClick={() => setSelectedTab("menu")}
            aria-label="Voltar"
          >
            <FaChevronLeft />
          </button>
          <h2 className="ml-2 text-xl font-semibold">Conta</h2>
        </div>

        <div className="bg-translucid border-2 border-[var(--translucid)] rounded-2xl divide-y divide-[var(--translucid)]">
          {/* Perfil */}
          <div className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="default-h1 font-bold line-clamp-1">{name}</p>
              <p className="color-gray text-sm break-all">{profile?.email}</p>
            </div>
            <ActionsMenu
              options={[
                {
                  label: "Alterar nome",
                  icon: <FaPen size={13} />,
                  onClick: () => setNameModalOpen(true),
                },
                {
                  label: "Alterar email",
                  icon: <FaPen size={13} />,
                  onClick: () => setEmailModalOpen(true),
                },
              ]}
            />
          </div>

          {/* Plano */}
          <button
            type="button"
            onClick={() => setSelectedTab("planDetails")}
            className="flex w-full items-center justify-between gap-3 p-4 text-left cursor-pointer transition hover:bg-[var(--translucid)]"
          >
            <div>
              <p className="text-sm color-gray">Plano atual</p>
              <p className="capitalize text-lg font-semibold">{profile?.role}</p>
            </div>
            <span className="flex items-center gap-2 text-sm color-gray">
              Detalhes do plano <FaChevronRight />
            </span>
          </button>

          {/* Telefone */}
          <div className="p-4">
            <label className="block text-sm color-gray mb-2">Telefone</label>
            <div className="flex flex-wrap gap-2 items-center">
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
                  className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded-lg transition hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              )}
            </div>
          </div>

          {/* Sair */}
          <div className="flex items-center gap-3 p-4">
            <button
              className="text-white cursor-pointer bg-red-600/70 hover:bg-red-600/90 border-2 border-[var(--translucid)] rounded-lg px-4 py-2 transition"
              onClick={handleLogout}
            >
              Sair da conta
            </button>
            {profile?.role === "admin" && (
              <a href="/admin" className="underline color-gray">
                Admin page
              </a>
            )}
          </div>
        </div>
      </div>
      {nameModalOpen && (
        <GenericModal title="Alterar nome" onClose={() => setNameModalOpen(false)} maxWidth={"420px"} wfull>
          <input
            type="text"
            placeholder="Novo nome"
            value={tempName ?? ""}
            maxLength={40}
            onChange={(e) => setTempName(e.target.value)}
            className="w-full p-3 rounded-lg border border-[var(--translucid)] bg-translucid mb-4 outline-none transition focus:border-red-500/70"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setTempName(name);
                setNameModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded-lg transition hover:opacity-80"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveName}
              className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded-lg transition hover:bg-green-700"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </GenericModal>
      )}
      {emailModalOpen && (
        <GenericModal title="Alterar email" onClose={() => setEmailModalOpen(false)} maxWidth={"420px"} wfull>
          <input
            type="email"
            placeholder="Novo email"
            value={tempEmail ?? ""}
            onChange={(e) => setTempEmail(e.target.value)}
            className="w-full p-3 rounded-lg border border-[var(--translucid)] bg-translucid mb-2 outline-none transition focus:border-red-500/70"
          />
          <p className="text-xs color-gray mb-4">Você precisará confirmar a alteração pelo link enviado ao novo email.</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setTempEmail(profile.email);
                setEmailModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded-lg transition hover:opacity-80"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveEmail}
              disabled={saving}
              className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded-lg transition hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </GenericModal>
      )}
    </>
  );
};

export default Account;
