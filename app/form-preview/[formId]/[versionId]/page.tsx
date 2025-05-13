import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import FormPreview from "@/components/form-builder/FormPreview";

export default async function FormVersionPreviewPage({
  params,
}: {
  params: { formId: string; versionId: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get form details
  const { data: form, error: formError } = await supabase
    .from("forms")
    .select("id, title, description, user_id")
    .eq("id", params.formId)
    .single();

  if (formError || !form) {
    return notFound();
  }

  // Verify ownership or collaboration permissions
  if (form.user_id !== user.id) {
    // Check if user is a collaborator (if you implement collaboration feature)
    return redirect("/dashboard");
  }

  // Get the specific version
  const { data: version, error: versionError } = await supabase
    .from("form_versions")
    .select("id, form_data, version_number, created_at")
    .eq("id", params.versionId)
    .eq("form_id", params.formId)
    .single();

  if (versionError || !version) {
    return notFound();
  }

  // Create a complete form state
  const formState = {
    title: form.title,
    description: form.description,
    questions: version.form_data.questions || [],
    settings: version.form_data.settings || {
      backgroundColor: "#ffffff",
      buttonColor: "#3b82f6",
      submitUrl: "",
      zapierWebhookUrl: "",
    },
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {form.title} - Version {version.version_number} Preview
          </h1>
          <p className="text-sm text-muted-foreground mb-1">{form.description}</p>
          <p className="text-xs text-muted-foreground">
            Created on {new Date(version.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/form-versions/${params.formId}`}>
            <Button variant="outline">Back to History</Button>
          </Link>
          <form action={`/api/forms/${params.formId}/restore/${params.versionId}`} method="POST">
            <Button type="submit" variant="default">
              Restore This Version
            </Button>
          </form>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow">
        <FormPreview formState={formState} />
      </div>
    </div>
  );
} 