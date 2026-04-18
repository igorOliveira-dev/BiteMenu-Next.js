import Link from "next/link";
import Image from "next/image";
import logoMark from "../../../../../public/LogoMarca-sem-fundo.png";

export default function MenuFooter({ bgColor, translucidToUse, grayToUse, foregroundToUse }) {
  return (
    <footer className="w-full" style={{ color: foregroundToUse, backgroundColor: bgColor }}>
      {/* Bloco informativo compacto */}
      <div className="p-6" style={{ backgroundColor: translucidToUse }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="w-[220px] flex flex-col items-center gap-1">
            <Link href="https://www.bitemenu.com.br" className="flex justify-center">
              <Image src={logoMark} height={40} width={140} alt="Bite Menu" />
            </Link>
            <Link href="/register" className="text-xs hover:underline" style={{ color: grayToUse }}>
              Crie seu cardápio digital grátis →
            </Link>
          </div>

          <div className="flex flex-col md:flex-row justify-center items-center gap-2 gap-x-4 text-sm w-[220px]">
            <Link href="/politica-de-privacidade" className="hover:underline">
              Política de Privacidade
            </Link>
            <Link href="/support" className="hover:underline">
              Suporte
            </Link>
          </div>

          <div className="text-xs text-center md:text-right w-[220px]" style={{ color: grayToUse }}>
            © {new Date().getFullYear()} Bite Menu. <br /> Todos os direitos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
}
