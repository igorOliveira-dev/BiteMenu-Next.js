import Image from "next/image";
import Link from "next/link";

import logo from "../../public/brand/logo-sino.png";

export default function BrandLogo({ as: Component = Link, href = "/", showName = true }) {
  return (
    <Component href={href} aria-label="Bite Menu" className="flex items-center gap-2 text-brand-red">
      <Image src={logo} alt="" width={34} height={33} />
      {showName && <span className="text-xl font-extrabold tracking-tight">Bite Menu</span>}
    </Component>
  );
}
