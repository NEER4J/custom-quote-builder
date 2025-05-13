import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import FormBuilderComponent from "@/components/form-builder/FormBuilder";
import "./styles.css";

export default async function FormBuilderPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="flex-1 w-full flex flex-col max-w-7xl mx-auto gap-6">
      <FormBuilderComponent userId={user.id} />
    </div>
  );
} 