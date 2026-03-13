"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://www.bitemenu.com.br/update-password",
    });

    if (error) {
      setMessage("Não foi possível enviar o email de recuperação.");
      setLoading(false);
      return;
    }

    setMessage("Enviamos o link de recuperação. Verifique seu email.");
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Recuperar senha</h1>
        <p className="text-sm text-gray-600 mb-6">Digite o email da sua conta para receber o link de redefinição.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              className="w-full rounded-lg border px-3 py-2 outline-none"
            />
          </div>

          <button type="submit" disabled={loading} className="w-full rounded-lg border px-4 py-2 font-medium">
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </form>

        {message && <p className="mt-4 text-sm">{message}</p>}

        <div className="mt-4">
          <Link href="/login" className="text-sm underline">
            Voltar para o login
          </Link>
        </div>
      </div>
    </main>
  );
}
