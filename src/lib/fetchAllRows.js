// Supabase/PostgREST corta respostas em 1000 linhas (max-rows padrão).
// Busca em blocos até vir um bloco incompleto. Ordem precisa ser estável (created_at + id).
// ponytail: N/1000 requests por carga; se ficar pesado, trocar por uma RPC de agregação (SUM/COUNT por mês) no banco.
const SUPABASE_MAX_ROWS = 1000;

export async function fetchAllRows(buildQuery) {
  const rows = [];
  for (let from = 0; ; from += SUPABASE_MAX_ROWS) {
    const { data, error } = await buildQuery().range(from, from + SUPABASE_MAX_ROWS - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < SUPABASE_MAX_ROWS) return rows;
  }
}
