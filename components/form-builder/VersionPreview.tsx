"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EyeIcon } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import FormPreview from "./FormPreview";

type VersionPreviewProps = {
  formId: string;
  version: {
    id: string;
    form_data: any;
    version_number: number;
  };
};

export default function VersionPreview({ formId, version }: VersionPreviewProps) {
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  
  // Create form state using the form_data from the version
  // In our database structure, form_data contains questions and settings
  const formState = {
    // The actual form title and description would need to be passed from the parent
    // or fetched separately since they might be stored at the form level, not in each version
    title: version.form_data?.title || "Form Preview",
    description: version.form_data?.description || `Version ${version.version_number}`,
    questions: version.form_data?.questions || [],
    settings: version.form_data?.settings || {
      backgroundColor: "#ffffff",
      buttonColor: "#000000",
      submitUrl: "",
      zapierWebhookUrl: "",
    },
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-1"
        onClick={() => setPreviewDialogOpen(true)}
      >
        <EyeIcon size={14} />
        Preview
      </Button>

      <Dialog 
        open={previewDialogOpen} 
        onOpenChange={(open) => setPreviewDialogOpen(open)}
      >
        <DialogContent className="bg-gray-100 max-w-full w-[98vw] h-[96vh] p-4" style={{borderRadius: '0px'}}>
          <div className="h-full">
            <FormPreview formState={formState} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 