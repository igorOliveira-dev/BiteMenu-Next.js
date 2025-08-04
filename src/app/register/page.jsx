"use client";

import LogoMark from "../../../public/LogoMarca-sem-fundo.png";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const rawValue = `+${phone}`;
      const phoneNumber = parsePhoneNumberFromString(rawValue);
      if (!phoneNumber || !phoneNumber.isValid()) {
        setError("Telefone inválido.");
        return;
      }

      const fullPhone = phoneNumber.number.replace(/^\+/, "");
      setLoading(true);

      // 1. Verifica duplicidade de telefone
      const { data: existingPhone } = await supabase.from("profiles").select("id").eq("phone", fullPhone).single();

      if (existingPhone) {
        setError("Email ou telefone já em uso.");
        setLoading(false);
        return;
      }

      // 2. Cria usuário
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        if (error.message === "User already registered") {
          setError("Email ou telefone já em uso.");
        } else {
          setError("Não foi possível cadastrar. Tente novamente.");
        }
        console.log(error.message);
        setLoading(false);
        return;
      }

      // 3. Cria profile
      const user = data.user;
      if (user) {
        const { error: insertError } = await supabase
          .from("profiles")
          .insert([{ id: user.id, email: user.email, display_name: displayName, phone: fullPhone }]);

        if (insertError) {
          setError("Erro inesperado. Tente novamente.");
          console.log(insertError.message);
          setLoading(false);
          return;
        }

        // 4. Registro completo
        router.replace("/getstart");
      }
    } catch (err) {
      setError("Erro inesperado. Por favor, tente novamente mais tarde.");
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] flex items-center justify-center">
      <div className="max-w-[350px] w-full rounded-lg mt-6 p-6 space-y-6 bg-translucid shadow-[0_0_40px_var(--shadow)]">
        <h1 className="text-2xl font-semibold text-center mb-6">Cadastro</h1>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input
              className="w-[300px] px-3 py-2 bg-translucid border border-low-gray rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              type="text"
              placeholder="Seu nome completo"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <div className="w-[300px]">
              <PhoneInput
                country="br"
                value={phone}
                onChange={(value) => setPhone(value)}
                inputProps={{ required: true }}
                inputClass="!w-[300px] !px-3 !py-2 !bg-[var(--translucid)] !border !border-[var(--low-gray)] !rounded !focus:outline-none !focus:ring-2 !focus:ring-blue-400 !pl-14"
                buttonClass="!border-r !border-[var(--low-gray)] !bg-[transparent] !rounded-l !hover:bg-[var(--low-gray)]"
                containerClass="!w-[300px] flex items-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              className="w-[300px] px-3 py-2 bg-translucid border border-low-gray rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
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
              className="w-[300px] px-3 py-2 bg-translucid border border-low-gray rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <p className="text-center">
              Já tem uma conta?{" "}
              <Link href="/login" className="underline text-blue-500 hover:text-blue-700">
                Faça login
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
              "Registrar"
            )}
          </button>

          {error && <p className="text-red-600 text-center mt-2">{error}</p>}
        </form>
      </div>
      <div className="ml-20 text-center max-w-[500px] hidden lg:block">
        <h2 style={{ fontSize: "40px", fontWeight: "bold", transform: "translateY(50%)" }}>Bem vindo ao</h2>
        <Image src={LogoMark} alt="Bite Menu" height={130} width={500} />
        <h2 style={{ fontSize: "30px" }}>Cadastre-se e comece a criar seu cardápio em minutos!</h2>
      </div>
    </div>
  );
}
