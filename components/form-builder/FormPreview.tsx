"use client";

import { useState, useEffect } from "react";
import { FormState, Question, Option, Condition } from "./FormDesigner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isUri } from 'valid-url';

type FormPreviewProps = {
  formState: FormState;
};

const FormPreview = ({ formState }: FormPreviewProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [progress, setProgress] = useState(0);
  const [formSubmitted, setFormSubmitted] = useState(false);

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
  const handleQuestionResponse = (questionId: string, value: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Reset the form
  const resetForm = () => {
    setAnswers({});
    setFormSubmitted(false);
    const firstVisibleIndex = findFirstVisibleQuestionIndex();
    setCurrentQuestionIndex(firstVisibleIndex);
    calculateProgress(firstVisibleIndex);
  };

  // Check if icon is an image URL - moved from QuestionEditor
  const isImageUrl = (url?: string): boolean => {
    if (!url) return false;
    // Simple check for common image extensions or if it starts with http/https
    // Or use a more robust check like the valid-url library
    return isUri(url) ? url.match(/\.(jpeg|jpg|gif|png|svg|webp)$/i) != null : false;
  };

  const renderOptionContent = (option: Option) => {
    if (isImageUrl(option.icon)) {
      return (
        <div className="flex items-center gap-3">
          <img 
            src={option.icon} 
            alt={option.text} 
            className="w-10 h-10 object-contain rounded mr-2" 
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} // Hide if image fails
          />
          <span>{option.text}</span>
        </div>
      );
    } else if (option.icon) { // Render icon if it's not a URL (e.g., emoji or name)
      return (
        <div className="flex items-center gap-3">
          <span className="text-xl mr-2">{option.icon}</span>
          <span>{option.text}</span>
        </div>
      );
    } else { // Just render text
      return <span>{option.text}</span>;
    }
  };

  // Render current question based on type
  const renderQuestion = () => {
    if (currentQuestionIndex === null || !formState.questions[currentQuestionIndex]) {
      return <div className="text-center py-8">No questions available</div>;
    }

    const question = formState.questions[currentQuestionIndex];
    const questionId = question.id;
    const currentAnswer = answers[questionId] || "";

    switch (question.type) {
      case "multiple_choice":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-medium">{question.text} {question.required && <span className="text-red-500">*</span>}</h3>
            <div className="grid gap-3">
              {question.options?.map(option => (
                <div
                  key={option.id}
                  className={`p-4 border rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center ${
                    Array.isArray(currentAnswer) && currentAnswer.includes(option.id)
                      ? "bg-zinc-100 dark:bg-zinc-800 border-black dark:border-white ring-1 ring-black dark:ring-white"
                      : "bg-white dark:bg-black border-zinc-200 dark:border-zinc-700"
                  }`}
                  onClick={() => {
                    const currentAnswers = Array.isArray(currentAnswer) ? [...currentAnswer] : [];
                    const optionIndex = currentAnswers.indexOf(option.id);
                    
                    if (optionIndex === -1) {
                      currentAnswers.push(option.id);
                    } else {
                      currentAnswers.splice(optionIndex, 1);
                    }
                    
                    handleQuestionResponse(questionId, currentAnswers);
                  }}
                >
                  {renderOptionContent(option)}
                </div>
              ))}
            </div>
          </div>
        );
        
      case "single_choice":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-medium">{question.text} {question.required && <span className="text-red-500">*</span>}</h3>
            <div className="grid gap-3">
              {question.options?.map(option => (
                <div
                  key={option.id}
                  className={`p-4 border rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center ${
                    currentAnswer === option.id 
                      ? "bg-zinc-100 dark:bg-zinc-800 border-black dark:border-white ring-1 ring-black dark:ring-white"
                      : "bg-white dark:bg-black border-zinc-200 dark:border-zinc-700"
                  }`}
                  onClick={() => handleQuestionResponse(questionId, option.id)}
                >
                   {renderOptionContent(option)}
                </div>
              ))}
            </div>
          </div>
        );
        
      case "text_input":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-medium">{question.text}</h3>
            <Input
              value={currentAnswer as string}
              onChange={(e) => handleQuestionResponse(questionId, e.target.value)}
              placeholder="Your answer"
            />
          </div>
        );
        
      default:
        return <div>Unknown question type</div>;
    }
  };

  // Form submission success screen
  const renderThankYouScreen = () => {
    return (
      <div className="text-center py-12 space-y-6">
        <h2 className="text-2xl font-bold">Thank you for your responses!</h2>
        <p className="text-muted-foreground">
          Your form has been submitted successfully.
        </p>
        <Button onClick={resetForm}>Start Over</Button>
      </div>
    );
  };

  return (
    <div 
      className="mx-auto max-w-3xl" 
      style={{ backgroundColor: formState.settings.backgroundColor }}
    >
      {/* Progress bar */}
      <div className="w-full h-2 bg-muted mb-6">
        <div 
          className="h-full transition-all duration-300 ease-in-out" 
          style={{ 
            width: `${progress}%`,
            backgroundColor: formState.settings.buttonColor 
          }}
        ></div>
      </div>
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>{formState.title}</CardTitle>
          <CardDescription>{formState.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {formSubmitted ? (
            renderThankYouScreen()
          ) : (
            <div className="space-y-8">
              {renderQuestion()}
              
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={goToPreviousQuestion}
                  disabled={currentQuestionIndex === 0 || currentQuestionIndex === null}
                >
                  Back
                </Button>
                
                <Button
                  onClick={goToNextQuestion}
                  style={{ backgroundColor: formState.settings.buttonColor }}
                  disabled={
                    currentQuestionIndex === null ||
                    (formState.questions[currentQuestionIndex]?.required &&
                      !answers[formState.questions[currentQuestionIndex]?.id])
                  }
                >
                  {currentQuestionIndex === formState.questions.length - 1 ? "Submit" : "Next"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FormPreview; 