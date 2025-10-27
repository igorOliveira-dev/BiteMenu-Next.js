"use client";
import Loading from "@/components/Loading";
import useUser from "@/hooks/useUser";
import { useEffect, useState } from "react";

export default function Layout({ children }) {
  const { loading, profile } = useUser();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (!loading && profile) {
      const role = profile.role;
      setUserRole(role);
    }
  }, [profile]);

  useEffect(() => {
    if (!loading && userRole !== "admin") {
      window.location.href = "/";
    }
  }, [userRole]);

  if (loading || userRole !== "admin") {
    return <Loading />;
  }

  return <main>{children}</main>;
}
