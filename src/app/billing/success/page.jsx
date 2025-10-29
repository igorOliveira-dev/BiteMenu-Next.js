import SuccessClient from "./SuccessClient";

// Evita prerendering e força render dinâmico
export const dynamic = "force-dynamic";

export default function Page() {
  return <SuccessClient />;
}
