import { NextResponse } from "next/server";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { isEmail } from "@/lib/auth/validation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request) {
  const { method, identifier } = await request.json();
  const cleanIdentifier = String(identifier ?? "").trim();

  if (!["email", "phone"].includes(method)) {
    return NextResponse.json({ message: "Choose email or phone verification." }, { status: 400 });
  }

  if (method === "email" && !isEmail(cleanIdentifier)) {
    return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  }

  const parsedPhone = method === "phone" ? parsePhoneNumberFromString(cleanIdentifier, "ID") : null;
  if (method === "phone" && !parsedPhone?.isValid()) {
    return NextResponse.json({ message: "Enter a valid phone number with country code." }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  let query = supabase
    .from("users")
    .select("id, email, phone_number");

  query =
    method === "email"
      ? query.eq("email", cleanIdentifier.toLowerCase())
      : query.eq("phone_number", parsedPhone.number);

  const { data, error } = await query.maybeSingle();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ message: `No account found for that ${method}.` }, { status: 404 });
  }

  return NextResponse.json({
    userId: data.id,
    contact: method === "email" ? data.email : data.phone_number,
    message: "Verification code prepared. For now, use 123456.",
  });
}
