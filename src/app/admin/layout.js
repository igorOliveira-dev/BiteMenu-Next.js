"use client";
import Loading from "@/components/Loading";
import useUser from "@/hooks/useUser";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// designer: vê cardápios, planos e pesquisa de perfil, nada de pagamento
const DESIGNER_PATHS = ["/admin", "/admin/pesquisa-de-perfil"];

export default function Layout({ children }) {
  const { loading, profile } = useUser();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (!loading && profile) {
      const role = profile.role;
      setUserRole(role);
    }
  }, [profile]);

  const allowed = userRole === "admin" || (userRole === "designer" && DESIGNER_PATHS.includes(pathname));

  useEffect(() => {
    if (!loading && !allowed) {
      window.location.href = "/";
    }
  }, [userRole, pathname]);

  if (loading || !allowed) {
    return <Loading />;
  }

  return <main>{children}</main>;
}
