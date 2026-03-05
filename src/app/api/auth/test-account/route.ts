import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const supabase = createAdminClient();
    const testEmail = "test@duizhang.app";
    const testPassword = "test123456";

    // Check if test account already exists
    const { data: existing } = await supabase.auth.admin.listUsers();
    const exists = existing?.users?.find((u) => u.email === testEmail);

    if (exists) {
      return NextResponse.json({
        success: true,
        email: testEmail,
        password: testPassword,
        message: "Test account already exists",
      });
    }

    // Create test account with confirmed email
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { name: "Test User" },
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Also insert into our users table
    await supabase.from("users").upsert({
      id: data.user.id,
      email: testEmail,
      name: "Test User",
      lang: "zh",
      plan: "free",
    });

    return NextResponse.json({
      success: true,
      email: testEmail,
      password: testPassword,
      message: "Test account created",
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
