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
  X,
  SaveIcon,
  XIcon,
  MapPinIcon
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
  onChange: (updatedQuestion: Question) => void;
  onSave?: () => void;
  onCancel?: () => void;
  availableQuestions?: Question[];
};

const QuestionEditor = ({ 
  question, 
  onChange, 
  onSave = () => {}, 
  onCancel = () => {}, 
  availableQuestions = [] 
}: QuestionEditorProps) => {
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
    if (type === "single_choice" || type === "multiple_choice" || type === "text_input" || type === "address" || type === "contact_form") {
      const newOptions = question.options || [
        { id: crypto.randomUUID(), text: "Option 1" },
        { id: crypto.randomUUID(), text: "Option 2" }
      ];
      
      onChange({
        ...question,
        type: type as any,
        options: type === "text_input" || type === "address" || type === "contact_form" ? undefined : newOptions,
        postcodeApi: type === "address" ? "custom" : undefined
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
    const previousQuestions = availableQuestions.length > 0 ? availableQuestions : [];
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
    const sourceQuestion = availableQuestions.find(q => q.id === condition.questionId);
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

  const previousQuestions = availableQuestions.filter(q => q.id !== question.id);

  const isImageUrl = (url: string) => {
    return url.match(/\.(jpeg|jpg|gif|png|svg|webp)$/i) != null || url.startsWith('http');
  };

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "basic" | "logic")} className="w-full">
        <TabsList className="w-full bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg mb-4">
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
        
        <TabsContent value="basic" className="space-y-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg ">
            <h3 className="text-md font-medium mb-3">Question Information</h3>
            
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="questionText" className="text-xs font-medium">Question Text</Label>
                <Input
                  id="questionText"
                  value={question.text}
                  onChange={(e) => handleBasicChange(e, "text")}
                  className="border-zinc-300 dark:border-zinc-700 focus-visible:ring-black text-sm h-9"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="questionDescription" className="text-xs font-medium">Description (Optional)</Label>
                <Input
                  id="questionDescription"
                  value={question.description || ""}
                  onChange={(e) => handleBasicChange(e, "description")}
                  placeholder="Add a helpful description"
                  className="border-zinc-300 dark:border-zinc-700 focus-visible:ring-black text-sm h-9"
                />
              </div>
              
              <div className="flex items-center space-x-2 mt-1">
                <Checkbox 
                  id="required" 
                  checked={question.required}
                  onCheckedChange={handleRequiredChange}
                  className="border-zinc-400 data-[state=checked]:bg-black data-[state=checked]:border-black dark:data-[state=checked]:bg-white dark:data-[state=checked]:border-white"
                />
                <Label htmlFor="required" className="text-xs font-medium">Required Question</Label>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg ">
            <h3 className="text-md font-medium mb-3">Question Type</h3>
            
            <RadioGroup 
              defaultValue={question.type} 
              onValueChange={handleQuestionTypeChange}
              className="grid grid-cols-5 gap-2"
            >
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-md p-2 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors relative">
                <RadioGroupItem value="multiple_choice" id="multiple_choice" className="absolute top-2 right-2" />
                <div className="mb-1 text-sm">Multiple Choice</div>
                <p className="text-xs text-muted-foreground">Multiple options</p>
              </div>
              
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-md p-2 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors relative">
                <RadioGroupItem value="single_choice" id="single_choice" className="absolute top-2 right-2" />
                <div className="mb-1 text-sm">Single Choice</div>
                <p className="text-xs text-muted-foreground">One option only</p>
              </div>
              
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-md p-2 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors relative">
                <RadioGroupItem value="text_input" id="text_input" className="absolute top-2 right-2" />
                <div className="mb-1 text-sm">Text Input</div>
                <p className="text-xs text-muted-foreground">Free-form text</p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-md p-2 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors relative">
                <RadioGroupItem value="address" id="address" className="absolute top-2 right-2" />
                <div className="mb-1 text-sm">Address</div>
                <p className="text-xs text-muted-foreground">Postcode lookup</p>
              </div>
              
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-md p-2 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors relative">
                <RadioGroupItem value="contact_form" id="contact_form" className="absolute top-2 right-2" />
                <div className="mb-1 text-sm">Contact Form</div>
                <p className="text-xs text-muted-foreground">Contact details</p>
              </div>
            </RadioGroup>
          </div>
          
          {question.type === "address" && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg ">
              <h3 className="text-md font-medium mb-3">Postcode API Settings</h3>
              
              <RadioGroup 
                defaultValue={question.postcodeApi || "custom"} 
                onValueChange={(value) => {
                  onChange({
                    ...question,
                    postcodeApi: value as "custom" | "postcodes4u"
                  });
                }}
                className="grid grid-cols-2 gap-2"
              >
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-md p-2 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors relative">
                  <RadioGroupItem value="custom" id="custom-api" className="absolute top-2 right-2" />
                  <div className="mb-1 text-sm">Custom API</div>
                  <p className="text-xs text-muted-foreground">Use WebBuildAPI</p>
                </div>
                
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-md p-2 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors relative">
                  <RadioGroupItem value="postcodes4u" id="postcodes4u" className="absolute top-2 right-2" />
                  <div className="mb-1 text-sm">Postcodes4u</div>
                  <p className="text-xs text-muted-foreground">Use Postcodes4u</p>
                </div>
              </RadioGroup>
              
              <p className="text-xs text-muted-foreground mt-3">
                API keys can be configured in the form settings.
              </p>
            </div>
          )}

          {(question.type === "multiple_choice" || question.type === "single_choice") && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg ">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-md font-medium">Answer Options</h3>
                
                <div className="flex items-center gap-2">
                  <RadioGroup 
                    className="flex" 
                    defaultValue={optionType} 
                    onValueChange={(value) => setOptionType(value as "text" | "image")}
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="text" id="text-option" className="h-3 w-3" />
                      <Label htmlFor="text-option" className="flex items-center gap-1 text-xs">
                        <TextIcon className="h-3 w-3" /> Text
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <RadioGroupItem value="image" id="image-option" className="h-3 w-3" />
                      <Label htmlFor="image-option" className="flex items-center gap-1 text-xs">
                        <ImageIcon className="h-3 w-3" /> Image
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  <Button
                    size="sm"
                    onClick={addOption}
                    className="h-7 text-xs bg-black hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                  >
                    <PlusIcon className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 overflow-y-auto pr-1">
                {question.options?.map((option, index) => (
                  <div 
                    key={option.id} 
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-2  hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-5">
                        <Label className="text-xs mb-1 block text-muted-foreground">Option Text</Label>
                        <Input
                          value={option.text}
                          onChange={(e) => updateOption(index, "text", e.target.value)}
                          placeholder="Option text"
                          className="border-zinc-300 dark:border-zinc-700 focus-visible:ring-black text-xs h-7"
                        />
                      </div>
                      
                      <div className="col-span-5">
                        <Label className="text-xs mb-1 block text-muted-foreground">Option Description</Label>
                        <Input
                          value={option.description || ""}
                          onChange={(e) => updateOption(index, "description", e.target.value)}
                          placeholder="Brief description (optional)"
                          className="border-zinc-300 dark:border-zinc-700 focus-visible:ring-black text-xs h-7"
                        />
                      </div>
                      
                      <div className="col-span-5">
                        <Label className="text-xs mb-1 block text-muted-foreground">
                          {optionType === "image" ? "Image URL" : "Icon (optional)"}
                        </Label>
                        <div className="relative">
                          <Input
                            value={option.icon || ""}
                            onChange={(e) => updateOption(index, "icon", e.target.value)}
                            placeholder={optionType === "image" ? "Image URL" : "Icon (optional)"}
                            className="border-zinc-300 dark:border-zinc-700 focus-visible:ring-black text-xs h-7"
                          />
                          {option.icon && isImageUrl(option.icon) && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0"
                                >
                                  <ImageIcon className="h-3 w-3" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent side="top" className="w-auto p-1">
                                <img
                                  src={option.icon}
                                  alt={option.text}
                                  className="max-w-28 max-h-28 object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/png?text=Error';
                                  }}
                                />
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </div>
                      
                      <div className="col-span-2 flex justify-end items-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeOption(index)}
                          className="h-7 w-7 p-0 rounded-full text-zinc-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400"
                          disabled={!question.options || question.options.length <= 1}
                        >
                          <Trash2Icon className="h-3 w-3" />
                          <span className="sr-only">Remove option</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="logic" className="animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 ">
            <div>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-md font-medium">Conditional Display Logic</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Only show this question when specific answers are selected
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="enable-conditions" className="text-xs font-medium">Enable Logic</Label>
                  <Checkbox 
                    id="enable-conditions"
                    checked={conditionsEnabled}
                    onCheckedChange={(checked) => toggleConditions(!!checked)}
                    className="h-4 w-4 border-zinc-400 data-[state=checked]:bg-black data-[state=checked]:border-black dark:data-[state=checked]:bg-white dark:data-[state=checked]:border-white"
                  />
                </div>
              </div>

              {conditionsEnabled && (
                <div className="space-y-4 mt-3">
                  <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-md border border-zinc-200 dark:border-zinc-800">
                    <label className="text-xs font-medium mb-2 block">Combine conditions with:</label>
                    <RadioGroup 
                      value={conditionsLogicType} 
                      onValueChange={handleConditionLogicChange}
                      className="grid grid-cols-2 gap-2"
                    >
                      <div className="bg-white dark:bg-black rounded-md p-2 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors relative">
                        <RadioGroupItem value="AND" id="and-logic" className="absolute top-2 right-2 h-3 w-3" />
                        <div className="mb-1 text-xs">All must match (AND)</div>
                        <p className="text-[10px] text-muted-foreground">All conditions must be true</p>
                      </div>
                      <div className="bg-white dark:bg-black rounded-md p-2 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors relative">
                        <RadioGroupItem value="OR" id="or-logic" className="absolute top-2 right-2 h-3 w-3" />
                        <div className="mb-1 text-xs">Any can match (OR)</div>
                        <p className="text-[10px] text-muted-foreground">At least one condition must be true</p>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="overflow-y-auto pr-1 space-y-3">
                    {question.conditions?.map((condition, index) => (
                      <div key={index} className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-md p-3 relative ">
                        <div className="absolute top-2 right-2 text-red-500">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            onClick={() => removeCondition(index)}
                          >
                            <Trash2Icon className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="mb-2">
                          <h4 className="text-xs font-medium">Condition {index + 1}</h4>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="bg-zinc-50 dark:bg-zinc-900 p-2 rounded-md border border-zinc-200 dark:border-zinc-800">
                            <Label className="text-xs font-medium mb-1 block">Depends on Question</Label>
                            <Select
                              value={condition.questionId}
                              onValueChange={(value) => updateCondition(index, "questionId", value)}
                            >
                              <SelectTrigger className="w-full border-zinc-300 dark:border-zinc-700 focus:ring-black h-7 text-xs">
                                <SelectValue placeholder="Select question" />
                              </SelectTrigger>
                              <SelectContent>
                                {previousQuestions.map((q) => (
                                  <SelectItem key={q.id} value={q.id} className="text-xs">
                                    {q.text}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label className="text-xs font-medium mb-1 block">Show when answer includes:</Label>
                            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-2">
                              {(() => {
                                const targetQuestion = previousQuestions.find(q => q.id === condition.questionId);
                                if (!targetQuestion || !targetQuestion.options) return (
                                  <p className="text-xs text-zinc-500">Please select a valid question</p>
                                );
                                
                                return (
                                  <div className="flex flex-row gap-2 flex-wrap justify-start">
                                    {targetQuestion.options.map(option => (
                                      <div key={option.id} className="flex items-center space-x-1 my-1">
                                        <Checkbox 
                                          id={`option-${option.id}-${index}`}
                                          checked={condition.values.includes(option.id)} 
                                          onCheckedChange={(checked) => handleConditionValueChange(index, option.id, !!checked)} 
                                          className="border-zinc-400 h-3 w-3"
                                        />
                                        <Label htmlFor={`option-${option.id}-${index}`} className="text-xs">
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
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={addCondition}
                    className="mt-2 border-dashed flex items-center bg-zinc-50 dark:bg-zinc-900 h-7 text-xs w-full"
                    disabled={previousQuestions.length === 0}
                  >
                    <PlusIcon className="w-3 h-3 mr-1" />
                    Add Another Condition
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end space-x-2 mt-4 border-t pt-3">
        <Button variant="outline" size="sm" onClick={onCancel} className="h-8">
          <XIcon className="h-3 w-3 mr-1" />
          Cancel
        </Button>
        <Button size="sm" onClick={onSave} className="h-8 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
          <SaveIcon className="h-3 w-3 mr-1" />
          Save Question
        </Button>
      </div>
    </div>
  );
};

export default QuestionEditor; 