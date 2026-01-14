export default function CancelPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold">Pagamento cancelado</h1>
      <p className="text-center px-2">Você pode tentar novamente ou voltar para o dashboard.</p>
      <div className="flex flex-wrap items-center justify-around gap-2 mx-4">
        <a
          href="/pricing"
          className="mt-4 px-4 py-2 bg-[var(--translucid)] rounded hover:opacity-80 transition w-[200px] text-center"
        >
          Tentar novamente
        </a>
        <a
          href="/dashboard"
          className="mt-4 px-4 py-2 bg-[var(--translucid)] rounded hover:opacity-80 transition w-[200px] text-center"
        >
          Voltar ao Dashboard
        </a>
      </div>
    </div>
  );
}
