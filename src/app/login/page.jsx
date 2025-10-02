"use client";

import LogoMark from "../../../public/LogoMarca-sem-fundo.png";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import { useAlert } from "@/providers/AlertProvider";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const customAlert = useAlert();

  useEffect(() => {
    if (error != null) {
      customAlert(error, "error");
      setError(null);
    }
  }, [error]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === "Invalid login credentials") {
          setError("Email ou senha inválidos. Verifique suas credenciais.");
        } else {
          setError("Ocorreu um erro ao fazer login. Tente novamente.");
        }
        setLoading(false);
        return;
      }

      // Salvar cookies da sessão para o middleware reconhecer
      await fetch("/api/auth/supabase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "SIGNED_IN", session: data.session }),
      });

      // Redireciona para getstart (middleware depois decide se vai pro dashboard)
      router.push("/getstart");
    } catch (err) {
      console.error(err);
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] flex items-center justify-center">
      <div className="max-w-[350px] w-full rounded-lg mt-6 p-6 space-y-6 bg-translucid shadow-[0_0_40px_var(--shadow)]">
        <h1 className="text-2xl font-semibold text-center mb-6">Login</h1>
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              name="email"
              className="w-[300px] px-3 py-2 bg-translucid border border-[var(--low-gray)] rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              type="email"
              placeholder="Seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Senha</label>
            <input
              name="password"
              className="w-[300px] px-3 py-2 bg-translucid border border-[var(--low-gray)] rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <p className="text-center">
              Ainda não tem uma conta?{" "}
              <Link href="/register" className="underline text-blue-500 hover:text-blue-700">
                Registre-se
              </Link>
            </p>
          </div>

          <button
            className="w-full py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center max-h-[40px]"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="w-6 h-6 border-3 -rotate-45 border-[var(--foreground)] border-t-transparent rounded-full animate-[spin_1s_cubic-bezier(0.3,0,0.5,1)_infinite]"></div>
              </div>
            ) : (
              "Entrar"
            )}
          </button>
        </form>
      </div>
      <div className="ml-20 text-center max-w-[500px] hidden lg:block">
        <Image src={LogoMark} alt="Bite Menu" height={130} width={500} />
        <h2 style={{ fontSize: "30px" }}>Que bom te ter de volta! Entre na sua conta e administre seu cardápio.</h2>
      </div>
    </div>
  );
}
