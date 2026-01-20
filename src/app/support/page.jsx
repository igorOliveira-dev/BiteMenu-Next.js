"use client";

import Image from "next/image";
import React from "react";
import logoTip from "../../../public/LogoTipo-sem-fundo.png";
import { FaWhatsapp } from "react-icons/fa";

const page = () => {
  const callSupport = () => {
    const message = "Olá! Eu gostaria de falar com o suporte do Bite Menu!";

    const url = `https://wa.me/5514991085780?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col items-center justify-center absolute top-[50%] left-[50%] transform-[translate(-50%,-50%)] bg-translucid backdrop-blur-sm border-2 border-translucid p-6 rounded-xl text-center min-w-[90dvw] sm:min-w-[460px] max-w-[520px]">
      <Image src={logoTip} alt="Bite Menu" className="absolute opacity-10 -z-[1]" />
      <h1 className="default-h1">Fale conosco!</h1>
      <p>Para suporte, dúvidas ou sugestões relacionadas ao Bite Menu, envie uma mensagem pelo WhatsApp!</p>
      <button
        onClick={() => callSupport()}
        className="cursor-pointer text-white flex items-center justify-center gap-2 rounded-lg mt-2 w-full p-2 sm:px-4 bg-green-500 hover:bg-green-600 transition font-bold"
      >
        <FaWhatsapp fontSize={22} />
        Envie uma mensagem!
      </button>
      <p className="text-sm text-[var(--gray)] mt-1 cursor-pointer" onClick={() => callSupport()}>
        +55 14 99108-5780
      </p>
    </div>
  );
};

export default page;
