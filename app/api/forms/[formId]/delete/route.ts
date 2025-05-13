import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(
  req: NextRequest,
  { params }: { params: { formId: string } }
) {
  const formId = params.formId;
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // First, delete all versions of the form
    await supabase
      .from("form_versions")
      .delete()
      .eq("form_id", formId);

    // Then, delete the form itself
    await supabase
      .from("forms")
      .delete()
      .eq("id", formId)
      .eq("user_id", user.id); // Ensures users can only delete their own forms

    // Revalidate the dashboard page
    revalidatePath("/dashboard");
    
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (error) {
    console.error("Error deleting form:", error);
    return NextResponse.json(
      { error: "Failed to delete form" },
      { status: 500 }
    );
  }
} 