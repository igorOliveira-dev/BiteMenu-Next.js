"use client";

import Image from "next/image";
import React from "react";
import logoTip from "../../../public/LogoTipo-sem-fundo.png";
import { FaWhatsapp } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

const page = () => {
  const callSupport = () => {
    const message = "Olá! Eu gostaria de falar com o suporte do Bite Menu!";

    const url = `https://wa.me/5514991085780?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col items-center justify-center absolute top-[50%] left-[50%] transform-[translate(-50%,-50%)] bg-translucid backdrop-blur-2xl border-2 border-translucid p-6 rounded-xl text-center min-w-[90dvw] sm:min-w-[460px] max-w-[520px]">
      <Image src={logoTip} alt="Bite Menu" className="absolute opacity-10 -z-[1]" />
      <h1 className="default-h1">Fale conosco!</h1>
      <p>Para suporte, dúvidas ou sugestões relacionadas ao Bite Menu, entre em contato pelo e-mail abaixo.</p>
      <a
        href="mailto:contato@bitemenu.com.br"
        className="cursor-pointer text-white flex items-center justify-center gap-2 rounded-lg mt-2 w-full p-2 sm:px-4 bg-blue-500 hover:bg-blue-600 transition font-bold"
      >
        <MdEmail fontSize={22} />
        contato@bitemenu.com.br
      </a>
      <p className="text-sm text-[var(--gray)] mt-4">Prefere o WhatsApp? Também te atendemos por lá.</p>
      <button
        onClick={() => callSupport()}
        className="cursor-pointer text-green-500 hover:text-green-600 flex items-center justify-center gap-2 rounded-lg mt-2 w-full p-2 sm:px-4 transition font-bold"
      >
        <FaWhatsapp fontSize={22} />
        Falar pelo WhatsApp
      </button>
      <p className="text-sm text-[var(--gray)] mt-1 cursor-pointer" onClick={() => callSupport()}>
        +55 14 99108-5780
      </p>
    </div>
  );
};

export default page;
