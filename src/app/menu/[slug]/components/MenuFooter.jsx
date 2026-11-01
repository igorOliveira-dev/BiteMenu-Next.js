import Link from "next/link";
import Image from "next/image";
import logo from "../../../../../public/brand/logo-sino.png";
import { contrastRatio, getContrastTextColor } from "@/utils/color";

const BITE_RED = "#d42020";

export default function MenuFooter({ bgColor, translucidToUse, grayToUse, foregroundToUse }) {
  // Vermelho quando dá para ler sobre a cor do dono; senão, versão monocromática
  const background = bgColor || "#ffffff";
  const useRed = contrastRatio(background, BITE_RED) >= 3;
  const monoIsWhite = getContrastTextColor(background) === "white";

  return (
    <footer className="w-full" style={{ color: foregroundToUse, backgroundColor: bgColor }}>
      {/* Bloco informativo compacto */}
      <div className="p-6" style={{ backgroundColor: translucidToUse }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="w-[220px] flex flex-col items-center gap-1">
            <Link
              href="https://www.bitemenu.com.br"
              aria-label="Bite Menu"
              className="flex items-center justify-center gap-2"
              style={{ color: useRed ? BITE_RED : monoIsWhite ? "#ffffff" : "#000000" }}
            >
              <Image
                src={logo}
                alt=""
                width={34}
                height={33}
                style={useRed ? undefined : { filter: monoIsWhite ? "brightness(0) invert(1)" : "brightness(0)" }}
              />
              <span className="text-xl font-extrabold tracking-tight">Bite Menu</span>
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
