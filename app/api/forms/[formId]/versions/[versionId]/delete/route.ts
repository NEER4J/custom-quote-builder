import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(
  req: NextRequest,
  { params }: { params: { formId: string; versionId: string } }
) {
  const { formId, versionId } = params;
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the form to verify ownership
    const { data: form } = await supabase
      .from("forms")
      .select("user_id")
      .eq("id", formId)
      .single();

    if (!form || form.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the specific version
    await supabase
      .from("form_versions")
      .delete()
      .eq("id", versionId)
      .eq("form_id", formId);

    // After deleting, revalidate the versions page
    revalidatePath(`/form-versions/${formId}`);
    
    return NextResponse.redirect(new URL(`/form-versions/${formId}`, req.url));
  } catch (error) {
    console.error("Error deleting version:", error);
    return NextResponse.json(
      { error: "Failed to delete version" },
      { status: 500 }
    );
  }
} 