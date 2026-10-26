import "server-only"; // service role: o build quebra se isto for importado num client component
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
