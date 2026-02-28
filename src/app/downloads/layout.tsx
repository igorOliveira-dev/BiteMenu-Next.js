"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useUser from "@/hooks/useUser";
import Loading from "@/components/Loading";
import { useAlert } from "@/providers/AlertProvider";

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, profile, loading } = useUser();
  const customAlert = useAlert();
  const [alertTriggered, setAlertTriggered] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    if (!profile) return; // ESPERA profile existir

    const role = profile.role?.trim().toLowerCase();

    const allowed = role === "pro" || role === "admin";

    if (!allowed) {
      if (!alertTriggered) {
        customAlert("Você precisa ser um usuário Plus ou Pro para baixar o aplicativo do Bite Menu.", "slow");
        setAlertTriggered(true);
      }

      router.replace("/dashboard/pricing");
    }
  }, [user, profile, loading]);

  if (loading || !user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  const allowed = profile.role === "plus" || profile.role === "pro" || profile.role === "admin";

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
