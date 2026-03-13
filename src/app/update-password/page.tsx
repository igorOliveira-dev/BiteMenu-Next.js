"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function UpdatePasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [canReset, setCanReset] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setCanReset(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setCanReset(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (password.length < 6) {
      setMessage("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage("Não foi possível atualizar a senha.");
      setLoading(false);
      return;
    }

    setMessage("Senha atualizada com sucesso! Redirecionando...");
    setLoading(false);

    setTimeout(() => {
      router.push("/login");
    }, 1500);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Definir nova senha</h1>
        <p className="text-sm text-gray-600 mb-6">Escolha uma nova senha para acessar sua conta.</p>

        {!canReset ? (
          <p className="text-sm">Abra esta página pelo link enviado no email de recuperação.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Nova senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 outline-none"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                Confirmar nova senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 outline-none"
              />
            </div>

            <button type="submit" disabled={loading} className="w-full rounded-lg border px-4 py-2 font-medium">
              {loading ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        )}

        {message && <p className="mt-4 text-sm">{message}</p>}
      </div>
    </main>
  );
}
