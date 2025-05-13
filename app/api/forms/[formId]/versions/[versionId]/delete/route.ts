import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(
  req: NextRequest,
  { params }: { params: { formId: string; versionId: string } }
) {
  console.log("Delete version API called with params:", params);
  const { formId, versionId } = params;
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log("Unauthorized attempt to delete version - no user");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the form to verify ownership
    const { data: form, error: formError } = await supabase
      .from("forms")
      .select("user_id")
      .eq("id", formId)
      .single();

    if (formError) {
      console.log("Error fetching form:", formError);
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (!form || form.user_id !== user.id) {
      console.log("Unauthorized attempt to delete version - not owner", form?.user_id, user.id);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if this version is published
    const { data: publishedCheck, error: publishedError } = await supabase
      .from("forms")
      .select("published_version_id")
      .eq("id", formId)
      .single();

    if (publishedError) {
      console.log("Error checking if version is published:", publishedError);
      return NextResponse.json({ error: "Failed to check published status" }, { status: 500 });
    }

    if (publishedCheck && publishedCheck.published_version_id === versionId) {
      console.log("Cannot delete published version");
      return NextResponse.json(
        { error: "Cannot delete a published version" },
        { status: 400 }
      );
    }

    // Verify the version exists before attempting to delete
    const { data: versionCheck, error: versionCheckError } = await supabase
      .from("form_versions")
      .select("id")
      .eq("id", versionId)
      .eq("form_id", formId)
      .single();

    if (versionCheckError || !versionCheck) {
      console.log("Version not found or doesn't belong to this form:", versionCheckError);
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Delete the specific version
    const { error: deleteError } = await supabase
      .from("form_versions")
      .delete()
      .eq("id", versionId);

    if (deleteError) {
      console.error("Error deleting version:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete version", details: deleteError.message },
        { status: 500 }
      );
    }

    console.log("Version deleted successfully:", versionId);

    // After deleting, revalidate the versions page
    revalidatePath(`/form-versions/${formId}`);
    
    // Redirect with success message
    const redirectUrl = new URL(`/form-versions/${formId}`, req.url);
    redirectUrl.searchParams.set('success', 'true');
    redirectUrl.searchParams.set('action', 'delete');
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Unexpected error deleting version:", error);
    return NextResponse.json(
      { error: "Failed to delete version", details: String(error) },
      { status: 500 }
    );
  }
} 