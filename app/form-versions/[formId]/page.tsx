import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, Clock, EyeIcon, HistoryIcon, RotateCcwIcon } from "lucide-react";

export default async function FormVersionsPage({
  params,
}: {
  params: { formId: string };
}) {
  const formId = params.formId;
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
    .select("id, title, description")
    .eq("id", formId)
    .single();

  if (formError || !form) {
    return notFound();
  }

  // Get form versions
  const { data: versions, error: versionsError } = await supabase
    .from("form_versions")
    .select("id, version_number, created_at, commit_message, created_by")
    .eq("form_id", formId)
    .order("version_number", { ascending: false });

  if (versionsError) {
    console.error("Error fetching versions:", versionsError);
  }

  return (
    <div className="container py-10 max-w-4xl mx-auto animate-slide-up">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeftIcon size={14} />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">{form.title}</h1>
          </div>
          <p className="text-muted-foreground">{form.description}</p>
        </div>
        <Link href={`/form-builder?id=${formId}`}>
          <Button variant="outline">Edit Form</Button>
        </Link>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <HistoryIcon size={18} className="text-muted-foreground" />
        <h2 className="text-xl font-semibold">Version History</h2>
      </div>

      {versions && versions.length > 0 ? (
        <div className="space-y-4">
          {versions.map((version) => (
            <div
              key={version.id}
              className="border rounded-lg p-5 hover-scale card-shadow bg-card flex flex-col md:flex-row justify-between md:items-center gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-lg">Version {version.version_number}</span>
                  {version.version_number === versions[0].version_number && (
                    <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">
                      Latest
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground">
                  {version.commit_message || "No commit message"}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <Clock size={14} className="text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {new Date(version.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/form-preview/${formId}/${version.id}`}>
                  <Button variant="outline" size="sm" className="gap-1">
                    <EyeIcon size={14} />
                    Preview
                  </Button>
                </Link>
                {version.version_number !== versions[0].version_number && (
                  <form action={`/api/forms/${formId}/restore/${version.id}`} method="POST">
                    <Button type="submit" variant="outline" size="sm" className="gap-1">
                      <RotateCcwIcon size={14} />
                      Restore
                    </Button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg p-10 text-center bg-card card-shadow">
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-semibold mb-2">No version history</h3>
            <p className="text-muted-foreground mb-6">
              When you make changes to your form, version history will appear here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 