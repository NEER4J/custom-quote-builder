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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { isUri } from 'valid-url';
import { InfoIcon, ArrowRight, ArrowLeft, CheckCircle2, ChevronLeft, CheckIcon, RefreshCw, Loader2, Search, Map } from "lucide-react";
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
  const [loadingPostcode, setLoadingPostcode] = useState<boolean>(false);
  const [postcodeError, setPostcodeError] = useState<string | null>(null);
  const [addressResults, setAddressResults] = useState<any[] | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const infoButtonRef = useRef<HTMLDivElement>(null);
  const [loadedPostcodes4u, setLoadedPostcodes4u] = useState<boolean>(false);

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
      
      // Validate contact form fields
      if (currentQuestion.type === "contact_form" && typeof answer === "object") {
        return (
          answer.firstName?.trim() !== "" && 
          answer.lastName?.trim() !== "" && 
          answer.phone?.trim() !== "" && 
          answer.email?.trim() !== "" && 
          answer.termsAccepted === true
        );
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

  // Add these new functions to look up postcodes using both APIs

  const lookupPostcodeWithCustomAPI = async (postcode: string) => {
    setLoadingPostcode(true);
    setPostcodeError(null);
    setAddressResults(null);
    
    try {
      const apiKey = formState.settings.customApiKey;
      
      if (!apiKey) {
        setPostcodeError('API key is not configured. Please add it in Form Settings.');
        setLoadingPostcode(false);
        return;
      }
      
      const response = await fetch(`https://webuildapi.com/post-code-lookup/api/postcodes/${postcode}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }
      
      const data = await response.json();
      
      if (!data.SearchEnd || !data.SearchEnd.Summaries || data.SearchEnd.Summaries.length === 0) {
        setPostcodeError('No addresses found for this postcode');
        setAddressResults([]);
      } else {
        setAddressResults(data.SearchEnd.Summaries);
      }
    } catch (error) {
      console.error('Error looking up postcode:', error);
      setPostcodeError('Error looking up postcode. Please try again.');
    } finally {
      setLoadingPostcode(false);
    }
  };

  const selectAddress = (address: any) => {
    if (!address) return;
    
    setSelectedAddress(address.Address);
    
    const currentQuestion = formState.questions[currentQuestionIndex!];
    const formattedAddress = {
      fullAddress: address.Address,
      buildingNumber: address.BuildingNumber,
      street: address.StreetAddress,
      town: address.Town,
      postcode: address.Postcode
    };
    
    handleQuestionResponse(currentQuestion.id, formattedAddress);
  };

  const resetAddressSearch = () => {
    setAddressResults(null);
    setSelectedAddress(null);
    setPostcodeError(null);
    
    // Clear the answer for the current question
    const currentQuestion = formState.questions[currentQuestionIndex!];
    const updatedAnswers = { ...answers };
    delete updatedAnswers[currentQuestion.id];
    setAnswers(updatedAnswers);
  };

  // Load Postcodes4u script if needed
  useEffect(() => {
    // Check if we need to load the Postcodes4u script
    const hasAddressQuestion = formState.questions.some(
      q => q.type === "address" && q.postcodeApi === "postcodes4u"
    );
    
    if (hasAddressQuestion && !loadedPostcodes4u && typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'http://www.postcodes4u.co.uk/postcodes4u.js';
      script.async = true;
      script.onload = () => {
        setLoadedPostcodes4u(true);
        console.log('Postcodes4u script loaded');
      };
      document.body.appendChild(script);
      
      return () => {
        // Clean up
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [formState.questions, loadedPostcodes4u]);

  // Render for address questions
  const renderAddressQuestion = (currentQuestion: Question, currentAnswer: any) => {
    if (currentQuestion.postcodeApi === "postcodes4u") {
      return (
        <div className="max-w-md mx-auto w-full space-y-4">
          {!currentAnswer ? (
            <div className="space-y-4">
              {/* Postcodes4u API Implementation */}
              <div id="postcodes4ukey" style={{ display: 'none' }}>
                {formState.settings.postcodes4uProductKey || ''}
              </div>
              <div id="postcodes4uuser" style={{ display: 'none' }}>
                {formState.settings.postcodes4uUsername || ''}
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Enter postcode"
                  className="flex-1 rounded-md border-gray-300"
                  id="postcode"
                />
                <button
                  onClick={() => {
                    if (typeof (window as any).SearchBegin === 'function') {
                      (window as any).SearchBegin();
                      
                      // Set up a mutation observer to watch for when the dropdown becomes visible
                      const dropdownObserver = new MutationObserver((mutations) => {
                        mutations.forEach((mutation) => {
                          const dropdown = document.getElementById('dropdown');
                          if (dropdown && mutation.attributeName === 'style' && 
                              dropdown.style.display !== 'none') {
                            
                            // Add event listener to the dropdown
                            dropdown.addEventListener('change', () => {
                              // Give a small delay for fields to be populated
                              setTimeout(() => {
                                const address1 = (document.getElementById('address1') as HTMLInputElement)?.value || '';
                                const address2 = (document.getElementById('address2') as HTMLInputElement)?.value || '';
                                const town = (document.getElementById('town') as HTMLInputElement)?.value || '';
                                const county = (document.getElementById('county') as HTMLInputElement)?.value || '';
                                const postcode = (document.getElementById('postcode') as HTMLInputElement)?.value || '';
                                const company = (document.getElementById('company') as HTMLInputElement)?.value || '';
                                
                                const fullAddress = [address1, address2, town, county, postcode]
                                  .filter(Boolean)
                                  .join(', ');
                                
                                setSelectedAddress(fullAddress);
                                
                                const formattedAddress = {
                                  fullAddress,
                                  buildingNumber: company,
                                  street: address1,
                                  town: town,
                                  postcode: postcode
                                };
                                
                                handleQuestionResponse(currentQuestion.id, formattedAddress);
                              }, 500);
                            });
                          }
                        });
                      });
                      
                      const dropdown = document.getElementById('dropdown');
                      if (dropdown) {
                        dropdownObserver.observe(dropdown, { attributes: true });
                      }
                    } else {
                      setPostcodeError('Postcodes4u script not loaded. Please try again.');
                    }
                  }}
                  className="gap-2 bg-black text-white rounded-md px-4 py-2"
                >
                  <Search className="h-4 w-4 inline-block mr-1" />
                  Find
                </button>
              </div>
              
              {postcodeError && (
                <div className="bg-destructive/10 text-destructive text-sm p-2 rounded">
                  {postcodeError}
                </div>
              )}
              
              <select id="dropdown" style={{ display: 'none' }} onChange={() => {}}>
                <option>Select an address:</option>
              </select>
              
              <div style={{ display: 'none' }}>
                <input type="text" id="company" placeholder="Company" />
                <input type="text" id="address1" placeholder="Address Line 1" />
                <input type="text" id="address2" placeholder="Address Line 2" />
                <input type="text" id="town" placeholder="Town" />
                <input type="text" id="county" placeholder="County" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-accent/10 p-3 rounded-md border border-accent/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm">Selected Address:</h4>
                    <p className="text-sm mt-1">
                      {typeof currentAnswer === 'object' ? currentAnswer.fullAddress : currentAnswer}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      resetAddressSearch();
                      // Also reset Postcodes4u fields
                      const fields = ['postcode', 'company', 'address1', 'address2', 'town', 'county'];
                      fields.forEach(field => {
                        const element = document.getElementById(field) as HTMLInputElement;
                        if (element) element.value = '';
                      });
                      
                      // Hide dropdown
                      const dropdown = document.getElementById('dropdown');
                      if (dropdown) dropdown.style.display = 'none';
                    }}
                    className="h-8 px-2 text-xs"
                  >
                    Change
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    } else {
      // Custom API Implementation
      return (
        <div className="max-w-md mx-auto w-full space-y-4">
          {!selectedAddress ? (
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Enter postcode"
                  className="flex-1"
                  onChange={() => {
                    setPostcodeError(null);
                    setAddressResults(null);
                  }}
                  id="postcode-input"
                />
                <Button 
                  onClick={() => {
                    const postcode = (document.getElementById('postcode-input') as HTMLInputElement).value;
                    if (!postcode) {
                      setPostcodeError('Please enter a postcode');
                      return;
                    }
                    lookupPostcodeWithCustomAPI(postcode);
                  }}
                  disabled={loadingPostcode}
                  className="gap-2"
                >
                  {loadingPostcode ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Find
                </Button>
              </div>
              
              {postcodeError && (
                <div className="bg-destructive/10 text-destructive text-sm p-2 rounded">
                  {postcodeError}
                </div>
              )}
              
              {addressResults && addressResults.length > 0 && (
                <div className="border rounded-md divide-y">
                  <div className="px-3 py-2 bg-muted/50 text-sm font-medium">
                    Select an address:
                  </div>
                  {addressResults.map((address, index) => (
                    <div 
                      key={address.Id || index}
                      onClick={() => selectAddress(address)}
                      className="px-3 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm"
                    >
                      {address.Address}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-accent/10 p-3 rounded-md border border-accent/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm">Selected Address:</h4>
                    <p className="text-sm mt-1">{selectedAddress}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetAddressSearch}
                    className="h-8 px-2 text-xs"
                  >
                    Change
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  // Add a function to render contact form
  const renderContactForm = (currentQuestion: Question, currentAnswer: any) => {
    const contactAnswer = currentAnswer || {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      termsAccepted: false
    };

    const handleContactChange = (field: string, value: string | boolean) => {
      const updatedAnswer = {
        ...contactAnswer,
        [field]: value
      };
      handleQuestionResponse(currentQuestion.id, updatedAnswer);
    };

    return (
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={contactAnswer.firstName || ''}
              onChange={(e) => handleContactChange('firstName', e.target.value)}
              placeholder="Enter first name"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={contactAnswer.lastName || ''}
              onChange={(e) => handleContactChange('lastName', e.target.value)}
              placeholder="Enter last name"
              className="w-full"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={contactAnswer.phone || ''}
            onChange={(e) => handleContactChange('phone', e.target.value)}
            placeholder="Enter phone number"
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={contactAnswer.email || ''}
            onChange={(e) => handleContactChange('email', e.target.value)}
            placeholder="Enter email address"
            className="w-full"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="terms" 
            checked={contactAnswer.termsAccepted || false}
            onCheckedChange={(checked) => handleContactChange('termsAccepted', !!checked)}
          />
          <Label 
            htmlFor="terms" 
            className="text-sm font-normal"
          >
            I agree to the{' '}
            <a href="#" className="text-accent underline hover:text-accent/80">
              Terms and Conditions
            </a>{' '}
            and{' '}
            <a href="#" className="text-accent underline hover:text-accent/80">
              Privacy Policy
            </a>
          </Label>
        </div>
      </div>
    );
  };

  // Modify the renderQuestion function to use the renderAddressQuestion function
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
        
        {/* Possible answers - Responsive grid layout */}
        <div className="space-y-3 px-1 sm:px-2">
          {/* Render for single choice questions */}
          {currentQuestion.type === "single_choice" && currentQuestion.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 justify-items-center">
              {currentQuestion.options.map((option) => (
                <div
                  key={option.id}
                  className={cn(
                    "w-full transition-all relative rounded-lg p-4 cursor-pointer hover:scale-105 flex flex-row sm:flex-col items-center sm:items-center justify-start sm:justify-center h-full bg-white",
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

                  <div className="flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-4 sm:gap-0 w-full h-full">
                    {option.icon && isImageUrl(option.icon) && (
                      <div className="w-14 sm:w-full sm:mb-3 flex-shrink-0 flex justify-center">
                        <img 
                          src={option.icon} 
                          alt={option.text} 
                          className="object-contain h-14 sm:h-20 w-auto"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/png?text=Error';
                          }}
                        />
                      </div>
                    )}
                    <span className="text-left sm:text-center font-medium">{option.text}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Render for multiple choice questions */}
          {currentQuestion.type === "multiple_choice" && currentQuestion.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 justify-items-center">
              {currentQuestion.options.map((option) => {
                const isSelected = Array.isArray(currentAnswer) && currentAnswer.includes(option.id);
                
                return (
                  <div
                    key={option.id}
                    className={cn(
                      "w-full relative rounded-lg shadow-sm p-4 cursor-pointer transition-all hover:scale-105 flex flex-row sm:flex-col items-center sm:items-center justify-start sm:justify-center h-full bg-white",
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
                    
                    <div className="flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-4 sm:gap-0 w-full h-full">
                      {option.icon && isImageUrl(option.icon) && (
                        <div className="w-14 sm:w-full sm:mb-3 flex-shrink-0 flex justify-center">
                          <img 
                            src={option.icon} 
                            alt={option.text} 
                            className="object-contain h-14 sm:h-20 w-auto"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/png?text=Error';
                            }}
                          />
                        </div>
                      )}
                      <span className="text-left sm:text-center font-medium">{option.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
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

          {/* Render for address questions */}
          {currentQuestion.type === "address" && renderAddressQuestion(currentQuestion, currentAnswer)}
          
          {/* Render for contact form questions */}
          {currentQuestion.type === "contact_form" && renderContactForm(currentQuestion, currentAnswer)}

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
            className={cn(
              "rounded-lg gap-1",
              "hover:bg-accent hover:text-accent-foreground transition-colors"
            )}
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