import { NextResponse } from "next/server";
import { passwordError } from "@/lib/auth/validation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request) {
  const { userId, otp, password } = await request.json();

  if (!userId) return NextResponse.json({ message: "Missing recovery user." }, { status: 400 });
  if (String(otp ?? "").trim() !== "123456") {
    return NextResponse.json({ message: "Invalid verification code." }, { status: 401 });
  }

  const validation = passwordError(password ?? "");
  if (validation) return NextResponse.json({ message: validation }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  if (!data) {
    return NextResponse.json({ message: "Recovery session expired. Please verify your account again." }, { status: 404 });
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password });

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
