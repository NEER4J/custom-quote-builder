"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { FormState, Question, FormSettings } from "./FormDesigner";
import { EditIcon, PlusIcon, TrashIcon, SaveIcon, MoveUpIcon, MoveDownIcon, Sparkles, Settings, FileCode, Eye, ChevronDown, ChevronUp, Pencil, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import QuestionEditor from "./QuestionEditor";
import FormSettingsEditor from "./FormSettingsEditor";
import FormPreview from "./FormPreview";
import CodeExport from "./CodeExport";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";

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
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"design" | "export">("design");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState<boolean>(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState<boolean>(false);
  const [commitMessage, setCommitMessage] = useState<string>("");

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

  // Regular save handler without versioning
  const handleSave = async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      if (formId) {
        // Update form without adding new version
        await supabase.from("forms").update({
          title: formState.title,
          description: formState.description,
          updated_at: new Date().toISOString(),
        }).eq("id", formId);
      } else {
        // Create new form without version
        const { data, error } = await supabase.from("forms").insert({
          user_id: userId,
          title: formState.title,
          description: formState.description,
        }).select("id").single();
        
        if (data && data.id) {
          router.replace(`/form-builder?id=${data.id}`);
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
  
  // Save and archive handler with versioning
  const handleSaveAndArchive = async () => {
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
          commit_message: commitMessage || "Updated via builder UI",
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
            commit_message: commitMessage || "Initial version",
          });
          router.replace(`/form-builder?id=${data.id}`);
        }
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      setArchiveDialogOpen(false);
      setCommitMessage("");
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
    if (direction === "up" && index > 0) {
      setFormState(prev => {
        const newQuestions = [...prev.questions];
        const temp = newQuestions[index];
        newQuestions[index] = newQuestions[index - 1];
        newQuestions[index - 1] = temp;
        return { ...prev, questions: newQuestions };
      });
    } else if (direction === "down" && index < formState.questions.length - 1) {
    setFormState(prev => {
      const newQuestions = [...prev.questions];
        const temp = newQuestions[index];
        newQuestions[index] = newQuestions[index + 1];
        newQuestions[index + 1] = temp;
      return { ...prev, questions: newQuestions };
    });
    }
  };

  const hasConditions = (question: Question): boolean => {
    return !!question.conditions && question.conditions.length > 0;
  };

  const getQuestionTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      single_choice: "Single Choice",
      multiple_choice: "Multiple Choice",
      text_input: "Text Input",
      number_input: "Number Input",
      date_input: "Date Input",
      dropdown: "Dropdown",
    };
    return labels[type] || type;
  };

  return (
    <div className="mx-auto w-full max-w-screen-xl animate-fade-in">
      <div className="mb-8 rounded-lg bg-card card-shadow-hover transition-all">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1">
            {editingTitle ? (
              <div className="mb-2">
                <Input
                  value={formState.title}
                  onChange={(e) => setFormState({...formState, title: e.target.value})}
                  className="text-2xl font-bold"
                  autoFocus
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setEditingTitle(false);
                  }}
                />
              </div>
            ) : (
              <h1 
                className="text-2xl font-bold tracking-tight mb-2 flex items-center cursor-pointer group" 
                onClick={() => setEditingTitle(true)}
              >
                {formState.title}
                <EditIcon className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h1>
            )}
            
            {editingDescription ? (
              <Input
                value={formState.description}
                onChange={(e) => setFormState({...formState, description: e.target.value})}
                className="text-sm text-muted-foreground"
                autoFocus
                onBlur={() => setEditingDescription(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setEditingDescription(false);
                }}
              />
            ) : (
              <p 
                className="text-sm text-muted-foreground cursor-pointer group flex items-center" 
                onClick={() => setEditingDescription(true)}
              >
                {formState.description}
                <EditIcon className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            )}
          </div>
          
          <div className="flex gap-2 mt-1">
            <Button 
              variant="outline" 
              onClick={() => router.push("/dashboard")}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button 
              variant="outline"
              onClick={() => setPreviewDialogOpen(true)}
              className="rounded-lg"
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button 
              variant="default"
              onClick={handleSave} 
              disabled={loading}
              className={`rounded-lg relative overflow-hidden ${success ? 'bg-green-600 border-green-600 hover:bg-green-700' : 'bg-accent text-accent-foreground'}`}
            >
              {loading ? (
                "Saving..."
              ) : success ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <SaveIcon className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
              {loading && (
                <span className="absolute bottom-0 left-0 h-1 bg-primary/50 animate-pulse-soft" style={{ width: '100%' }}></span>
              )}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setArchiveDialogOpen(true)} 
              disabled={loading}
              className="rounded-lg gap-1"
            >
              <Archive className="h-4 w-4" />
              Save + Archive
            </Button>
          </div>
        </div>
      </div>

      <Tabs 
        defaultValue="design" 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as any)}
        className="space-y-4"
      >
        <div className="bg-card border rounded-lg p-1 flex overflow-x-auto">
          <TabsList className="bg-transparent w-full flex justify-start">
            <TabsTrigger value="design" className="px-6 py-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-md">
              <Settings className="mr-2 h-4 w-4" />
              Design
            </TabsTrigger>
            <TabsTrigger value="export" className="px-6 py-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-md">
              <FileCode className="mr-2 h-4 w-4" />
              Export
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="design" className="p-0 border-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              {/* Questions Section */}
              <div className="rounded-xl border bg-card p-6 card-shadow">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Questions</h2>
                  <Button 
                    onClick={addNewQuestion} 
                    className="rounded-lg transition-all bg-accent text-accent-foreground  shadow-accent/20"
                  >
                    <PlusIcon className="mr-2 h-4 w-4" /> 
                    Add Question
                  </Button>
                </div>
              
                <div className="space-y-4">
                {formState.questions.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg bg-secondary/20">
                      <p className="text-muted-foreground">No questions yet. Click &quot;Add Question&quot; to get started.</p>
                    </div>
                ) : (
                  formState.questions.map((question, index) => (
                    <div 
                      key={question.id}
                      className="relative rounded-lg border bg-card p-4 hover:border-accent transition-all group card-shadow-hover animate-fade-in"
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-7 h-7 bg-accent/10 rounded-full flex items-center justify-center mr-3 mt-0.5">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div className="grow">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{question.text}</h3>
                            {question.required && (
                              <Badge variant="outline" className="text-xs font-normal">Required</Badge>
                            )}
                            {hasConditions(question) && (
                              <Badge variant="outline" className="text-xs font-normal bg-accent/10 text-accent border-accent/20">
                                Conditional
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground flex flex-wrap gap-2 items-center">
                            <Badge variant="secondary" className="font-normal">
                              {getQuestionTypeLabel(question.type)}
                            </Badge>
                            
                            {question.type === "single_choice" || question.type === "multiple_choice" ? (
                              <span>{question.options?.length || 0} options</span>
                            ) : null}
                          </div>
                        </div>
                          
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => moveQuestion(index, "up")} disabled={index === 0}>
                                  <MoveUpIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Move Up</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => moveQuestion(index, "down")} disabled={index === formState.questions.length - 1}>
                                  <MoveDownIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Move Down</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => editQuestion(question, index)}>
                                  <EditIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Question</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteQuestion(index)}>
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete Question</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                </div>
              </div>
            </div>
            
            {/* Form Settings */}
            <div className="space-y-6">
              <div className="rounded-xl border bg-card p-6 card-shadow">
                <h2 className="text-xl font-semibold mb-6">Form Settings</h2>
                <FormSettingsEditor
                  settings={formState.settings}
                  onSettingsChange={(newSettings: FormSettings) => setFormState({...formState, settings: newSettings})}
                />
                </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="export" className="p-0 border-none">
          <div className="rounded-xl border bg-card space-y-6 card-shadow">
        
            <CodeExport formState={formState} />
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={(open) => {
        setPreviewDialogOpen(open);
        if (!open) {
          setActiveTab("design");
        }
      }}>
        <DialogContent className="bg-gray-100 max-w-full w-[98vw] h-[96vh] p-4" style={{borderRadius: '0px'}}>
          <div className="h-full">
            <FormPreview formState={formState} />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Question Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-lg">
              {editingQuestionIndex !== null && editingQuestionIndex < formState.questions.length
                ? "Edit Question"
                : "Add New Question"}
            </DialogTitle>
            <DialogDescription>
              Configure your question details and options
            </DialogDescription>
          </DialogHeader>
          <div className="p-4">
          {editingQuestion && (
              <QuestionEditor
                question={editingQuestion}
                onChange={setEditingQuestion}
                availableQuestions={formState.questions ? formState.questions.filter(q => q.id !== editingQuestion.id) : []}
                onCancel={() => setEditDialogOpen(false)}
                onSave={saveQuestionEdit}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Archive this version</DialogTitle>
            <DialogDescription>
              Save this version with a description of what changed. This will create a restore point.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="commitMessage" className="mb-2 block">What changed in this version?</Label>
            <Textarea
              id="commitMessage"
              placeholder="Describe the changes you made..."
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="h-24"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAndArchive} disabled={loading}>
              {loading ? "Saving..." : "Save & Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormBuilder; 