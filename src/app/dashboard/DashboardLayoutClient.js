"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { hasMenu } from "@/lib/queries/menus";
import { getStaff } from "@/lib/staff";
import Loading from "@/components/Loading";
import useUser from "@/hooks/useUser";
import BrandLogo from "@/components/BrandLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { FaBolt } from "react-icons/fa";
import PrivacyAcceptModal from "@/components/PrivacyAcceptModal";
import { CURRENT_PRIVACY_VERSION } from "@/lib/privacy";
import useAcquisitionSourceModal from "@/hooks/useAcquisitionSourceModal";
import AcquisitionSourceModal from "@/app/dashboard/components/AcquisitionSourceModal";
import LegacyPlanModal from "@/app/dashboard/components/LegacyPlanModal";

export default function DashboardLayoutClient({ children }) {
  const router = useRouter();
  const { user, profile, loading } = useUser();
  const [checkingMenu, setCheckingMenu] = useState(true);
  const [ownerPlan, setOwnerPlan] = useState(null);
  const [showPlanButton, setShowPlanButton] = useState(false);
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const acquisitionModal = useAcquisitionSourceModal(profile);

  useEffect(() => {
    const checkUserMenu = async () => {
      if (!user) {
        // se user é null e loading já acabou → redireciona login
        if (!loading) router.replace("/login");
        return;
      }

      try {
        const { data: menus } = await hasMenu(supabase, user.id);

        if (!menus || menus.length === 0) {
          const { data: staff } = await getStaff(supabase, user.id);
          router.replace(staff ? "/equipe" : "/getstart");
          return;
        }

        setCheckingMenu(false);
      } catch (err) {
        console.error("Erro ao buscar menus:", err);
        setCheckingMenu(false);
      }
    };

    checkUserMenu();
  }, [user, loading, router]);

  useEffect(() => {
    if (user && profile) {
      setOwnerPlan(profile.role);
    }
  }, [user, profile]);

  useEffect(() => {
    if (loading) return;
    if (!profile) return;
    const needsAccept = !profile.privacy_accepted_at || profile.privacy_policy_version !== CURRENT_PRIVACY_VERSION;
    setShowPrivacyModal(needsAccept);
  }, [loading, profile]);

  useEffect(() => {
    if (window.location.pathname === "/dashboard") {
      if (ownerPlan === "free" || ownerPlan === "plus") {
        setShowPlanButton(true);
      } else {
        setShowPlanButton(false);
      }
      if (ownerPlan === "pro" || ownerPlan === "business") {
        setShowDownloadButton(true);
      } else {
        setShowDownloadButton(false);
      }
    }
  }, [ownerPlan]);

  // Registrar último acesso ao menu
  useEffect(() => {
    const registerLastAccess = async () => {
      if (!user || checkingMenu) return;

      try {
        await supabase.from("menus").update({ last_access_at: new Date().toISOString() }).eq("owner_id", user.id);
      } catch (err) {
        console.error("Erro ao registrar último acesso:", err);
      }
    };

    registerLastAccess();
  }, [user, checkingMenu]);

  if (loading || checkingMenu) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <>
      <header className="z-10 backdrop-blur-xl flex items-center fixed top-0 w-[calc(100%-20px)] justify-between py-1.5 pl-4 pr-1.5 m-2 my-3 bg-brand-surface/85 border border-brand-line rounded-full">
        <div className="hidden xs:block">
          <BrandLogo as="a" href="/dashboard" />
        </div>
        <div className="block xs:hidden">
          <BrandLogo as="a" href="/dashboard" showName={false} />
        </div>

        <div className="flex items-center gap-2">
          {/* botao de melhorar plano */}
          {showPlanButton ? (
            <a href="/dashboard/pricing" className="cta-button small has-icon">
              <span className="hidden xxs:block">
                <FaBolt />
              </span>
              Melhorar plano!
            </a>
          ) : null}

          {showDownloadButton ? (
            <a href="/downloads" className="cta-button small has-icon">
              APP Bite Menu
            </a>
          ) : null}

          {/* troca de temas */}
          <ThemeToggle />
        </div>
      </header>
      <main>{children}</main>
      {showPrivacyModal && user && (
        <PrivacyAcceptModal
          userId={user.id}
          onAccepted={() => setShowPrivacyModal(false)}
          onClose={() => setShowPrivacyModal(false)}
        />
      )}
      {!showPrivacyModal && <LegacyPlanModal profile={profile} />}
      {acquisitionModal.show && !showPrivacyModal && (
        <AcquisitionSourceModal onClose={acquisitionModal.onClose} onSubmit={acquisitionModal.onSubmit} />
      )}
    </>
  );
}
