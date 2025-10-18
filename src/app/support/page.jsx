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
    <div className="flex flex-col items-center justify-center absolute top-[50%] left-[50%] transform-[translate(-50%,-50%)] bg-translucid p-6 rounded-xl text-center min-w-[90dvw] sm:min-w-[460px]">
      <Image src={logoTip} alt="Bite Menu" className="absolute opacity-10 -z-[1]" />
      <h1 className="default-h1">Suporte</h1>
      <p>O suporte do Bite Menu é feito diretamente via WhatsApp!</p>
      <button
        onClick={() => callSupport()}
        className="cursor-pointer flex items-center justify-center gap-2 rounded-lg mt-2 w-full p-2 sm:px-4 bg-green-500 hover:bg-green-600 transition font-bold"
      >
        <FaWhatsapp fontSize={22} />
        Envie uma mensagem!
      </button>
    </div>
  );
};

export default page;
