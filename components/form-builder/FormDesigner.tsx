"use client";

import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  Trash2Icon,
  MoveUpIcon,
  MoveDownIcon,
  Settings2Icon,
  TypeIcon,
  ListIcon,
  TextIcon,
  MapPinIcon
} from "lucide-react";
import QuestionEditor from "./QuestionEditor";
import FormSettingsEditor from "./FormSettingsEditor";

export interface Option {
  id: string;
  text: string;
  icon?: string;
  description?: string;
  imageUrl?: string;
}

export interface Condition {
  questionId: string;
  values: string[]; // Array of option values that would make this condition true
}

export interface Question {
  id: string;
  text: string;
  description?: string;
  type: "single_choice" | "multiple_choice" | "text_input" | "address";
  required: boolean;
  options?: Option[];
  conditions?: Condition[];
  conditionLogic?: "AND" | "OR";
  placeholder?: string;
  postcodeApi?: "custom" | "postcodes4u";
}

export type FormSettings = {
  backgroundColor: string;
  buttonColor: string;
  submitUrl: string;
  zapierWebhookUrl: string;
  customApiKey?: string;
  postcodes4uUsername?: string;
  postcodes4uProductKey?: string;
};

export type FormState = {
  title: string;
  description: string;
  questions: Question[];
  settings: FormSettings;
};

type FormDesignerProps = {
  formState: FormState;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
};

const FormDesigner = ({ formState, setFormState }: FormDesignerProps) => {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"questions" | "settings">("questions");

  const addQuestion = (type: "single_choice" | "multiple_choice" | "text_input" | "address") => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: `Question ${formState.questions.length + 1}`,
      type,
      required: true,
      options: type !== "text_input" && type !== "address" ? [
        { id: "opt-1", text: "Option 1" },
        { id: "opt-2", text: "Option 2" }
      ] : undefined,
      postcodeApi: type === "address" ? "custom" : undefined
    };

    setFormState(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    
    setSelectedQuestionIndex(formState.questions.length);
  };

  const removeQuestion = (index: number) => {
    setFormState(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
    
    if (selectedQuestionIndex === index) {
      setSelectedQuestionIndex(null);
    } else if (selectedQuestionIndex !== null && selectedQuestionIndex > index) {
      setSelectedQuestionIndex(selectedQuestionIndex - 1);
    }
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) || 
      (direction === "down" && index === formState.questions.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const newQuestions = [...formState.questions];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    
    setFormState(prev => ({
      ...prev,
      questions: newQuestions
    }));
    
    if (selectedQuestionIndex === index) {
      setSelectedQuestionIndex(newIndex);
    } else if (selectedQuestionIndex === newIndex) {
      setSelectedQuestionIndex(index);
    }
  };

  const updateQuestion = (questionIndex: number, updatedQuestion: Question) => {
    setFormState(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex ? updatedQuestion : q
      )
    }));
  };

  const updateFormSettings = (newSettings: FormSettings) => {
    setFormState(prev => ({
      ...prev,
      settings: newSettings
    }));
  };

  const processQuestionVisibility = (
    question: Question,
    answers: Record<string, string | string[]>,
    questions: Question[]
  ) => {
    if (!question.conditions || question.conditions.length === 0) {
      return true;
    }

    const logic = question.conditionLogic || "AND";

    // ... existing code ...
  };

  return (
    <div className="flex flex-col gap-8">
      <Card className="border border-zinc-200 dark:border-zinc-800 ">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl tracking-tight">Form Details</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">Define the basic information for your quote form</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
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
        </CardContent>
      </Card>

      <Tabs defaultValue="questions" className="w-full">
        <TabsList className="w-full bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg mb-6">
          <TabsTrigger 
            value="questions"
            onClick={() => setActiveTab("questions")}
            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white rounded-md"
          >
            <ListIcon className="w-4 h-4 mr-2" />
            Questions
          </TabsTrigger>
          <TabsTrigger 
            value="settings"
            onClick={() => setActiveTab("settings")}
            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white rounded-md"
          >
            <Settings2Icon className="w-4 h-4 mr-2" />
            Form Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="questions" className="mt-6 animate-fade-in">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-2 justify-center py-2">
              <Button
                variant="outline"
                onClick={() => addQuestion("multiple_choice")}
                className="flex-1 sm:flex-initial justify-start text-left font-normal h-9"
              >
                <ListIcon className="h-4 w-4 mr-2" />
                Multiple Choice
              </Button>
              <Button
                variant="outline"
                onClick={() => addQuestion("single_choice")}
                className="flex-1 sm:flex-initial justify-start text-left font-normal h-9"
              >
                <TypeIcon className="h-4 w-4 mr-2" />
                Single Choice
              </Button>
              <Button
                variant="outline"
                onClick={() => addQuestion("text_input")}
                className="flex-1 sm:flex-initial justify-start text-left font-normal h-9"
              >
                <TextIcon className="h-4 w-4 mr-2" />
                Text Input
              </Button>
              <Button
                variant="outline"
                onClick={() => addQuestion("address")}
                className="flex-1 sm:flex-initial justify-start text-left font-normal h-9"
              >
                <MapPinIcon className="h-4 w-4 mr-2" />
                Address
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card className="border border-zinc-200 dark:border-zinc-800  h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg tracking-tight">Questions</CardTitle>
                    <CardDescription className="text-zinc-500 dark:text-zinc-400">
                      {formState.questions.length === 0 
                        ? "Add your first question to get started" 
                        : "Select a question to edit"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {formState.questions.length === 0 ? (
                      <div className="flex justify-center items-center py-10 border-2 border-dashed rounded-md border-zinc-300 dark:border-zinc-700">
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">No questions yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {formState.questions.map((question, index) => (
                          <div 
                            key={question.id}
                            className={`p-3 border rounded-md flex justify-between items-center cursor-pointer transition-colors
                             ${selectedQuestionIndex === index 
                               ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700' 
                               : 'bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}
                            onClick={() => setSelectedQuestionIndex(index)}
                          >
                            <div>
                              <p className="font-medium text-sm truncate max-w-[150px]">
                                {question.text}
                              </p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                {question.type.replace('_', ' ')}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveQuestion(index, "up");
                                }}
                                className="h-7 w-7 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                disabled={index === 0}
                              >
                                <MoveUpIcon className="h-4 w-4" />
                                <span className="sr-only">Move up</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveQuestion(index, "down");
                                }}
                                className="h-7 w-7 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                disabled={index === formState.questions.length - 1}
                              >
                                <MoveDownIcon className="h-4 w-4" />
                                <span className="sr-only">Move down</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeQuestion(index);
                                }}
                                className="h-7 w-7 rounded-full text-zinc-500 hover:text-red-500"
                              >
                                <Trash2Icon className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card className="border border-zinc-200 dark:border-zinc-800  h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg tracking-tight">
                      {selectedQuestionIndex !== null ? "Edit Question" : "Question Editor"}
                    </CardTitle>
                    <CardDescription className="text-zinc-500 dark:text-zinc-400">
                      {selectedQuestionIndex !== null 
                        ? "Customize your question" 
                        : "Select a question from the list to edit its details"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedQuestionIndex !== null ? (
                      <QuestionEditor 
                        question={formState.questions[selectedQuestionIndex]} 
                        onChange={(updatedQuestion) => 
                          updateQuestion(selectedQuestionIndex, updatedQuestion)
                        }
                        availableQuestions={formState.questions.filter(q => 
                          q.id !== formState.questions[selectedQuestionIndex].id
                        )}
                      />
                    ) : (
                      <div className="flex flex-col justify-center items-center py-12 border-2 border-dashed rounded-md border-zinc-300 dark:border-zinc-700">
                        <p className="text-zinc-500 dark:text-zinc-400 mb-4">No question selected</p>
                        <p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-md text-center">
                          Select a question from the list or create a new one to customize it in this editor
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6 animate-fade-in">
          <Card className="border border-zinc-200 dark:border-zinc-800 ">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg tracking-tight">Form Settings</CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">
                Customize the appearance and behavior of your form
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeTab === "settings" && (
                <FormSettingsEditor 
                  settings={formState.settings} 
                  onSettingsChange={(newSettings: FormSettings) => setFormState({
                    ...formState,
                    settings: newSettings
                  })} 
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FormDesigner;