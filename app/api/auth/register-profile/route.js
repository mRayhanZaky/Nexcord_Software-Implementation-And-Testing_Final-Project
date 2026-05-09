import { NextResponse } from "next/server";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { hashSecretAnswer } from "@/lib/auth/secret";
import { isEmail, passwordError, usernameError } from "@/lib/auth/validation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request) {
  const body = await request.json();
  const {
    userId,
    fullName,
    username,
    email,
    phoneNumber,
    secretQuestion,
    secretAnswer,
    password,
  } = body;

  if (!userId) return NextResponse.json({ message: "Missing auth user id." }, { status: 400 });
  if (!fullName?.trim()) return NextResponse.json({ message: "Full name is required." }, { status: 400 });
  if (!isEmail(email)) return NextResponse.json({ message: "Invalid email address." }, { status: 400 });

  const usernameValidation = usernameError(username);
  if (usernameValidation) return NextResponse.json({ message: usernameValidation }, { status: 400 });

  const passwordValidation = passwordError(password ?? "");
  if (passwordValidation) return NextResponse.json({ message: passwordValidation }, { status: 400 });

  const parsedPhone = parsePhoneNumberFromString(phoneNumber ?? "");
  if (!parsedPhone?.isValid()) {
    return NextResponse.json({ message: "Invalid phone number." }, { status: 400 });
  }

  if (!secretQuestion || !secretAnswer?.trim()) {
    return NextResponse.json({ message: "Secret question and answer are required." }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { data: existingUsername } = await supabase
    .from("users")
    .select("id")
    .ilike("username", username)
    .neq("id", userId)
    .maybeSingle();

  if (existingUsername) {
    return NextResponse.json({ message: "Username is already taken." }, { status: 409 });
  }

  const { error } = await supabase.from("users").upsert({
    id: userId,
    full_name: fullName.trim(),
    display_name: fullName.trim(),
    username: username.trim(),
    email: email.trim().toLowerCase(),
    phone_number: parsedPhone.number,
    secret_question: secretQuestion,
    secret_answer_hash: hashSecretAnswer(secretAnswer),
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
