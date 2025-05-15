"use client";

import { useState, useEffect } from "react";
import { FormSettings, SuccessPage, Condition, Question } from "./FormDesigner";
import { v4 as uuidv4 } from 'uuid';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Paintbrush, Globe, ExternalLink, Wand2, Key, MapPin, PlusCircle, X, CornerDownRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogClose 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

type FormSettingsEditorProps = {
  settings: FormSettings;
  onSettingsChange: (settings: FormSettings) => void;
};

const FormSettingsEditor = ({ settings, onSettingsChange }: FormSettingsEditorProps) => {
  const [editingSuccessPage, setEditingSuccessPage] = useState<SuccessPage | null>(null);
  const [successPageDialogOpen, setSuccessPageDialogOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");
  const [selectedConditionValues, setSelectedConditionValues] = useState<string[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof FormSettings) => {
    onSettingsChange({
      ...settings,
      [field]: e.target.value
    });
  };

  // Initialize success pages if they don't exist
  useEffect(() => {
    if (!settings.successPages) {
      onSettingsChange({
        ...settings,
        successPages: []
      });
    }
  }, []);

  // Get available questions from the parent component
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Use a custom event to get questions from FormBuilder
      const handleGetQuestions = (e: CustomEvent) => {
        if (e.detail && e.detail.questions) {
          setAvailableQuestions(e.detail.questions);
        }
      };
      
      window.addEventListener('getQuestionsForSuccessPages', handleGetQuestions as EventListener);
      
      // Dispatch event to request questions
      window.dispatchEvent(new CustomEvent('requestQuestionsForSuccessPages'));
      
      return () => {
        window.removeEventListener('getQuestionsForSuccessPages', handleGetQuestions as EventListener);
      };
    }
  }, [successPageDialogOpen]);

  const addSuccessPage = () => {
    const newSuccessPage: SuccessPage = {
      id: uuidv4(),
      name: `Success Page ${(settings.successPages?.length || 0) + 1}`,
      url: '',
      conditions: [],
      conditionLogic: "AND"
    };
    
    setEditingSuccessPage(newSuccessPage);
    setSuccessPageDialogOpen(true);
  };
  
  const editSuccessPage = (page: SuccessPage) => {
    setEditingSuccessPage({...page});
    setSuccessPageDialogOpen(true);
  };
  
  const deleteSuccessPage = (pageId: string) => {
    onSettingsChange({
      ...settings,
      successPages: settings.successPages?.filter(p => p.id !== pageId) || []
    });
  };
  
  const saveSuccessPage = () => {
    if (!editingSuccessPage) return;
    
    const updatedPages = [...(settings.successPages || [])];
    const existingIndex = updatedPages.findIndex(p => p.id === editingSuccessPage.id);
    
    if (existingIndex >= 0) {
      updatedPages[existingIndex] = editingSuccessPage;
    } else {
      updatedPages.push(editingSuccessPage);
    }
    
    onSettingsChange({
      ...settings,
      successPages: updatedPages
    });
    
    setSuccessPageDialogOpen(false);
    setEditingSuccessPage(null);
  };
  
  const addCondition = () => {
    if (!editingSuccessPage || !selectedQuestionId || selectedConditionValues.length === 0) return;
    
    const newCondition: Condition = {
      id: uuidv4(),
      questionId: selectedQuestionId,
      values: selectedConditionValues
    };
    
    setEditingSuccessPage({
      ...editingSuccessPage,
      conditions: [...(editingSuccessPage.conditions || []), newCondition]
    });
    
    setSelectedQuestionId("");
    setSelectedConditionValues([]);
  };
  
  const removeCondition = (conditionId: string) => {
    if (!editingSuccessPage) return;
    
    setEditingSuccessPage({
      ...editingSuccessPage,
      conditions: editingSuccessPage.conditions.filter(c => c.id !== conditionId)
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid gap-6">
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Paintbrush className="h-4 w-4" />
            <h3 className="text-sm font-medium uppercase tracking-wide">Appearance</h3>
          </div>
          
          <Separator />
          
          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="backgroundColor" className="text-sm font-medium">Background Color</Label>
              <div className="flex gap-3">
                <div className="relative">
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={settings.backgroundColor}
                    onChange={(e) => handleChange(e, "backgroundColor")}
                    className="w-10 h-10 p-1 overflow-hidden rounded-full cursor-pointer"
                  />
                  <div className="absolute inset-0 rounded-full pointer-events-none border" />
                </div>
                <Input
                  value={settings.backgroundColor}
                  onChange={(e) => handleChange(e, "backgroundColor")}
                  className="flex-1 bg-background/50"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Choose a background color for your form
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="buttonColor" className="text-sm font-medium">Button Color</Label>
              <div className="flex gap-3">
                <div className="relative">
                  <Input
                    id="buttonColor"
                    type="color"
                    value={settings.buttonColor}
                    onChange={(e) => handleChange(e, "buttonColor")}
                    className="w-10 h-10 p-1 overflow-hidden rounded-full cursor-pointer"
                  />
                  <div className="absolute inset-0 rounded-full pointer-events-none border" />
                </div>
                <Input
                  value={settings.buttonColor}
                  onChange={(e) => handleChange(e, "buttonColor")}
                  className="flex-1 bg-background/50"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Choose a color for the form submit button
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ExternalLink className="h-4 w-4" />
            <h3 className="text-sm font-medium uppercase tracking-wide">Integration Settings</h3>
          </div>
          
          <Separator />
          
          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="submitUrl" className="text-sm font-medium">Default Redirect URL</Label>
              <Input
                id="submitUrl"
                placeholder="https://example.com/thank-you"
                value={settings.submitUrl}
                onChange={(e) => handleChange(e, "submitUrl")}
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground">
                Default page to redirect users after form submission if no conditional redirects match
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="zapierWebhookUrl" className="text-sm font-medium">Zapier Webhook URL</Label>
              <Input
                id="zapierWebhookUrl"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                value={settings.zapierWebhookUrl}
                onChange={(e) => handleChange(e, "zapierWebhookUrl")}
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground">
                Connect to Zapier to process form submissions
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="h-4 w-4" />
            <h3 className="text-sm font-medium uppercase tracking-wide">Conditional Success Pages</h3>
          </div>
          
          <Separator />
          
          <div className="grid gap-5">
            {settings.successPages && settings.successPages.length > 0 ? (
              <div className="space-y-3">
                {settings.successPages.map(page => (
                  <div key={page.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium text-sm">{page.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{page.url}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => editSuccessPage(page)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteSuccessPage(page.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 border border-dashed rounded-md">
                <p className="text-sm text-muted-foreground">No conditional success pages configured</p>
              </div>
            )}
            
            <Button 
              variant="outline" 
              onClick={addSuccessPage} 
              className="w-full"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Success Page
            </Button>
          </div>
        </div>
        
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <h3 className="text-sm font-medium uppercase tracking-wide">Address API Settings</h3>
          </div>
          
          <Separator />
          
          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="customApiKey" className="text-sm font-medium">Custom API Key</Label>
              <Input
                id="customApiKey"
                placeholder="Your WebBuildAPI key"
                value={settings.customApiKey || ""}
                onChange={(e) => handleChange(e, "customApiKey")}
                className="bg-background/50"
                type="password"
              />
              <p className="text-xs text-muted-foreground">
                API key for WebBuildAPI postcode lookup service
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="postcodes4uUsername" className="text-sm font-medium">Postcodes4u Username</Label>
              <Input
                id="postcodes4uUsername"
                placeholder="Your Postcodes4u username"
                value={settings.postcodes4uUsername || ""}
                onChange={(e) => handleChange(e, "postcodes4uUsername")}
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground">
                Username for Postcodes4u service
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="postcodes4uProductKey" className="text-sm font-medium">Postcodes4u Product Key</Label>
              <Input
                id="postcodes4uProductKey"
                placeholder="Your Postcodes4u product key"
                value={settings.postcodes4uProductKey || ""}
                onChange={(e) => handleChange(e, "postcodes4uProductKey")}
                className="bg-background/50"
                type="password"
              />
              <p className="text-xs text-muted-foreground">
                Product key for Postcodes4u service
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wand2 className="h-4 w-4" />
            <h3 className="text-sm font-medium uppercase tracking-wide">Advanced Settings</h3>
          </div>
          
          <Separator />
          
          <div className="space-y-2 rounded-lg bg-accent/10 border border-accent/20 p-4 text-sm">
            <p className="text-muted-foreground">
              More advanced settings like custom CSS, custom JavaScript, and email notifications will be available in the full version.
            </p>
          </div>
        </div>
      </div>

      {/* Success Page Dialog */}
      <Dialog open={successPageDialogOpen} onOpenChange={setSuccessPageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configure Success Page</DialogTitle>
          </DialogHeader>
          
          {editingSuccessPage && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6 py-4 px-1">
                <div className="grid gap-2">
                  <Label htmlFor="pageName" className="text-sm font-medium">Page Name</Label>
                  <Input
                    id="pageName"
                    value={editingSuccessPage.name}
                    onChange={(e) => setEditingSuccessPage({
                      ...editingSuccessPage,
                      name: e.target.value
                    })}
                    className="bg-background/50"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="pageUrl" className="text-sm font-medium">Redirect URL</Label>
                  <Input
                    id="pageUrl"
                    placeholder="https://example.com/success-page"
                    value={editingSuccessPage.url}
                    onChange={(e) => setEditingSuccessPage({
                      ...editingSuccessPage,
                      url: e.target.value
                    })}
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    The URL to redirect users when conditions are met
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Condition Logic</Label>
                  <Select
                    value={editingSuccessPage.conditionLogic}
                    onValueChange={(value: "AND" | "OR") => setEditingSuccessPage({
                      ...editingSuccessPage,
                      conditionLogic: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select logic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">AND (All conditions must match)</SelectItem>
                      <SelectItem value="OR">OR (Any condition can match)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Conditions</Label>
                  
                  {editingSuccessPage.conditions.length > 0 ? (
                    <div className="space-y-2">
                      {editingSuccessPage.conditions.map(condition => {
                        const question = availableQuestions.find(q => q.id === condition.questionId);
                        const questionOptions = question?.options || [];
                        const optionLabels = condition.values.map(value => {
                          const option = questionOptions.find(opt => opt.id === value);
                          return option ? option.text : value;
                        }).join(', ');
                        
                        return (
                          <div key={condition.id} className="flex items-center justify-between p-2 border rounded-md">
                            <div className="text-sm">
                              <span className="font-medium">{question?.text || 'Unknown question'}</span>
                              <span className="mx-1">is</span>
                              <span>{optionLabels}</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeCondition(condition.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center p-3 border border-dashed rounded-md">
                      <p className="text-sm text-muted-foreground">No conditions added yet</p>
                    </div>
                  )}
                  
                  <div className="space-y-3 pt-2">
                    <div className="grid gap-2">
                      <Label htmlFor="questionId" className="text-xs">Select Question</Label>
                      <Select
                        value={selectedQuestionId}
                        onValueChange={setSelectedQuestionId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a question" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableQuestions
                            .filter(q => q.type === "single_choice" || q.type === "multiple_choice")
                            .map(question => (
                              <SelectItem key={question.id} value={question.id}>
                                {question.text}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {selectedQuestionId && (
                      <div className="grid gap-2">
                        <Label htmlFor="conditionValues" className="text-xs">Answer Value</Label>
                        <Select
                          value={selectedConditionValues[0] || ""}
                          onValueChange={(value) => setSelectedConditionValues([value])}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select answer" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableQuestions
                              .find(q => q.id === selectedQuestionId)?.options
                              ?.map(option => (
                                <SelectItem key={option.id} value={option.id}>
                                  {option.text}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={addCondition}
                      disabled={!selectedQuestionId || !selectedConditionValues.length}
                      className="w-full"
                    >
                      <PlusCircle className="mr-1 h-3 w-3" />
                      Add Condition
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={saveSuccessPage}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormSettingsEditor; 