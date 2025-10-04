import Link from "next/link";
import logoMark from "../../../../../public/LogoMarca-sem-fundo.png";
import Image from "next/image";

export default function MenuFooter() {
  return (
    <footer className="bg-translucid p-6 mt-10 border-t border-gray-300 dark:border-gray-700 w-full">
      <div className="max-w-6xl flex flex-col md:flex-row justify-between items-center gap-4 relative left-[50%] transform-[translatex(-50%)]">
        {/* Nome do cardápio */}
        <div className="w-[220px] flex justify-center">
          <Image src={logoMark} height={40} width={140} alt="Bite Menu" />
        </div>

        {/* Links */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-2 gap-x-4 text-sm w-[220px]">
          <Link href="/privacy" className="hover:underline">
            Política de Privacidade
          </Link>
          <Link href="/support" className="hover:underline">
            Suporte
          </Link>
        </div>

        {/* Direitos */}
        <div className="text-xs text-gray-500 text-center md:text-right w-[220px]">
          © {new Date().getFullYear()} Bite Menu. <br /> Todos os direitos reservados.
        </div>
      </div>

      {/* Criado por Bite Menu */}
      <div className="mt-4 text-center text-xs text-gray-400">
        Criado por{" "}
        <Link href="https://bitemenu.com.br" target="_blank" className="underline">
          Bite Menu
        </Link>
      </div>
    </footer>
  );
}
