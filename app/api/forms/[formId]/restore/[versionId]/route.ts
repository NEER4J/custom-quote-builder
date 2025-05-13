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

    // Get the version to restore
    const { data: version } = await supabase
      .from("form_versions")
      .select("form_data, version_number")
      .eq("id", versionId)
      .eq("form_id", formId)
      .single();

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Create a new version from the version to restore
    await supabase.from("form_versions").insert({
      form_id: formId,
      form_data: version.form_data,
      created_by: user.id,
      commit_message: `Restored from version ${version.version_number}`,
    });

    // Revalidate the versions page
    revalidatePath(`/form-versions/${formId}`);
    
    // Redirect with success message
    const redirectUrl = new URL(`/form-versions/${formId}`, req.url);
    redirectUrl.searchParams.set('success', 'true');
    redirectUrl.searchParams.set('action', 'restore');
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Error restoring version:", error);
    return NextResponse.json(
      { error: "Failed to restore version" },
      { status: 500 }
    );
  }
} 