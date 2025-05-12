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
  Settings2Icon
} from "lucide-react";
import QuestionEditor from "./QuestionEditor";
import FormSettingsEditor from "./FormSettingsEditor";

type QuestionType = "multiple_choice" | "single_choice" | "text_input";

export type Option = {
  id: string;
  text: string;
  icon?: string;
};

export type Condition = {
  questionId: string;
  operator: "equals" | "not_equals";
  value: string;
};

export type Question = {
  id: string;
  text: string;
  type: QuestionType;
  options?: Option[];
  required: boolean;
  conditions?: Condition[];
};

export type FormSettings = {
  backgroundColor: string;
  buttonColor: string;
  submitUrl: string;
  zapierWebhookUrl: string;
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

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      text: `New ${type.replace('_', ' ')} question`,
      type,
      required: false,
    };

    if (type === "multiple_choice" || type === "single_choice") {
      newQuestion.options = [
        { id: crypto.randomUUID(), text: "Option 1" },
        { id: crypto.randomUUID(), text: "Option 2" }
      ];
    }

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

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Form Details</CardTitle>
          <CardDescription>Basic information about your form</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Form Title</Label>
              <Input 
                id="title" 
                value={formState.title}
                onChange={e => setFormState(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Form Description</Label>
              <Input 
                id="description" 
                value={formState.description}
                onChange={e => setFormState(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="questions" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger 
            value="questions"
            onClick={() => setActiveTab("questions")}
          >
            Questions
          </TabsTrigger>
          <TabsTrigger 
            value="settings"
            onClick={() => setActiveTab("settings")}
          >
            <Settings2Icon className="w-4 h-4 mr-2" />
            Form Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="questions" className="mt-4">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={() => addQuestion("multiple_choice")}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Multiple Choice
              </Button>
              <Button 
                variant="outline" 
                onClick={() => addQuestion("single_choice")}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Single Choice
              </Button>
              <Button 
                variant="outline" 
                onClick={() => addQuestion("text_input")}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Text Input
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Questions</CardTitle>
                    <CardDescription>
                      {formState.questions.length === 0 
                        ? "Add your first question to get started" 
                        : "Select a question to edit"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {formState.questions.length === 0 ? (
                      <div className="flex justify-center items-center h-32 border-2 border-dashed rounded-md border-gray-300">
                        <p className="text-sm text-gray-500">No questions yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {formState.questions.map((question, index) => (
                          <div 
                            key={question.id}
                            className={`p-3 border rounded-md flex justify-between items-center cursor-pointer ${selectedQuestionIndex === index ? 'bg-accent' : ''}`}
                            onClick={() => setSelectedQuestionIndex(index)}
                          >
                            <div>
                              <p className="font-medium truncate max-w-[150px]">
                                {question.text}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {question.type.replace('_', ' ')}
                              </p>
                            </div>
                            <div className="flex space-x-1">
                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveQuestion(index, "up");
                                }}
                                disabled={index === 0}
                              >
                                <MoveUpIcon className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveQuestion(index, "down");
                                }}
                                disabled={index === formState.questions.length - 1}
                              >
                                <MoveDownIcon className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeQuestion(index);
                                }}
                              >
                                <Trash2Icon className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2">
                {selectedQuestionIndex !== null && formState.questions[selectedQuestionIndex] ? (
                  <QuestionEditor 
                    question={formState.questions[selectedQuestionIndex]} 
                    questions={formState.questions}
                    onChange={(updatedQuestion) => updateQuestion(selectedQuestionIndex, updatedQuestion)}
                  />
                ) : (
                  <Card>
                    <CardContent className="flex justify-center items-center h-64">
                      <p className="text-muted-foreground">
                        {formState.questions.length === 0 
                          ? "Add a question to get started" 
                          : "Select a question to edit its properties"}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="mt-4">
          <FormSettingsEditor 
            settings={formState.settings}
            onChange={updateFormSettings}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FormDesigner;