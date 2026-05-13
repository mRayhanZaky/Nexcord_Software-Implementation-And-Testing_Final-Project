import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request) {
  const { email, password, userId } = await request.json();

  if (!email || !password || !userId) {
    return NextResponse.json({ message: "Email, password, and user id are required." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ message: "Supabase public credentials are not configured." }, { status: 500 });
  }

  const verifier = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await verifier.auth.signInWithPassword({ email, password });

  if (error || data.user?.id !== userId) {
    return NextResponse.json({ message: "Password confirmation failed." }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);

  if (deleteError) {
    return NextResponse.json({ message: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
