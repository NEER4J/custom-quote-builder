"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { FormState, Question } from "./FormDesigner";
import { EditIcon, PlusIcon, TrashIcon, SaveIcon, MoveUpIcon, MoveDownIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import QuestionEditor from "./QuestionEditor";
import FormSettingsEditor from "./FormSettingsEditor";
import FormPreview from "./FormPreview";
import CodeExport from "./CodeExport";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type FormBuilderProps = {
  userId: string;
};

const FormBuilder = ({ userId }: FormBuilderProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formId = searchParams.get("id");
  const [formState, setFormState] = useState<FormState>({
    title: "My Quote Form",
    description: "Get a quote by answering the following questions",
    questions: [],
    settings: {
      backgroundColor: "#ffffff",
      buttonColor: "#000000",
      submitUrl: "",
      zapierWebhookUrl: "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"design" | "preview" | "export">("design");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formDetailsExpanded, setFormDetailsExpanded] = useState(true);

  // Load form if editing
  useEffect(() => {
    if (formId) {
      (async () => {
        try {
          const supabase = createClient();
          
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
          
          if (formData && versionData && versionData.form_data) {
            // Create a new state with both form metadata and form content
            const newFormState = {
              title: formData.title,
              description: formData.description,
              questions: versionData.form_data.questions || [],
              settings: versionData.form_data.settings || {
                backgroundColor: "#ffffff",
                buttonColor: "#000000",
                submitUrl: "",
                zapierWebhookUrl: "",
              },
            };
            
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
    } finally {
      setLoading(false);
    }
  };

  const addNewQuestion = () => {
    const newQuestion = {
      id: crypto.randomUUID(),
      text: "New question",
      type: "single_choice" as const,
      required: true,
      options: [
        { id: crypto.randomUUID(), text: "Option 1" },
        { id: crypto.randomUUID(), text: "Option 2" }
      ],
    };
    
    setFormState(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    
    setEditingQuestion(newQuestion);
    setEditingQuestionIndex(formState.questions.length);
    setEditDialogOpen(true);
  };

  const editQuestion = (question: Question, index: number) => {
    setEditingQuestion({...question});
    setEditingQuestionIndex(index);
    setEditDialogOpen(true);
  };

  const saveQuestionEdit = () => {
    if (editingQuestion && editingQuestionIndex !== null) {
      setFormState(prev => {
        const newQuestions = [...prev.questions];
        newQuestions[editingQuestionIndex] = editingQuestion;
        return { ...prev, questions: newQuestions };
      });
    }
    setEditDialogOpen(false);
  };

  const deleteQuestion = (index: number) => {
    setFormState(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) || 
      (direction === "down" && index === formState.questions.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? index - 1 : index + 1;
    setFormState(prev => {
      const newQuestions = [...prev.questions];
      [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
      return { ...prev, questions: newQuestions };
    });
  };

  const hasConditions = (question: Question): boolean => {
    return !!question.conditions && question.conditions.length > 0;
  };

  const getQuestionTypeLabel = (type: string): string => {
    switch (type) {
      case "single_choice": return "Single Choice";
      case "multiple_choice": return "Multiple Choice";
      case "text_input": return "Text Input";
      default: return "Unknown";
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          className="text-sm"
          onClick={() => setFormDetailsExpanded(!formDetailsExpanded)}
        >
          {formDetailsExpanded ? "Hide Form Details" : "Show Form Details"}
        </Button>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all"
          >
            <SaveIcon className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Form"}
          </Button>
          {success && (
            <div className="animate-fade-in bg-green-50 text-green-700 px-3 py-1 rounded-md text-sm flex items-center border border-green-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </div>
          )}
        </div>
      </div>
      
      {formDetailsExpanded && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 mb-6 animate-fade-in">
          <h2 className="text-xl font-semibold mb-4">Form Details</h2>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-sm font-medium">Form Title</Label>
              <Input 
                id="title" 
                value={formState.title}
                onChange={e => setFormState(prev => ({ ...prev, title: e.target.value }))}
                className="border-zinc-300 dark:border-zinc-700 focus-visible:ring-black"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-sm font-medium">Form Description</Label>
              <Input 
                id="description" 
                value={formState.description}
                onChange={e => setFormState(prev => ({ ...prev, description: e.target.value }))}
                className="border-zinc-300 dark:border-zinc-700 focus-visible:ring-black"
              />
            </div>
          </div>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="w-full bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg mb-6">
          <TabsTrigger 
            value="design" 
            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white rounded-md"
          >
            Design
          </TabsTrigger>
          <TabsTrigger 
            value="preview" 
            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white rounded-md"
          >
            Preview
          </TabsTrigger>
          <TabsTrigger 
            value="export" 
            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white rounded-md"
          >
            Export Code
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="design" className="animate-fade-in">
          <div className="grid grid-cols-12 gap-6">
            {/* Left sidebar - Steps */}
            <div className="col-span-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Steps</h2>
              </div>
              
              <div className="space-y-2">
                {formState.questions.length === 0 ? (
                  <div className="py-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                    No questions yet
                  </div>
                ) : (
                  formState.questions.map((question, index) => (
                    <div 
                      key={question.id}
                      className="flex items-center space-x-2 border border-zinc-200 dark:border-zinc-800 rounded-md p-2 group hover:border-zinc-300 dark:hover:border-zinc-700"
                    >
                      <div className="flex-shrink-0 rounded-full w-6 h-6 bg-zinc-100 dark:bg-zinc-800 text-xs flex items-center justify-center text-zinc-800 dark:text-zinc-200">
                        {index + 1}
                      </div>
                      <div className="flex-1 truncate text-sm">
                        Step {index + 1}
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-zinc-500"
                                onClick={() => moveQuestion(index, "up")}
                                disabled={index === 0}
                              >
                                <MoveUpIcon className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Move up</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-zinc-500"
                                onClick={() => moveQuestion(index, "down")}
                                disabled={index === formState.questions.length - 1}
                              >
                                <MoveDownIcon className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Move down</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="mt-4 border-t border-zinc-200 dark:border-zinc-800 pt-4">
                <h3 className="text-sm font-medium mb-2">Legend</h3>
                <div className="flex flex-col gap-2 text-xs">
                 
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="py-0 px-1 h-4 text-[10px]">Conditional</Badge>
                    <span>Has condition</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="py-0 px-1 h-4 text-[10px]">Multiple Selections</Badge>
                    <span>Has multiple selections</span>
                  </div>
                
                </div>
              </div>
            </div>
            
            {/* Main content area - Questions */}
            <div className="col-span-9 space-y-6">
              {formState.questions.map((question, index) => (
                <div 
                  key={question.id} 
                  className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                >
                  <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 w-4 h-4 rounded-full bg-green-500"></div>
                        <h3 className="font-medium text-md mr-2">
                          {question.text} {question.required && <span className="text-red-500">*</span>}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => editQuestion(question, index)}
                        >
                          <EditIcon className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          onClick={() => deleteQuestion(index)}
                        >
                          <TrashIcon className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>Order: {index + 1}</span>
                      <span>|</span>
                      <span>{getQuestionTypeLabel(question.type)}</span>
                      {hasConditions(question) && (
                        <>
                          <span>|</span>
                          <Badge variant="outline" className="py-0.5 px-1.5 text-[10px]">Conditional</Badge>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900">
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Options:</div>
                    <div className="grid grid-cols-3 gap-3">
                      {question.type !== "text_input" && question.options && question.options.map(option => (
                        <div key={option.id} className="flex items-center text-sm pl-3 py-1 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-md">
                          <span>• {option.text}</span>
                        </div>
                      ))}
                      {question.type === "text_input" && (
                        <div className="flex items-center text-sm pl-3 py-1 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-md italic">
                          Free form text answers
                        </div>
                      )}
                    </div>
                    
                    {hasConditions(question) && (
                      <div className="mt-4 text-xs">
                        <div className="flex items-center gap-1 mb-2">
                          <Badge variant="outline" className="py-0.5 px-1.5 text-[10px]">Conditional Display</Badge>
                          <span className="text-zinc-500 dark:text-zinc-400">Shows when specific conditions are met</span>
                        </div>
                        
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <Button 
                onClick={addNewQuestion}
                className="w-full py-6 border-dashed border-2 border-zinc-300 dark:border-zinc-700 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Question
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="animate-fade-in">
          <FormPreview formState={formState} />
        </TabsContent>
        
        <TabsContent value="export" className="animate-fade-in">
          <CodeExport formState={formState} />
        </TabsContent>
      </Tabs>
      
      {/* Question Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestionIndex !== null && editingQuestionIndex >= 0 ? "Edit Question" : "Add New Question"}</DialogTitle>
            <DialogDescription>
              Configure the question settings and options
            </DialogDescription>
          </DialogHeader>
          
          {editingQuestion && (
            <div className="mt-4">
              <QuestionEditor 
                question={editingQuestion}
                questions={formState.questions}
                onChange={(updatedQuestion) => setEditingQuestion(updatedQuestion)}
              />
              
              <div className="flex justify-end mt-6 gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveQuestionEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormBuilder; 