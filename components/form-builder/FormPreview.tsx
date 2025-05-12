"use client";

import { useState, useEffect } from "react";
import { FormState, Question } from "./FormDesigner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

    return question.conditions.every(condition => {
      const answer = answers[condition.questionId];
      
      if (answer === undefined) {
        return false;
      }

      if (Array.isArray(answer)) {
        const hasValue = answer.includes(condition.value);
        return condition.operator === "equals" ? hasValue : !hasValue;
      } else {
        const matches = answer === condition.value;
        return condition.operator === "equals" ? matches : !matches;
      }
    });
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
            <h3 className="text-xl font-medium">{question.text}</h3>
            <div className="grid gap-3">
              {question.options?.map(option => (
                <div
                  key={option.id}
                  className={`p-4 border rounded-md cursor-pointer hover:bg-accent/50 transition-colors ${
                    Array.isArray(currentAnswer) && currentAnswer.includes(option.id)
                      ? "bg-accent border-primary"
                      : ""
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
                  <div className="flex items-center gap-3">
                    {option.icon && (
                      <div className="text-primary text-xl">{option.icon}</div>
                    )}
                    <span>{option.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        
      case "single_choice":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-medium">{question.text}</h3>
            <div className="grid gap-3">
              {question.options?.map(option => (
                <div
                  key={option.id}
                  className={`p-4 border rounded-md cursor-pointer hover:bg-accent/50 transition-colors ${
                    currentAnswer === option.id ? "bg-accent border-primary" : ""
                  }`}
                  onClick={() => handleQuestionResponse(questionId, option.id)}
                >
                  <div className="flex items-center gap-3">
                    {option.icon && (
                      <div className="text-primary text-xl">{option.icon}</div>
                    )}
                    <span>{option.text}</span>
                  </div>
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