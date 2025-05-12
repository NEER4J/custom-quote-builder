"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormDesigner from "./FormDesigner";
import FormPreview from "./FormPreview";
import CodeExport from "./CodeExport";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

type FormBuilderProps = {
  userId: string;
};

const FormBuilder = ({ userId }: FormBuilderProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formId = searchParams.get("id");
  const [formState, setFormState] = useState({
    title: "My Quote Form",
    description: "Get a quote by answering the following questions",
    questions: [],
    settings: {
      backgroundColor: "#ffffff",
      buttonColor: "#3b82f6",
      submitUrl: "",
      zapierWebhookUrl: "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load form if editing
  useEffect(() => {
    if (formId) {
      (async () => {
        try {
          const supabase = createClient();
          console.log("Loading form with ID:", formId);
          
          // First, get the form basic details
          const { data: formData, error: formError } = await supabase
            .from("forms")
            .select("id, title, description")
            .eq("id", formId)
            .single();
            
          if (formError) {
            console.error("Error loading form:", formError);
            return;
          }
          
          // Then, get the latest version separately
          const { data: versionData, error: versionError } = await supabase
            .from("form_versions")
            .select("id, form_data, version_number")
            .eq("form_id", formId)
            .order("version_number", { ascending: false })
            .limit(1)
            .single();
            
          if (versionError) {
            console.error("Error loading form version:", versionError);
            return;
          }
          
          console.log("Loaded form data:", formData);
          console.log("Loaded version data:", versionData);
          
          if (formData && versionData && versionData.form_data) {
            // Create a new state with both form metadata and form content
            const newFormState = {
              title: formData.title,
              description: formData.description,
              questions: versionData.form_data.questions || [],
              settings: versionData.form_data.settings || {
                backgroundColor: "#ffffff",
                buttonColor: "#3b82f6",
                submitUrl: "",
                zapierWebhookUrl: "",
              },
            };
            
            console.log("Setting form state to:", newFormState);
            setFormState(newFormState);
          }
        } catch (error) {
          console.error("Failed to load form:", error);
        }
      })();
    }
  }, [formId]);

  // Save handler
  const handleSave = async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      if (formId) {
        // Update form and add new version
        await supabase.from("forms").update({
          title: formState.title,
          description: formState.description,
          updated_at: new Date().toISOString(),
        }).eq("id", formId);
        
        // Store the complete form state in form_versions
        await supabase.from("form_versions").insert({
          form_id: formId,
          form_data: {
            questions: formState.questions,
            settings: formState.settings,
          },
          created_by: userId,
          commit_message: "Updated via builder UI",
        });
      } else {
        // Create new form and version
        const { data, error } = await supabase.from("forms").insert({
          user_id: userId,
          title: formState.title,
          description: formState.description,
        }).select("id").single();
        
        if (data && data.id) {
          // Store the complete form state in form_versions
          await supabase.from("form_versions").insert({
            form_id: data.id,
            form_data: formState, // Store the entire form state
            created_by: userId,
            commit_message: "Initial version",
          });
          router.replace(`/protected/form-builder?id=${data.id}`);
        }
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      console.error("Error saving form:", error);
      // Optionally add error state handling here
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-end mb-4 gap-2">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
        {success && <span className="text-green-600 self-center">Saved!</span>}
      </div>
      <Tabs defaultValue="design" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="export">Export Code</TabsTrigger>
        </TabsList>
        
        <TabsContent value="design" className="mt-4">
          <FormDesigner 
            formState={formState} 
            setFormState={setFormState} 
          />
        </TabsContent>
        
        <TabsContent value="preview" className="mt-4">
          <FormPreview 
            formState={formState} 
          />
        </TabsContent>
        
        <TabsContent value="export" className="mt-4">
          <CodeExport 
            formState={formState} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FormBuilder; 