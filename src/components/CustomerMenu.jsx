"use client";

import { useRouter } from "next/navigation";
import { FaUser, FaReceipt, FaSignOutAlt, FaCompass, FaGift } from "react-icons/fa";
import ActionsMenu from "@/components/ActionMenu";
import { supabase } from "@/lib/supabaseClient";
import { useAlert } from "@/providers/AlertProvider";
import { useConfirm } from "@/providers/ConfirmProvider";

// Círculo da conta do cliente na navbar: Descobrir, Perfil, Histórico de pedidos, Fidelidades e Sair
export default function CustomerMenu({ profile }) {
  const router = useRouter();
  const customAlert = useAlert();
  const confirm = useConfirm();
  const initial = (profile?.display_name || profile?.email || "?").trim().charAt(0).toUpperCase();

  async function handleLogout() {
    if (!(await confirm("Quer mesmo sair da sua conta?"))) return;
    const { error } = await supabase.auth.signOut();
    if (error) return customAlert("Não foi possível sair. Tente novamente.", "error");
    window.location.reload(); // fica onde está (ex.: no cardápio); /conta manda pro login sozinho
  }

  return (
    <ActionsMenu
      ariaLabel="Abrir opções da conta"
      buttonClassName="flex h-9 w-9 items-center justify-center rounded-full bg-brand-red font-semibold text-white transition hover:opacity-90"
      options={[
        { label: "Descobrir estabelecimentos", icon: <FaCompass size={13} />, onClick: () => router.push("/descobrir") },
        { label: "Perfil", icon: <FaUser size={13} />, onClick: () => router.push("/conta") },
        { label: "Histórico de pedidos", icon: <FaReceipt size={13} />, onClick: () => router.push("/conta?aba=pedidos") },
        { label: "Fidelidades", icon: <FaGift size={13} />, onClick: () => router.push("/conta?aba=fidelidades") },
        { label: "Sair", icon: <FaSignOutAlt size={13} />, onClick: handleLogout, danger: true },
      ]}
    >
      {initial}
    </ActionsMenu>
  );
}
