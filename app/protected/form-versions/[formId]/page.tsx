import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function FormVersionsPage({
  params,
}: {
  params: { formId: string };
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
    .select("id, title, description")
    .eq("id", params.formId)
    .single();

  if (formError || !form) {
    return notFound();
  }

  // Get form versions
  const { data: versions, error: versionsError } = await supabase
    .from("form_versions")
    .select("id, version_number, created_at, commit_message, created_by")
    .eq("form_id", params.formId)
    .order("version_number", { ascending: false });

  if (versionsError) {
    console.error("Error fetching versions:", versionsError);
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{form.title} - Version History</h1>
          <p className="text-muted-foreground">{form.description}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/protected/form-builder?id=${params.formId}`}>
            <Button variant="outline">Edit Form</Button>
          </Link>
          <Link href="/protected/dashboard">
            <Button variant="ghost">Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>
            View and restore previous versions of your form
          </CardDescription>
        </CardHeader>
        <CardContent>
          {versions && versions.length > 0 ? (
            <div className="space-y-4">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="p-4 border rounded-md flex justify-between items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Version {version.version_number}</span>
                      {version.version_number === versions[0].version_number && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          Latest
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {version.commit_message || "No commit message"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(version.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/protected/form-preview/${params.formId}/${version.id}`}>
                      <Button variant="outline" size="sm">
                        Preview
                      </Button>
                    </Link>
                    {version.version_number !== versions[0].version_number && (
                      <form action={`/api/forms/${params.formId}/restore/${version.id}`} method="POST">
                        <Button type="submit" variant="outline" size="sm">
                          Restore
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No version history found for this form.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 