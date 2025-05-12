import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClockIcon, PencilIcon, PlusIcon } from "lucide-react";

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
    <div className="container py-10 mx-auto animate-slide-up">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Your Forms</h1>
        <Link href="/protected/form-builder">
          <Button className="gap-1">
            <PlusIcon size={16} />
            New Form
          </Button>
        </Link>
      </div>
      
      {forms && forms.length > 0 ? (
        <div className="grid gap-4">
          {forms.map((form: any) => (
            <div 
              key={form.id} 
              className="border rounded-lg p-5 hover-scale card-shadow-lg bg-card"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold text-xl">
                    <Link 
                      href={`/protected/form-builder?id=${form.id}`}
                      className="hover:underline underline-offset-4"
                    >
                      {form.title}
                    </Link>
                  </h2>
                  <p className="text-muted-foreground mt-1">{form.description}</p>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <span>Last updated: {new Date(form.updated_at).toLocaleString()}</span>
                    {form.is_published && (
                      <span className="inline-flex items-center text-xs font-medium ml-2 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        Published
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
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
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg p-10 text-center bg-card card-shadow">
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-semibold mb-2">No forms yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first form to get started with Quote Builder.
            </p>
            <Link href="/protected/form-builder">
              <Button className="gap-1">
                <PlusIcon size={16} />
                Create Your First Form
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 