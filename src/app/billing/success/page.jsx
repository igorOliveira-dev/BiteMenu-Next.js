"use client";
import SuccessClient from "./SuccessClient";

// Garantir que a página não será prerenderizada
export const dynamic = "force-dynamic";

export default function Page() {
  return <SuccessClient />;
}
