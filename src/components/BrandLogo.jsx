import Image from "next/image";
import Link from "next/link";

import logo from "../../public/brand/logo-sino.png";

export default function BrandLogo({ as: Component = Link, href = "/", showName = true, large = false, onClick = undefined }) {
  return (
    <Component
      href={href}
      onClick={onClick}
      aria-label="Bite Menu"
      className={`flex items-center text-brand-red ${large ? "gap-3" : "gap-2"}`}
    >
      <Image src={logo} alt="" width={large ? 68 : 34} height={large ? 66 : 33} />
      {showName && (
        <span className={`font-extrabold tracking-tight ${large ? "text-4xl sm:text-5xl" : "text-xl"}`}>Bite Menu</span>
      )}
    </Component>
  );
}
