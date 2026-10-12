"use client";

import { useEffect, useState } from "react";
import { FaChevronLeft, FaKey, FaTrash, FaCopy } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";
import useMenu, { updateCachedMenu } from "@/hooks/useMenu";
import { updateMenuById } from "@/lib/queries/menus";
import { useAlert } from "@/providers/AlertProvider";
import { useConfirm } from "@/providers/ConfirmProvider";
import { STAFF_PLAN_ROLES, STAFF_ROLES } from "@/lib/staff";
import UpdatePlanModal from "./components/UpdatePlanModal";
import Loading from "@/components/Loading";

export async function staffApi(method, body) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const res = await fetch("/api/staff", {
    method,
    headers: { Authorization: `Bearer ${session?.access_token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Erro inesperado");
  return data;
}

const fieldClass = "w-full p-2 rounded-lg bg-translucid border-2 border-[var(--translucid)]";

// Liga/desliga cada tela; desligada, os logins daquela função perdem acesso (staff_menu_id no banco)
const SCREENS = [
  { field: "cashier_enabled", label: "Tela do caixa", desc: "Logins de caixa acessam os pedidos" },
  {
    field: "kitchen_enabled",
    label: "Tela da cozinha",
    desc: "Logins de cozinha acessam a fila de preparo; nos Pedidos aparecem as etapas e o atalho da tela",
  },
  {
    field: "delivery_enabled",
    label: "Tela de entregas",
    desc: "Logins de entregador acessam os pedidos de entrega; nos Pedidos aparecem as etapas e o atalho da tela",
  },
];

// Logins da equipe (Business): caixa vê os pedidos, cozinha a fila de preparo, entregador as entregas
const Team = ({ setSelectedTab }) => {
  const { profile } = useUser();
  const { menu } = useMenu();
  const [screens, setScreens] = useState({});
  const customAlert = useAlert();
  const confirm = useConfirm();
  const allowed = STAFF_PLAN_ROLES.includes(profile?.role);

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", role: "caixa", password: "" });
  const [saving, setSaving] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  useEffect(() => {
    if (menu) setScreens(Object.fromEntries(SCREENS.map(({ field }) => [field, menu[field]])));
  }, [menu]);

  const toggleScreen = async (field, value) => {
    if (!allowed) return setShowPlanModal(true);

    setScreens((prev) => ({ ...prev, [field]: value }));
    const { error } = await updateMenuById(supabase, menu.id, { [field]: value });
    if (error) {
      setScreens((prev) => ({ ...prev, [field]: !value }));
      return customAlert("Erro ao atualizar a tela.", "error");
    }
    updateCachedMenu({ [field]: value });
    customAlert(value ? "Tela ativada!" : "Tela desativada.", "success");
  };

  useEffect(() => {
    staffApi("GET")
      .then(setStaff)
      .catch((err) => customAlert(err.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!allowed) return setShowPlanModal(true);

    setSaving(true);
    try {
      const row = await staffApi("POST", form);
      setStaff((prev) => [...prev, row]);
      setForm({ name: "", role: "caixa", password: "" });
      customAlert(`Login criado! Usuário: ${row.login}`, "success");
    } catch (err) {
      customAlert(err.message, "error");
    }
    setSaving(false);
  };

  const resetPassword = async (member) => {
    const password = window.prompt(`Nova senha para ${member.name} (mínimo 6 caracteres):`);
    if (!password) return;
    try {
      await staffApi("PATCH", { user_id: member.user_id, password });
      customAlert("Senha alterada!", "success");
    } catch (err) {
      customAlert(err.message, "error");
    }
  };

  const remove = async (member) => {
    if (!(await confirm(`Remover o login de ${member.name}?`))) return;
    try {
      await staffApi("DELETE", { user_id: member.user_id });
      setStaff((prev) => prev.filter((m) => m.user_id !== member.user_id));
      customAlert("Login removido.", "success");
    } catch (err) {
      customAlert(err.message, "error");
    }
  };

  const copyLogin = (login) =>
    navigator.clipboard
      .writeText(login)
      .then(() => customAlert("Usuário copiado!"))
      .catch(() => customAlert("Erro ao copiar", "error"));

  return (
    <div className="pt-2 px-4 md:m-auto lg:m-0 max-w-[812px] min-h-[calc(100dvh-110px)] overflow-y-auto rounded-2xl">
      <div className="flex items-center mb-2">
        <button
          type="button"
          className="p-2 rounded-lg hover:bg-[var(--translucid)] transition cursor-pointer"
          onClick={() => setSelectedTab("account")}
          aria-label="Voltar"
        >
          <FaChevronLeft />
        </button>
        <h2 className="ml-2 text-xl font-semibold">Equipe</h2>
      </div>
      <p className="text-sm color-gray mb-4">
        Crie logins para seus funcionários. O <strong>caixa</strong> vê e gerencia os pedidos; a <strong>cozinha</strong>{" "}
        vê a fila de preparo e marca os pedidos como prontos; o <strong>entregador</strong> vê as entregas com endereço
        e marca a saída e a entrega. Nenhum deles acessa cardápio, vendas ou plano. Eles entram em
        bitemenu.com.br/login com o usuário e a senha que você definir.
      </p>

      <div className="bg-translucid border-2 border-[var(--translucid)] rounded-2xl p-4 mb-4 flex flex-col gap-3">
        {SCREENS.map(({ field, label, desc }) => (
          <label key={field} className="flex cursor-pointer items-center gap-3">
            <span className="switch shrink-0">
              <input
                type="checkbox"
                checked={screens[field] === true}
                onChange={(e) => toggleScreen(field, e.target.checked)}
              />
              <span className="slider" />
            </span>
            <span>
              <span className="block font-medium">{label}</span>
              <span className="block text-xs color-gray">{desc}</span>
            </span>
          </label>
        ))}
      </div>

      <form
        onSubmit={create}
        className="bg-translucid border-2 border-[var(--translucid)] rounded-2xl p-4 mb-4 grid gap-3 sm:grid-cols-3"
      >
        <label className="text-sm">
          Nome
          <input
            className={fieldClass}
            value={form.name}
            maxLength={40}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex.: João"
            required
          />
        </label>
        <label className="text-sm">
          Função
          <select
            className={fieldClass}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {Object.entries(STAFF_ROLES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Senha
          <input
            className={fieldClass}
            type="text"
            autoComplete="new-password"
            value={form.password}
            minLength={6}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Mínimo 6 caracteres"
            required
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="sm:col-span-3 cursor-pointer px-4 py-2 bg-green-600 text-white rounded-lg transition hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? "Criando..." : "Criar login"}
        </button>
      </form>

      {loading ? (
        <Loading />
      ) : staff.length === 0 ? (
        <p className="p-6 text-center color-gray">Nenhum funcionário cadastrado.</p>
      ) : (
        <div className="bg-translucid border-2 border-[var(--translucid)] rounded-2xl divide-y divide-[var(--translucid)]">
          {staff.map((member) => (
            <div key={member.user_id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-semibold truncate">
                  {member.name} <span className="text-sm font-normal color-gray">· {STAFF_ROLES[member.role]}</span>
                </p>
                <button
                  type="button"
                  onClick={() => copyLogin(member.login)}
                  title="Copiar usuário"
                  className="cursor-pointer flex items-center gap-2 text-sm color-gray break-all text-left"
                >
                  {member.login} <FaCopy className="shrink-0" />
                </button>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => resetPassword(member)}
                  title="Nova senha"
                  aria-label="Nova senha"
                  className="cursor-pointer p-2 rounded-lg hover:bg-[var(--translucid)] transition"
                >
                  <FaKey />
                </button>
                <button
                  type="button"
                  onClick={() => remove(member)}
                  title="Remover"
                  aria-label="Remover"
                  className="cursor-pointer p-2 rounded-lg text-red-500 hover:bg-[var(--translucid)] transition"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPlanModal && (
        <UpdatePlanModal
          onClose={() => setShowPlanModal(false)}
          title="Logins da equipe"
          text="Crie logins de caixa, cozinha e entregador para sua equipe acompanhar os pedidos sem acessar o resto do painel."
          plan="business"
        />
      )}
    </div>
  );
};

export default Team;
