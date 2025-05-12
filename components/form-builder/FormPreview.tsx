"use client";

import { useState, useEffect } from "react";
import { FormState, Question, Option, Condition } from "./FormDesigner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isUri } from 'valid-url';
import { InfoIcon, ArrowRight, ArrowLeft, CheckCircle2, ChevronLeft, CheckIcon, RefreshCw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type FormPreviewProps = {
  formState: FormState;
};

const FormPreview = ({ formState }: FormPreviewProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [progress, setProgress] = useState(0);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Set initial question index when form changes
  useEffect(() => {
    if (formState.questions.length > 0) {
      const firstVisibleIndex = findFirstVisibleQuestionIndex();
      setCurrentQuestionIndex(firstVisibleIndex);
      
      // Reset progress calculation
      calculateProgress(firstVisibleIndex);
    } else {
      setCurrentQuestionIndex(null);
      setProgress(0);
    }
  }, [formState]);

  // Find first visible question
  const findFirstVisibleQuestionIndex = (): number | null => {
    const index = formState.questions.findIndex(question => isQuestionVisible(question));
    return index !== -1 ? index : null;
  };

  // Check if a question should be visible based on conditions
  const isQuestionVisible = (question: Question): boolean => {
    if (!question.conditions || question.conditions.length === 0) {
      return true;
    }
    
    // Determine overall logic (AND/OR) between conditions
    const logic = question.conditionLogic || "AND"; // Default to AND if not specified
    
    const debugConditionEvaluation = (condition: Condition, result: boolean) => {
      const sourceQuestion = formState.questions.find(q => q.id === condition.questionId);
      console.log(`Condition for ${question.text}:`, {
        sourceQuestion: sourceQuestion?.text,
        answer: answers[condition.questionId],
        values: condition.values,
        result
      });
    };

    const checkCondition = (condition: Condition) => {
      const sourceQuestion = formState.questions.find(q => q.id === condition.questionId);
      const answer = answers[condition.questionId];
      
      if (answer === undefined || !sourceQuestion) {
        debugConditionEvaluation(condition, false);
        return false; // Cannot evaluate if answer or source question is missing
      }

      // Handle condition based on the source question type
      if (sourceQuestion.type === "multiple_choice" || sourceQuestion.type === "single_choice") {
        const answerArray = Array.isArray(answer) ? answer : [answer]; // Ensure answer is an array
        
        // Always use "any" logic - show if any of the condition values match any of the selected answers
        const result = condition.values.some(val => answerArray.includes(val));
        debugConditionEvaluation(condition, result);
        return result;
      } else if (sourceQuestion.type === "text_input") {
        // Simple equality check for text input (assuming condition.values[0] holds the target text)
        const result = condition.values[0] === answer;
        debugConditionEvaluation(condition, result);
        return result;
      }
      
      debugConditionEvaluation(condition, false);
      return false; // Default to false if type is unknown
    };

    const results = question.conditions.map(checkCondition);
    const finalResult = logic === "AND" ? results.every(Boolean) : results.some(Boolean);
    
    console.log(`Question "${question.text}" visibility with ${logic} logic:`, results, "Final:", finalResult);
    
    return finalResult;
  };

  // Navigate to the next visible question
  const goToNextQuestion = () => {
    if (currentQuestionIndex === null || currentQuestionIndex >= formState.questions.length - 1) {
      setFormSubmitted(true);
      return;
    }

    let nextIndex = currentQuestionIndex + 1;
    
    while (nextIndex < formState.questions.length) {
      if (isQuestionVisible(formState.questions[nextIndex])) {
        setCurrentQuestionIndex(nextIndex);
        calculateProgress(nextIndex);
        return;
      }
      nextIndex++;
    }
    
    // If no more visible questions, show submit screen
    setFormSubmitted(true);
  };

  // Navigate to the previous visible question
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex === null || currentQuestionIndex <= 0) {
      return;
    }

    let prevIndex = currentQuestionIndex - 1;
    
    while (prevIndex >= 0) {
      if (isQuestionVisible(formState.questions[prevIndex])) {
        setCurrentQuestionIndex(prevIndex);
        calculateProgress(prevIndex);
        return;
      }
      prevIndex--;
    }
  };

  // Calculate the progress as a percentage
  const calculateProgress = (currentIndex: number | null) => {
    if (currentIndex === null || formState.questions.length === 0) {
      setProgress(0);
      return;
    }

    // Count visible questions up to the current index
    let visibleCount = 0;
    let totalVisible = 0;
    
    // First, count total visible questions
    formState.questions.forEach(question => {
      if (isQuestionVisible(question)) {
        totalVisible++;
      }
    });
    
    // Then count completed questions
    for (let i = 0; i <= currentIndex; i++) {
      if (isQuestionVisible(formState.questions[i])) {
        visibleCount++;
      }
    }
    
    const newProgress = totalVisible > 0 ? (visibleCount / totalVisible) * 100 : 0;
    setProgress(newProgress);
  };

  // Handle user input for a question
  const handleQuestionResponse = (questionId: string, value: string | string[], autoAdvance = false) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Auto advance to next question for single-choice if autoAdvance is true
    if (autoAdvance) {
      goToNextQuestion();
    }
  };

  // Reset the form to start over
  const resetForm = () => {
    setAnswers({});
    setFormSubmitted(false);
    const firstIndex = findFirstVisibleQuestionIndex();
    setCurrentQuestionIndex(firstIndex);
    calculateProgress(firstIndex);
  };

  // Check if a URL is an image URL
  const isImageUrl = (url?: string): boolean => {
    if (!url) return false;
    return url.match(/\.(jpeg|jpg|gif|png|webp)$/) !== null || isUri(url) !== undefined;
  };

  // Render an option's content
  const renderOptionContent = (option: Option) => {
    // Check if it has an icon URL
    const hasIcon = option.icon && isImageUrl(option.icon);
    
    return (
      <div className="flex flex-col items-center w-full h-full text-center">
        {hasIcon && (
          <div className="mb-3 w-full flex justify-center">
            <img 
              src={option.icon} 
              alt={option.text} 
              className="object-contain h-20 w-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/png?text=Error';
              }}
            />
          </div>
        )}
        <span className="text-center font-medium">{option.text}</span>
        {option.description && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground mt-1 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="p-2 max-w-xs">
                <p className="text-sm">{option.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  };

  // Render the current question
  const renderQuestion = () => {
    if (currentQuestionIndex === null || !formState.questions[currentQuestionIndex]) {
      return (
        <div className="text-center p-8">
          <p className="text-muted-foreground">No questions available.</p>
        </div>
      );
    }

    const currentQuestion = formState.questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion.id];
    
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Question */}
        <div className="space-y-2">
          <h3 className="text-xl font-medium">
            {currentQuestion.text}
            {currentQuestion.required && <span className="text-destructive ml-1">*</span>}
          </h3>
          {currentQuestion.description && (
            <p className="text-muted-foreground">{currentQuestion.description}</p>
          )}
        </div>
        
        {/* Possible answers */}
        <div className="space-y-3">
          {/* Render for single choice questions */}
          {currentQuestion.type === "single_choice" && currentQuestion.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {currentQuestion.options.map((option) => (
                <div
                  key={option.id}
                  className={cn(
                    "relative rounded-lg border p-4 cursor-pointer transition-all hover:border-accent/60 flex flex-col items-center justify-between h-full",
                    currentAnswer === option.id ? "bg-accent text-accent-foreground border-accent shadow-sm" : "bg-card"
                  )}
                  onClick={() => handleQuestionResponse(currentQuestion.id, option.id, true)}
                >
                  <div className={cn(
                    "absolute top-2 right-2 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    currentAnswer === option.id ? "border-accent-foreground" : "border-muted-foreground"
                  )}>
                    {currentAnswer === option.id && <div className="w-2.5 h-2.5 rounded-full bg-accent-foreground" />}
                  </div>
                  {renderOptionContent(option)}
                </div>
              ))}
            </div>
          )}
          
          {/* Render for multiple choice questions */}
          {currentQuestion.type === "multiple_choice" && currentQuestion.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {currentQuestion.options.map((option) => {
                const isSelected = Array.isArray(currentAnswer) && currentAnswer.includes(option.id);
                
                return (
                  <div
                    key={option.id}
                    className={cn(
                      "relative rounded-lg border p-4 cursor-pointer transition-all hover:border-accent/60 flex flex-col items-center justify-between h-full",
                      isSelected ? "bg-accent/20 border-accent shadow-sm" : "bg-card"
                    )}
                    onClick={() => {
                      const currentAnswerArray = Array.isArray(currentAnswer) ? currentAnswer : [];
                      const updatedAnswer = isSelected
                        ? currentAnswerArray.filter(id => id !== option.id)
                        : [...currentAnswerArray, option.id];
                      
                      handleQuestionResponse(currentQuestion.id, updatedAnswer);
                    }}
                  >
                    <div className={cn(
                      "absolute top-2 right-2 h-5 w-5 rounded-md border-2 flex items-center justify-center",
                      isSelected ? "border-accent bg-accent/20" : "border-muted-foreground"
                    )}>
                      {isSelected && <CheckIcon className="h-3 w-3 text-accent" />}
                    </div>
                    {renderOptionContent(option)}
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Render for text input questions */}
          {currentQuestion.type === "text_input" && (
            <div className="space-y-2">
              <Input
                type="text"
                value={currentAnswer as string || ""}
                onChange={(e) => handleQuestionResponse(currentQuestion.id, e.target.value)}
                placeholder={currentQuestion.placeholder || "Type your answer here"}
                className="w-full bg-background/50"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render the thank you screen after form completion
  const renderThankYouScreen = () => {
    return (
      <div className="flex flex-col items-center justify-center text-center py-8 animate-scale-up">
        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 text-accent" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Thank You!</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Your response has been recorded. We'll get back to you shortly with your custom quote.
        </p>
        <Button variant="outline" onClick={resetForm} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Start Over
        </Button>
      </div>
    );
  };

  // Determine if we should show the next button
  const shouldShowNextButton = () => {
    if (currentQuestionIndex === null) return false;
    const currentQuestion = formState.questions[currentQuestionIndex];
    if (!currentQuestion) return false;
    
    // If required, only show when there's an answer
    if (currentQuestion.required) {
      const currentAnswer = answers[currentQuestion.id];
      
      if (currentQuestion.type === "single_choice") {
        return currentAnswer !== undefined;
      } else if (currentQuestion.type === "multiple_choice") {
        return Array.isArray(currentAnswer) && currentAnswer.length > 0;
      } else if (currentQuestion.type === "text_input") {
        return currentAnswer !== undefined && String(currentAnswer).trim().length > 0;
      }
    }
    
    // Not required, so always show the next button
    return true;
  };

  // If there are no questions, show a message
  if (formState.questions.length === 0) {
    return (
      <Card className="rounded-lg overflow-hidden shadow-md">
        <CardContent className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Add questions to see the preview</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="">
      {/* Progress bar */}
      <div className="bg-background h-1 w-full">
        <div 
          className="h-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <CardHeader className="text-center px-6 pt-8 pb-0">
        <CardTitle className="text-2xl font-bold mb-2">{formState.title}</CardTitle>
        <CardDescription className="text-base">{formState.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 pt-8">
        {formSubmitted ? renderThankYouScreen() : renderQuestion()}
      </CardContent>
      
      {!formSubmitted && currentQuestionIndex !== null && (
        <CardFooter className="flex justify-between p-6 pt-2 border-t">
          <Button
            variant="ghost"
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="rounded-lg gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          
          <Button
            onClick={goToNextQuestion}
            disabled={!shouldShowNextButton()}
            className="rounded-lg gap-1 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {currentQuestionIndex >= formState.questions.length - 1 ? "Submit" : "Next"}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default FormPreview; 