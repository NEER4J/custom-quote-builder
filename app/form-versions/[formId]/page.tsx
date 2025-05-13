import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeftIcon, CheckCircle, Clock, EyeIcon, HistoryIcon, RotateCcwIcon, TrashIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import VersionPreview from "@/components/form-builder/VersionPreview";
import DeleteConfirmation from "@/components/delete-confirmation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import RestoreButton from "@/components/form-builder/RestoreButton";

export default async function FormVersionsPage({
  params,
  searchParams,
}: {
  params: { formId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const formId = params.formId;
  const success = searchParams.success;
  const action = searchParams.action;
  
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
    .select("id, version_number, created_at, commit_message, created_by, form_data")
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

      {success && (
        <Alert variant="success" className="mb-4">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            {action === 'restore' ? 'Version has been restored successfully.' : 'Action completed successfully.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6 flex items-center gap-2">
        <HistoryIcon size={18} className="text-muted-foreground" />
        <h2 className="text-xl font-semibold">Version History</h2>
      </div>

      {versions && versions.length > 0 ? (
        <div className="space-y-4">
          {versions.map((version) => {
            // Add form title and description to form_data for preview
            if (version.form_data) {
              version.form_data.title = form.title;
              version.form_data.description = form.description;
            }
            
            return (
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
                  <VersionPreview formId={formId} version={version} />
                  
                  {version.version_number !== versions[0].version_number && (
                    <RestoreButton 
                      formId={formId}
                      versionId={version.id}
                    />
                  )}
                  
                  {versions.length > 1 && version.version_number !== versions[0].version_number && (
                    <DeleteConfirmation
                      id={version.id}
                      name={`Version ${version.version_number}`}
                      deleteAction={`/api/forms/${formId}/versions/${version.id}/delete`}
                      type="version"
                    />
                  )}
                </div>
              </div>
            );
          })}
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