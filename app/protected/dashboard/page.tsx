import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClockIcon, PencilIcon } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch forms for the user
  const { data: forms, error } = await supabase
    .from("forms")
    .select("id, title, description, updated_at, is_published")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Your Forms</h1>
        <Link href="/protected/form-builder">
          <Button>+ New Form</Button>
        </Link>
      </div>
      <div className="bg-white rounded shadow p-6">
        {forms && forms.length > 0 ? (
          <ul className="divide-y">
            {forms.map((form: any) => (
              <li key={form.id} className="py-4 flex justify-between items-center">
                <div>
                  <h2 className="font-semibold text-lg">
                    <Link href={`/protected/form-builder?id=${form.id}`}>{form.title}</Link>
                  </h2>
                  <p className="text-sm text-muted-foreground">{form.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Last updated: {new Date(form.updated_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {form.is_published && <span className="text-green-600 font-medium">Published</span>}
                  <Link href={`/protected/form-versions/${form.id}`}>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <ClockIcon size={14} />
                      History
                    </Button>
                  </Link>
                  <Link href={`/protected/form-builder?id=${form.id}`}>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <PencilIcon size={14} />
                      Edit
                    </Button>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-muted-foreground">No forms yet. Click "+ New Form" to create your first form.</div>
        )}
      </div>
    </div>
  );
} 