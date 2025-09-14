import Image from "next/image";
import React from "react";
import bitemenu from "../../public/LogoMarca-sem-fundo.png";
import Link from "next/link";

const notFound = () => {
  return (
    <div className="w-[100dvw] h-[100dvh] flex flex-col items-center justify-center">
      <div className="w-60 h-16 relative mb-4">
        <Image src={bitemenu} alt="Bite Menu" fill />
      </div>
      <div className="flex items-center gap-4">
        <h1>404</h1>
        <hr className="border h-6"></hr>
        <h2>Esta página não existe</h2>
      </div>
      <Link className="underline text-blue-500 hover:text-blue-700" href="/">
        Voltar à página inicial
      </Link>
    </div>
  );
};

export default notFound;
