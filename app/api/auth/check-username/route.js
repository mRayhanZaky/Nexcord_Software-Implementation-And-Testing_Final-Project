import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { usernameError } from "@/lib/auth/validation";

export async function GET(request) {
  const username = request.nextUrl.searchParams.get("username")?.trim();
  const validationError = usernameError(username);

  if (validationError) {
    return NextResponse.json({ available: false, message: validationError }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .ilike("username", username)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ available: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    available: !data,
    message: data ? "Username is already taken." : "Username is available.",
  });
}
