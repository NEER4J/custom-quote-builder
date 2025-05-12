import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import FormBuilderComponent from "@/components/form-builder/FormBuilder";

export default async function FormBuilderPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-4">Quote Form Builder</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Create customizable quote forms and export the code to use on your website.
        </p>
      </div>
      <FormBuilderComponent userId={user.id} />
    </div>
  );
} 