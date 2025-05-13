import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { formId: string; versionId: string } }
) {
  const { formId, versionId } = params;
  const supabase = await createClient();

  // Check user authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Get the version data
    const { data: versionData, error: versionError } = await supabase
      .from("form_versions")
      .select("form_data, version_number")
      .eq("id", versionId)
      .single();

    if (versionError || !versionData) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    // 2. Get the form to verify ownership
    const { data: formData, error: formError } = await supabase
      .from("forms")
      .select("user_id")
      .eq("id", formId)
      .single();

    if (formError || !formData) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // 3. Verify ownership
    if (formData.user_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to modify this form" },
        { status: 403 }
      );
    }

    // 4. Create a new version with a copy of the restored data
    const { error: insertError } = await supabase.from("form_versions").insert({
      form_id: formId,
      form_data: versionData.form_data,
      created_by: user.id,
      commit_message: `Restored from version ${versionData.version_number}`,
    });

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to restore version" },
        { status: 500 }
      );
    }

    // 5. Update form details if needed from the restored data
    if (versionData.form_data.title && versionData.form_data.description) {
      const { error: updateError } = await supabase
        .from("forms")
        .update({
          title: versionData.form_data.title,
          description: versionData.form_data.description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", formId);

      if (updateError) {
        console.error("Error updating form details:", updateError);
      }
    }

    return NextResponse.redirect(
      new URL(`/form-builder?id=${formId}`, request.url)
    );
  } catch (error) {
    console.error("Error restoring form version:", error);
    return NextResponse.json(
      { error: "Failed to restore version" },
      { status: 500 }
    );
  }
} 