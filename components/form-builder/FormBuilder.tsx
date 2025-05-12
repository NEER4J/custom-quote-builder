"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormDesigner from "./FormDesigner";
import FormPreview from "./FormPreview";
import CodeExport from "./CodeExport";

type FormBuilderProps = {
  userId: string;
};

const FormBuilder = ({ userId }: FormBuilderProps) => {
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

  return (
    <div className="w-full">
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