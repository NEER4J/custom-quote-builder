"use client";

import { useState, useEffect, useRef } from "react";
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
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [activeQuestionIds, setActiveQuestionIds] = useState<string[]>([]);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [mobileInfoVisible, setMobileInfoVisible] = useState<string | null>(null);
  const infoButtonRef = useRef<HTMLDivElement>(null);

  // Add click outside listener to close info popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (infoButtonRef.current && !infoButtonRef.current.contains(event.target as Node)) {
        setMobileInfoVisible(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to check if a string is an image URL
  const isImageUrl = (url: string): boolean => {
    if (!url) return false;
    if (isUri(url)) {
      const fileExtension = url.split('.').pop()?.toLowerCase();
      return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension || '');
    }
    return false;
  };
  
  // Initialize with the first visible question
  useEffect(() => {
    if (formState.questions.length > 0) {
      const visibleQuestionIds = formState.questions
        .filter(isQuestionVisible)
        .map(q => q.id);
      
      setActiveQuestionIds(visibleQuestionIds);
      
      if (visibleQuestionIds.length > 0) {
        const firstVisibleIndex = formState.questions.findIndex(q => q.id === visibleQuestionIds[0]);
        setCurrentQuestionIndex(firstVisibleIndex);
      }
    }
  }, [formState.questions]);
  
  // Recalculate active question IDs whenever answers change
  useEffect(() => {
    const visibleQuestionIds = formState.questions
      .filter(isQuestionVisible)
      .map(q => q.id);
    
    setActiveQuestionIds(visibleQuestionIds);
    
    // If current question is no longer visible, move to first visible question
    if (currentQuestionIndex !== null && 
        !visibleQuestionIds.includes(formState.questions[currentQuestionIndex]?.id)) {
      const firstVisibleIndex = formState.questions.findIndex(q => visibleQuestionIds.includes(q.id));
      if (firstVisibleIndex !== -1) {
        setCurrentQuestionIndex(firstVisibleIndex);
      }
    }
  }, [answers, formState.questions]);
  
  // Calculate the progress percentage
  const progress = currentQuestionIndex !== null && activeQuestionIds.length > 0
    ? ((activeQuestionIds.indexOf(formState.questions[currentQuestionIndex]?.id) + 1) / activeQuestionIds.length) * 100
    : 0;

  // Check if a question should be visible based on conditions
  const isQuestionVisible = (question: Question): boolean => {
    if (!question.conditions || question.conditions.length === 0) {
      return true;
    }
    
    // Determine overall logic (AND/OR) between conditions
    const logic = question.conditionLogic || "AND"; // Default to AND if not specified

    const checkCondition = (condition: Condition) => {
      const sourceQuestion = formState.questions.find(q => q.id === condition.questionId);
      const answer = answers[condition.questionId];
      
      if (answer === undefined || !sourceQuestion) {
        return false; // Cannot evaluate if answer or source question is missing
      }

      // Handle condition based on the source question type
      if (sourceQuestion.type === "multiple_choice" || sourceQuestion.type === "single_choice") {
        const answerArray = Array.isArray(answer) ? answer : [answer]; // Ensure answer is an array
        
        // Always use "any" logic - show if any of the condition values match any of the selected answers
        const result = condition.values.some(val => answerArray.includes(val));
        return result;
      } else if (sourceQuestion.type === "text_input") {
        // Simple equality check for text input (assuming condition.values[0] holds the target text)
        const result = condition.values[0] === answer;
        return result;
      }
      
      return false; // Default to false if type is unknown
    };

    const results = question.conditions.map(checkCondition);
    const finalResult = logic === "AND" ? results.every(Boolean) : results.some(Boolean);
    
    return finalResult;
  };

  // Handle user's response to a question
  const handleQuestionResponse = (questionId: string, value: any, moveNext = false) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Automatically move to next question if it's a single choice
    if (moveNext) {
      setTimeout(() => {
        goToNextQuestion();
      }, 300);
    }
  };

  // Go to the next visible question
  const goToNextQuestion = () => {
    if (currentQuestionIndex === null) return;
    
    const currentQuestionId = formState.questions[currentQuestionIndex]?.id;
    const currentActiveIndex = activeQuestionIds.indexOf(currentQuestionId);
    
    if (currentActiveIndex < activeQuestionIds.length - 1) {
      // Move to next visible question
      const nextQuestionId = activeQuestionIds[currentActiveIndex + 1];
      const nextIndex = formState.questions.findIndex(q => q.id === nextQuestionId);
      if (nextIndex !== -1) {
        setCurrentQuestionIndex(nextIndex);
      }
    } else {
      // This is the last question, submit the form
      setFormSubmitted(true);
    }
  };

  // Go to the previous visible question
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex === null) return;
    
    const currentQuestionId = formState.questions[currentQuestionIndex]?.id;
    const currentActiveIndex = activeQuestionIds.indexOf(currentQuestionId);
    
    if (currentActiveIndex > 0) {
      // Move to previous visible question
      const prevQuestionId = activeQuestionIds[currentActiveIndex - 1];
      const prevIndex = formState.questions.findIndex(q => q.id === prevQuestionId);
      if (prevIndex !== -1) {
        setCurrentQuestionIndex(prevIndex);
      }
    }
  };

  // Determine if the Next button should be enabled
  const shouldShowNextButton = () => {
    if (currentQuestionIndex === null) return false;
    
    const currentQuestion = formState.questions[currentQuestionIndex];
    
    if (!currentQuestion) return false;
    
    // Required question must have an answer
    if (currentQuestion.required) {
      const answer = answers[currentQuestion.id];
      
      if (answer === undefined) return false;
      
      if (currentQuestion.type === "multiple_choice" && Array.isArray(answer)) {
        return answer.length > 0;
      }
      
      if (currentQuestion.type === "text_input" && typeof answer === "string") {
        return answer.trim() !== "";
      }
      
      return !!answer;
    }
    
    return true;
  };

  // Render the thank you screen after form submission
  const renderThankYouScreen = () => {
    return (
      <div className="text-center space-y-4 py-10">
        <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-accent/20 text-accent mb-4">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-bold">Thank you for your response!</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your answers have been recorded. We appreciate your time.
        </p>
        <div className="pt-4">
          <Button 
            variant="outline" 
            onClick={() => {
    setAnswers({});
    setFormSubmitted(false);
              
              // Return to first visible question
              const visibleQuestionIds = formState.questions
                .filter(q => !q.conditions || q.conditions.length === 0)
                .map(q => q.id);
              
              if (visibleQuestionIds.length > 0) {
                const firstVisibleIndex = formState.questions.findIndex(q => q.id === visibleQuestionIds[0]);
                setCurrentQuestionIndex(firstVisibleIndex);
              }
            }}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Start Over
          </Button>
        </div>
      </div>
    );
  };

  // Render an option's content
  const renderOptionContent = (option: Option) => {
    // Check if it has an icon URL
    const hasIcon = option.icon && isImageUrl(option.icon);
    
    return (
      <div className="flex flex-col sm:flex-col items-center w-full h-full">
        {hasIcon && (
          <div className="mb-3 w-full flex justify-center">
            <img 
              src={option.icon} 
              alt={option.text} 
              className="object-contain h-16 sm:h-20 w-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/png?text=Error';
              }}
            />
          </div>
        )}
        <span className="text-center font-medium">{option.text}</span>
      </div>
    );
  };

  // Horizontal layout for mobile
  const renderMobileOptionLayout = (option: Option, isSelected: boolean, onClick: () => void) => {
    // Check if it has an icon URL
    const hasIcon = option.icon && isImageUrl(option.icon);
    
    return (
      <div
        className={cn(
          "relative rounded-lg shadow-sm p-3 cursor-pointer transition-all hover:scale-105 flex items-center justify-center h-full bg-white",
          isSelected ? "border-2 border-accent" : "border border-transparent"
        )}
        onClick={onClick}
      >
        {option.description && (
          <div className="absolute top-2 left-2 z-10" ref={infoButtonRef}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 h-auto" 
              onClick={(e) => {
                e.stopPropagation();
                setMobileInfoVisible(mobileInfoVisible === option.id ? null : option.id);
              }}
            >
              <InfoIcon className="h-4 w-4 text-muted-foreground" />
            </Button>
            {mobileInfoVisible === option.id && (
              <div className="absolute mt-2 p-2 text-xs bg-muted rounded-md z-10 max-w-[200px] left-0 shadow-md">
                {option.description}
              </div>
            )}
          </div>
        )}
        
        {isSelected && (
          <div className="absolute top-2 right-2 h-5 w-5 rounded-full">
            <CheckIcon className="h-4 w-4 text-accent" />
          </div>
        )}
        
        <div className="flex items-center justify-center gap-3 w-full">
          {hasIcon && (
            <div className="w-16 flex-shrink-0">
              <img 
                src={option.icon} 
                alt={option.text} 
                className="object-contain h-14 w-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/png?text=Error';
                }}
              />
            </div>
          )}
          <span className="font-medium text-center">{option.text}</span>
        </div>
      </div>
    );
  };

  // Render the current question with responsive design
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
      <div className="space-y-6 animate-fade-in w-full max-w-5xl">
        {/* Question */}
        <div className="space-y-2 text-center pb-4">
          <h3 className="sm:text-3xl text-2xl font-medium mb-2">
            {currentQuestion.text}
            {currentQuestion.required && <span className="text-destructive ml-1">*</span>}
          </h3>
          {currentQuestion.description && (
            <p className="text-muted-foreground">{currentQuestion.description}</p>
          )}
        </div>
        
        {/* Possible answers - Responsive grid/list based on screen size */}
        <div className="space-y-3 px-1 sm:px-2">
          {/* Render for single choice questions - Desktop */}
          {currentQuestion.type === "single_choice" && currentQuestion.options && (
            <>
              {/* Desktop grid view */}
              <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {currentQuestion.options.map((option) => (
                  <div
                    key={option.id}
                    className={cn(
                      "transition-all relative rounded-lg p-4 cursor-pointer transition-all hover:scale-105 flex flex-col items-center justify-between h-full bg-white",
                      currentAnswer === option.id ? "border-2 border-accent" : "border border-transparent"
                    )}
                    onClick={() => handleQuestionResponse(currentQuestion.id, option.id, true)}
                  >
                    {option.description && (
                      <div className="absolute top-2 left-2 z-10" ref={infoButtonRef}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-0 h-auto" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setMobileInfoVisible(mobileInfoVisible === option.id ? null : option.id);
                          }}
                        >
                          <InfoIcon className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        {mobileInfoVisible === option.id && (
                          <div className="absolute mt-2 p-2 text-xs bg-muted rounded-md z-10 max-w-[200px] left-0 shadow-md" style={{width: 'max-content'}}>
                            {option.description}
                          </div>
                        )}
                      </div>
                    )}
                    {renderOptionContent(option)}
                  </div>
                ))}
              </div>
              
              {/* Mobile list view */}
              <div className="block sm:hidden space-y-2">
                {currentQuestion.options.map((option) => (
                  <div key={option.id}>
                    {renderMobileOptionLayout(
                      option,
                      currentAnswer === option.id,
                      () => handleQuestionResponse(currentQuestion.id, option.id, true)
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          
          {/* Render for multiple choice questions */}
          {currentQuestion.type === "multiple_choice" && currentQuestion.options && (
            <>
              {/* Desktop grid view */}
              <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {currentQuestion.options.map((option) => {
                  const isSelected = Array.isArray(currentAnswer) && currentAnswer.includes(option.id);
                  
                  return (
                    <div
                      key={option.id}
                      className={cn(
                        "relative rounded-lg shadow-sm p-4 cursor-pointer transition-all hover:scale-105 flex flex-col items-center justify-between h-full bg-white",
                        isSelected ? "border-2 border-accent" : "border border-transparent"
                      )}
                      onClick={() => {
                        const currentAnswerArray = Array.isArray(currentAnswer) ? currentAnswer : [];
                        const updatedAnswer = isSelected
                          ? currentAnswerArray.filter(id => id !== option.id)
                          : [...currentAnswerArray, option.id];
                        
                        handleQuestionResponse(currentQuestion.id, updatedAnswer);
                      }}
                    >
                      {option.description && (
                        <div className="absolute top-2 left-2 z-10" ref={infoButtonRef}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-0 h-auto" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setMobileInfoVisible(mobileInfoVisible === option.id ? null : option.id);
                            }}
                          >
                            <InfoIcon className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          {mobileInfoVisible === option.id && (
                            <div className="absolute mt-2 p-2 text-xs bg-muted rounded-md z-10 max-w-[200px] left-0 shadow-md">
                              {option.description}
                            </div>
                          )}
                        </div>
                      )}
                      <div className={cn(
                        "absolute top-2 right-2 h-5 w-5 rounded-md border-2 flex items-center justify-center",
                        isSelected ? "border-accent" : "border-muted-foreground"
                      )}>
                        {isSelected && <CheckIcon className="h-3 w-3 text-accent" />}
                      </div>
                      {renderOptionContent(option)}
                    </div>
                  );
                })}
              </div>
              
              {/* Mobile list view */}
              <div className="block sm:hidden space-y-2">
                {currentQuestion.options.map((option) => {
                  const isSelected = Array.isArray(currentAnswer) && currentAnswer.includes(option.id);
                  
                  return (
                    <div key={option.id}>
                      {renderMobileOptionLayout(
                        option,
                        isSelected,
                        () => {
                          const currentAnswerArray = Array.isArray(currentAnswer) ? currentAnswer : [];
                          const updatedAnswer = isSelected
                            ? currentAnswerArray.filter(id => id !== option.id)
                            : [...currentAnswerArray, option.id];
                          
                          handleQuestionResponse(currentQuestion.id, updatedAnswer);
                        }
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
          
          {/* Render for text input questions */}
          {currentQuestion.type === "text_input" && (
            <div className="max-w-md mx-auto w-full">
              <Input
                type="text"
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleQuestionResponse(currentQuestion.id, e.target.value)}
                placeholder="Type your answer here..."
                className="w-full"
              />
            </div>
          )}

          {/* Next button for all question types except single choice (unless it's the last question) */}
          {(currentQuestion.type !== "single_choice" || 
            (currentQuestion.type === "single_choice" && 
             activeQuestionIds.indexOf(currentQuestion.id) === activeQuestionIds.length - 1)) && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={goToNextQuestion}
                disabled={!shouldShowNextButton()}
                className="rounded-lg gap-1 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {activeQuestionIds.indexOf(currentQuestion.id) >= activeQuestionIds.length - 1 ? "Submit" : "Next"}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-transparent h-full flex flex-col">
      {/* Progress bar */}
      <div className="bg-background h-1 w-full">
        <div 
          className="h-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <CardContent className="p-4 sm:p-6 pt-6 sm:pt-8 flex justify-center items-center flex-1">
        {formSubmitted ? renderThankYouScreen() : renderQuestion()}
      </CardContent>
      
      {!formSubmitted && currentQuestionIndex !== null && (
        <CardFooter className="flex justify-between p-4 pb-2 border-t">
          <Button
            variant="ghost"
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="rounded-lg gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default FormPreview; 