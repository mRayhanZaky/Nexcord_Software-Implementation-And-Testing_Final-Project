import { NextResponse } from "next/server";
import { isEmail } from "@/lib/auth/validation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request) {
  const { email } = await request.json();

  if (!isEmail(email ?? "")) {
    return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, secret_question")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  if (!data?.secret_question) {
    return NextResponse.json({ message: "No recovery question found for this email." }, { status: 404 });
  }

  return NextResponse.json({ userId: data.id, secretQuestion: data.secret_question });
}
