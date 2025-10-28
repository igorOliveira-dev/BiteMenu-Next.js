export default function CancelPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold">Pagamento cancelado 😢</h1>
      <p>Você pode tentar novamente ou voltar para o dashboard.</p>
      <a href="/dashboard" className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
        Voltar ao Dashboard
      </a>
    </div>
  );
}
