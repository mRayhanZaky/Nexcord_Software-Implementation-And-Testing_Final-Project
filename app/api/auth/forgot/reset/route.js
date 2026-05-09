import { NextResponse } from "next/server";
import { passwordError } from "@/lib/auth/validation";
import { verifySecretAnswer } from "@/lib/auth/secret";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request) {
  const { userId, secretAnswer, password } = await request.json();

  if (!userId) return NextResponse.json({ message: "Missing recovery user." }, { status: 400 });

  const validation = passwordError(password ?? "");
  if (validation) return NextResponse.json({ message: validation }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("secret_answer_hash")
    .eq("id", userId)
    .maybeSingle();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  if (!verifySecretAnswer(secretAnswer, data?.secret_answer_hash)) {
    return NextResponse.json({ message: "Secret answer does not match." }, { status: 401 });
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password });

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
