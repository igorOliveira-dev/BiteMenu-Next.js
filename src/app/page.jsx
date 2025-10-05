import Image from "next/image";
import logoMark from "../../public/LogoMarca-sem-fundo.png";
import logoTip from "../../public/LogoTipo-sem-fundo.png";
import ThemeToggle from "@/components/ThemeToggle";
import menuCelular from "../../public/bitemenuCelular.png";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="h-[100dvh]" id="begin">
        <header className="fixed inset-x-0 flex items-center justify-between p-2 m-2 my-3 bg-translucid rounded-lg shadow-[0_0_10px_var(--shadow)] z-10 backdrop-blur-sm">
          <Image src={logoMark} height={50} width={180} alt="Bite Menu" />
          <ThemeToggle />
        </header>
        <div className="p-2 flex items-center justify-center md:justify-around h-full flex-col md:flex-row">
          <div className="pt-50 md:pt-0 text-center sm:text-start">
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-[var(--red)]">Bite Menu</h1>
            <h2>Crie e gerencie seu cardápio digital!</h2>
            <p className="color-gray mb-6 max-w-[400px]">
              Com Bite Menu você constrói a presença online do seus estabelecimento em poucos minutos!
            </p>
            <Link className="plan-button" href="register">
              Comece grátis!
            </Link>
          </div>
          <div className="scale-70 md:scale-90 lg:scale-100 transform-[translate(15%,-10%)] md:transform-none">
            <Image src={logoTip} alt="Bite Menu" className="absolute opacity-20 -z-[1] transform-[translate(-30%,20%)]" />
            <Image src={menuCelular} alt="Cardápio do Bite Menu no celular" height={462} width={300} />
          </div>
        </div>
      </section>
      <footer className="bg-translucid p-6 mt-6 border-t border-gray-300 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logos */}
          <div className="flex items-center gap-4">
            <Image src={logoMark} height={40} width={140} alt="Bite Menu" />
          </div>

          {/* Links */}
          <div className="flex flex-col md:flex-row items-center gap-2 gap-x-4 text-sm">
            <Link href="/politica-de-privacidade" className="hover:underline">
              Política de Privacidade
            </Link>
            <Link href="support" className="hover:underline">
              Suporte
            </Link>
          </div>

          {/* Direitos */}
          <div className="text-xs text-gray-500">© {new Date().getFullYear()} Bite Menu. Todos os direitos reservados.</div>
        </div>
      </footer>
    </main>
  );
}
