import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function GET(request, { params }) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin.from("orders").select("*").eq("id", id).maybeSingle();

  if (error || !data) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  return Response.json(data);
}
