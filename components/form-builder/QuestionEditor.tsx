"use client";

import { useState } from "react";
import { Question, Option, Condition } from "./FormDesigner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PlusIcon,
  Trash2Icon,
  ArrowRightIcon
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type QuestionEditorProps = {
  question: Question;
  questions: Question[];
  onChange: (updatedQuestion: Question) => void;
};

const QuestionEditor = ({ question, questions, onChange }: QuestionEditorProps) => {
  const [activeTab, setActiveTab] = useState<"basic" | "logic">("basic");

  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Question) => {
    onChange({
      ...question,
      [field]: e.target.value
    });
  };

  const handleRequiredChange = (checked: boolean) => {
    onChange({
      ...question,
      required: checked
    });
  };

  const addOption = () => {
    if (!question.options) return;
    
    const newOption: Option = {
      id: crypto.randomUUID(),
      text: `Option ${question.options.length + 1}`
    };
    
    onChange({
      ...question,
      options: [...question.options, newOption]
    });
  };

  const updateOption = (index: number, field: keyof Option, value: string) => {
    if (!question.options) return;
    
    const updatedOptions = [...question.options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: value
    };
    
    onChange({
      ...question,
      options: updatedOptions
    });
  };

  const removeOption = (index: number) => {
    if (!question.options) return;
    
    onChange({
      ...question,
      options: question.options.filter((_, i) => i !== index)
    });
  };

  const addCondition = () => {
    const previousQuestions = questions.filter(q => q.id !== question.id);
    
    if (previousQuestions.length === 0) return;
    
    const newCondition: Condition = {
      questionId: previousQuestions[0].id,
      operator: "equals",
      value: previousQuestions[0].options?.[0]?.id || ""
    };
    
    onChange({
      ...question,
      conditions: [...(question.conditions || []), newCondition]
    });
  };

  const updateCondition = (index: number, field: keyof Condition, value: string) => {
    if (!question.conditions) return;
    
    const updatedConditions = [...question.conditions];
    updatedConditions[index] = {
      ...updatedConditions[index],
      [field]: value
    };
    
    onChange({
      ...question,
      conditions: updatedConditions
    });
  };

  const removeCondition = (index: number) => {
    if (!question.conditions) return;
    
    onChange({
      ...question,
      conditions: question.conditions.filter((_, i) => i !== index)
    });
  };

  // Find previous questions for conditions
  const previousQuestions = questions.filter(q => q.id !== question.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Question</CardTitle>
        <CardDescription>Customize your question and its behavior</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "basic" | "logic")}>
          <TabsList className="mb-4">
            <TabsTrigger value="basic">Basic Settings</TabsTrigger>
            <TabsTrigger value="logic">Conditional Logic</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="questionText">Question Text</Label>
              <Input
                id="questionText"
                value={question.text}
                onChange={(e) => handleBasicChange(e, "text")}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="required" 
                checked={question.required}
                onCheckedChange={handleRequiredChange}
              />
              <Label htmlFor="required">Required question</Label>
            </div>
            
            {(question.type === "multiple_choice" || question.type === "single_choice") && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Answer Options</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addOption}
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Option
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {question.options?.map((option, index) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Input
                        value={option.text}
                        onChange={(e) => updateOption(index, "text", e.target.value)}
                        placeholder="Option text"
                      />
                      <Input
                        value={option.icon || ""}
                        onChange={(e) => updateOption(index, "icon", e.target.value)}
                        placeholder="Icon (optional)"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeOption(index)}
                        disabled={question.options?.length === 1}
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="logic" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Conditions</h3>
                <p className="text-sm text-muted-foreground">
                  Show this question only when specific conditions are met
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={addCondition}
                disabled={previousQuestions.length === 0}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Condition
              </Button>
            </div>
            
            {previousQuestions.length === 0 && (
              <div className="p-4 border border-dashed rounded-md text-sm text-muted-foreground">
                No previous questions available for conditions
              </div>
            )}
            
            {question.conditions?.length === 0 && previousQuestions.length > 0 && (
              <div className="p-4 border border-dashed rounded-md text-sm text-muted-foreground">
                No conditions set yet
              </div>
            )}
            
            <div className="space-y-4">
              {question.conditions?.map((condition, index) => (
                <div key={index} className="p-4 border rounded-md space-y-4">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Select
                        value={condition.questionId}
                        onValueChange={(value) => updateCondition(index, "questionId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select question" />
                        </SelectTrigger>
                        <SelectContent>
                          {previousQuestions.map((q) => (
                            <SelectItem key={q.id} value={q.id}>
                              {q.text}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="col-span-2">
                      <Select
                        value={condition.operator}
                        onValueChange={(value) => 
                          updateCondition(index, "operator", value as "equals" | "not_equals")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">equals</SelectItem>
                          <SelectItem value="not_equals">not equals</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="col-span-4">
                      <Select
                        value={condition.value}
                        onValueChange={(value) => updateCondition(index, "value", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          {questions.find(q => q.id === condition.questionId)?.options?.map(option => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.text}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="col-span-1 flex justify-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeCondition(index)}
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default QuestionEditor; 