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
  ImageIcon,
  TextIcon,
  Pencil,
  Link,
  X
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

type QuestionEditorProps = {
  question: Question;
  questions: Question[];
  onChange: (updatedQuestion: Question) => void;
};

const QuestionEditor = ({ question, questions, onChange }: QuestionEditorProps) => {
  const [activeTab, setActiveTab] = useState<"basic" | "logic">("basic");
  const [optionType, setOptionType] = useState<"text" | "image">("text");
  const [conditionsLogicType, setConditionsLogicType] = useState<"AND" | "OR">(question.conditionLogic || "AND");
  const [conditionsEnabled, setConditionsEnabled] = useState(!!question.conditions && question.conditions.length > 0);

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

  const handleQuestionTypeChange = (type: string) => {
    if (type === "single_choice" || type === "multiple_choice" || type === "text_input") {
      const newOptions = question.options || [
        { id: crypto.randomUUID(), text: "Option 1" },
        { id: crypto.randomUUID(), text: "Option 2" }
      ];
      
      onChange({
        ...question,
        type: type as any,
        options: type === "text_input" ? undefined : newOptions
      });
    }
  };

  const addOption = () => {
    if (!question.options) return;
    
    const newOption: Option = {
      id: crypto.randomUUID(),
      text: `Option ${question.options.length + 1}`,
      icon: ""
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
    
    const targetQuestion = previousQuestions[0];
    const initialValue = targetQuestion.options && targetQuestion.options.length > 0 
      ? [targetQuestion.options[0].id] 
      : [];
    
    const newCondition: Condition = {
      questionId: targetQuestion.id,
      values: initialValue
    };
    
    onChange({
      ...question,
      conditionLogic: question.conditionLogic || conditionsLogicType, 
      conditions: [...(question.conditions || []), newCondition]
    });

    if (!conditionsEnabled) {
      setConditionsEnabled(true);
    }
  };

  const updateCondition = (index: number, field: keyof Condition, value: string | string[]) => {
    if (!question.conditions) return;
    
    const updatedConditions = [...question.conditions];
    if (field === 'values' && !Array.isArray(value)) {
      console.error('Attempted to set non-array to values field');
      return;
    }
    updatedConditions[index] = {
      ...updatedConditions[index],
      [field]: value
    } as Condition;
    
    onChange({
      ...question,
      conditions: updatedConditions
    });
  };
  
  const handleConditionValueChange = (conditionIndex: number, optionId: string, isChecked: boolean) => {
    if (!question.conditions) return;
    const condition = question.conditions[conditionIndex];
    
    // Get the source question and its options
    const sourceQuestion = questions.find(q => q.id === condition.questionId);
    if (!sourceQuestion || !sourceQuestion.options) return;
    
    // Ensure optionId belongs to this source question
    const isValidOption = sourceQuestion.options.some(opt => opt.id === optionId);
    if (!isValidOption) {
      console.error(`Option ID ${optionId} does not belong to question ${condition.questionId}`);
      return;
    }
    
    let newValues = [...(condition.values || [])];

    if (isChecked) {
      if (!newValues.includes(optionId)) {
        newValues.push(optionId);
      }
    } else {
      newValues = newValues.filter(v => v !== optionId);
    }
    
    updateCondition(conditionIndex, 'values', newValues);
  };

  const handleConditionLogicChange = (logic: "AND" | "OR") => {
    setConditionsLogicType(logic);
    onChange({ ...question, conditionLogic: logic });
  };
  
  const removeCondition = (index: number) => {
    if (!question.conditions) return;
    
    const updatedConditions = question.conditions.filter((_, i) => i !== index);
    
    onChange({
      ...question,
      conditions: updatedConditions
    });

    if (updatedConditions.length === 0) {
      setConditionsEnabled(false);
    }
  };

  const toggleConditions = (enabled: boolean) => {
    setConditionsEnabled(enabled);
    
    if (enabled) {
      if (!question.conditions || question.conditions.length === 0) {
        addCondition();
      }
    } else {
      onChange({
        ...question,
        conditions: []
      });
    }
  };

  const previousQuestions = questions.filter(q => q.id !== question.id);

  const isImageUrl = (url: string) => {
    return url.match(/\.(jpeg|jpg|gif|png|svg|webp)$/i) != null || url.startsWith('http');
  };

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "basic" | "logic")} className="w-full">
      <TabsList className="w-full bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg mb-6">
        <TabsTrigger 
          value="basic"
          className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white rounded-md"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Basic Settings
        </TabsTrigger>
        <TabsTrigger 
          value="logic"
          className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white rounded-md"
        >
          <Link className="w-4 h-4 mr-2" />
          Conditional Logic
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic" className="space-y-6 animate-fade-in">
        <div className="grid gap-4">
          <div className="grid gap-3">
            <Label htmlFor="questionText" className="text-sm font-medium">Question Text</Label>
            <Input
              id="questionText"
              value={question.text}
              onChange={(e) => handleBasicChange(e, "text")}
              className="border-zinc-300 dark:border-zinc-700 focus-visible:ring-black"
            />
          </div>
          
          <div className="grid gap-3">
            <Label className="text-sm font-medium">Question Type</Label>
            <RadioGroup 
              defaultValue={question.type} 
              onValueChange={handleQuestionTypeChange}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="multiple_choice" id="multiple_choice" />
                <Label htmlFor="multiple_choice" className="font-normal">
                  Multiple Choice Question
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single_choice" id="single_choice" />
                <Label htmlFor="single_choice" className="font-normal">
                  Single Choice Question
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="text_input" id="text_input" />
                <Label htmlFor="text_input" className="font-normal">
                  Text Input
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="flex items-center space-x-2 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-md">
            <Checkbox 
              id="required" 
              checked={question.required}
              onCheckedChange={handleRequiredChange}
              className="border-zinc-400 data-[state=checked]:bg-black data-[state=checked]:border-black dark:data-[state=checked]:bg-white dark:data-[state=checked]:border-white"
            />
            <Label htmlFor="required" className="text-sm font-medium">Required Question</Label>
          </div>
          
          {(question.type === "multiple_choice" || question.type === "single_choice") && (
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-medium">Answer Options</Label>
                  <RadioGroup 
                    className="flex" 
                    defaultValue={optionType} 
                    onValueChange={(value) => setOptionType(value as "text" | "image")}
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="text" id="text-option" />
                      <Label htmlFor="text-option" className="flex items-center gap-1 text-xs">
                        <TextIcon className="h-3 w-3" /> Text
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1 ml-4">
                      <RadioGroupItem value="image" id="image-option" />
                      <Label htmlFor="image-option" className="flex items-center gap-1 text-xs">
                        <ImageIcon className="h-3 w-3" /> Image
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addOption}
                  className="border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </div>
              
              <div className="space-y-3">
                {question.options?.map((option, index) => (
                  <div key={option.id} className="grid grid-cols-12 gap-3 items-center  transition-colors">
                    <div className="col-span-6">
                      <Input
                        value={option.text}
                        onChange={(e) => updateOption(index, "text", e.target.value)}
                        placeholder="Option text"
                        className="border-zinc-300 dark:border-zinc-700 focus-visible:ring-black"
                      />
                    </div>
                    
                    <div className="col-span-5">
                      <div className="relative">
                        <Input
                          value={option.icon || ""}
                          onChange={(e) => updateOption(index, "icon", e.target.value)}
                          placeholder={optionType === "image" ? "Image URL" : "Icon (optional)"}
                          className="border-zinc-300 dark:border-zinc-700 focus-visible:ring-black"
                        />
                        {option.icon && isImageUrl(option.icon) && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                              >
                                <ImageIcon className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent side="top" className="w-auto p-2">
                              <img
                                src={option.icon}
                                alt={option.text}
                                className="max-w-32 max-h-32 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/png?text=Error';
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </div>
                    
                    <div className="col-span-1 flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeOption(index)}
                        className="h-8 w-8 p-0 rounded-full text-zinc-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400"
                        disabled={!question.options || question.options.length <= 1}
                      >
                        <Trash2Icon className="h-4 w-4" />
                        <span className="sr-only">Remove option</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="logic" className="animate-fade-in">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-5">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium">Conditional Display Logic</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Only show this question when specific answers are selected for previous questions
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Label htmlFor="enable-conditions" className="font-medium">Enable Conditional Logic</Label>
                <Checkbox 
                  id="enable-conditions"
                  checked={conditionsEnabled}
                  onCheckedChange={(checked) => toggleConditions(!!checked)}
                  className="h-5 w-5 border-zinc-400 data-[state=checked]:bg-black data-[state=checked]:border-black dark:data-[state=checked]:bg-white dark:data-[state=checked]:border-white"
                />
              </div>
            </div>

            {conditionsEnabled && (
              <div className="space-y-5 mt-4">
                <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-md border border-zinc-200 dark:border-zinc-800">
                  <label className="text-sm font-medium mb-3 block">Combine conditions with:</label>
                  <RadioGroup 
                    value={conditionsLogicType} 
                    onValueChange={handleConditionLogicChange}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="AND" id="and-logic" />
                      <Label htmlFor="and-logic">All must match (AND)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="OR" id="or-logic" />
                      <Label htmlFor="or-logic">Any can match (OR)</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {question.conditions?.map((condition, index) => (
                  <div key={index} className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-md p-5 relative">
                    <div className="absolute top-3 right-3 text-red-500">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        onClick={() => removeCondition(index)}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-medium mb-1">Condition {index + 1}</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Depends on Question</Label>
                        <Select
                          value={condition.questionId}
                          onValueChange={(value) => updateCondition(index, "questionId", value)}
                        >
                          <SelectTrigger className="w-full border-zinc-300 dark:border-zinc-700 focus:ring-black">
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
                      
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Show when answer includes:</Label>
                        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-4 pt-2">
                          {(() => {
                            const targetQuestion = previousQuestions.find(q => q.id === condition.questionId);
                            if (!targetQuestion || !targetQuestion.options) return (
                              <p className="text-sm text-zinc-500">Please select a valid question</p>
                            );
                            
                            return (
                              <div className="space-y-2 flex flex-row gap-4 flex-wrap justify-start">
                                {targetQuestion.options.map(option => (
                                  <div key={option.id} className="flex items-center space-x-2 m-2 mb-0">
                                    <Checkbox 
                                      id={`option-${option.id}-${index}`}
                                      checked={condition.values.includes(option.id)} 
                                      onCheckedChange={(checked) => handleConditionValueChange(index, option.id, !!checked)} 
                                      className="border-zinc-400"
                                    />
                                    <Label htmlFor={`option-${option.id}-${index}`} className="text-sm">
                                      {option.text}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  onClick={addCondition}
                  className="mt-4 border-dashed flex items-center"
                  disabled={previousQuestions.length === 0}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Another Condition
                </Button>
              </div>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default QuestionEditor; 