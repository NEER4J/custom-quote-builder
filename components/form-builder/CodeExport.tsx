"use client";

import { useState } from "react";
import { FormState } from "./FormDesigner";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DownloadIcon, 
  ClipboardCopyIcon, 
  CheckIcon 
} from "lucide-react";
import JSZip from "jszip";

type CodeExportProps = {
  formState: FormState;
};

const CodeExport = ({ formState }: CodeExportProps) => {
  const [activeTab, setActiveTab] = useState<"single" | "separate">("single");
  const [copied, setCopied] = useState<boolean>(false);

  // Generate HTML code for the form
  const generateHTML = (): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${formState.title}</title>
  ${activeTab === "single" 
    ? `<style>
${generateCSS()}
    </style>` 
    : '<link rel="stylesheet" href="form-styles.css">'
  }
</head>
<body style="background-color: ${formState.settings.backgroundColor}">
  <div class="quote-form-container">
    <!-- Progress bar -->
    <div class="progress-bar-container">
      <div class="progress-bar" id="progress-bar"></div>
    </div>
    
    <div class="quote-form-card">
      <div class="form-header">
        <h1 class="form-title">${formState.title}</h1>
        <p class="form-description">${formState.description}</p>
      </div>
      
      <div class="form-content">
        <div id="questions-container">
          ${formState.questions.map((question, index) => `
          <div class="question" id="question-${question.id}" ${index > 0 ? 'style="display: none;"' : ''}>
            <h3 class="question-text">${question.text}</h3>
            
            ${question.type === 'text_input' 
              ? `<input type="text" class="text-input" id="input-${question.id}" placeholder="Your answer" ${question.required ? 'required' : ''} />`
              : `<div class="options-container">
                ${question.options?.map(option => `
                  <div class="option" data-option-id="${option.id}" data-question-id="${question.id}">
                    ${option.icon ? `<span class="option-icon">${option.icon}</span>` : ''}
                    <span class="option-text">${option.text}</span>
                  </div>
                `).join('')}
                </div>`
            }
          </div>`).join('')}
          
          <div class="question" id="thank-you-screen" style="display: none;">
            <div class="thank-you-content">
              <h2>Thank you for your responses!</h2>
              <p>Your form has been submitted successfully.</p>
              <button class="form-button" id="start-over-button" style="background-color: ${formState.settings.buttonColor}">Start Over</button>
            </div>
          </div>
        </div>
        
        <div class="form-navigation">
          <button class="back-button" id="back-button" disabled>Back</button>
          <button class="form-button" id="next-button" style="background-color: ${formState.settings.buttonColor}">Next</button>
        </div>
      </div>
    </div>
  </div>

  ${activeTab === "single" 
    ? `<script>
${generateJS()}
    </script>` 
    : '<script src="form-script.js"></script>'
  }
</body>
</html>`;
  };

  // Generate CSS code
  const generateCSS = (): string => {
    return `/* Quote Form Styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.5;
  color: #333;
}

.quote-form-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: ${formState.settings.buttonColor};
  width: 0;
  transition: width 0.3s ease;
}

.quote-form-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.form-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.form-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.form-description {
  color: #6c757d;
  font-size: 0.875rem;
}

.form-content {
  padding: 1.5rem;
}

.question {
  margin-bottom: 2rem;
}

.question-text {
  font-size: 1.25rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option {
  padding: 1rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s ease;
}

.option:hover {
  background-color: #f8f9fa;
}

.option.selected {
  background-color: #e9ecef;
  border-color: ${formState.settings.buttonColor};
}

.option-icon {
  font-size: 1.25rem;
  color: ${formState.settings.buttonColor};
}

.text-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.text-input:focus {
  outline: none;
  border-color: ${formState.settings.buttonColor};
  box-shadow: 0 0 0 2px rgba(${hexToRgb(formState.settings.buttonColor)}, 0.25);
}

.form-navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
}

.back-button {
  padding: 0.5rem 1rem;
  background-color: transparent;
  border: 1px solid #ced4da;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.back-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-button {
  padding: 0.5rem 1.5rem;
  background-color: ${formState.settings.buttonColor};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
}

.form-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.thank-you-content {
  text-align: center;
  padding: 2rem 0;
}

.thank-you-content h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.thank-you-content p {
  color: #6c757d;
  margin-bottom: 1.5rem;
}

/* Responsive styles */
@media (max-width: 600px) {
  .quote-form-container {
    margin: 1rem auto;
  }
  
  .form-header, .form-content {
    padding: 1rem;
  }
}`;
  };

  // Generate JavaScript code
  const generateJS = (): string => {
    const conditionsJSON = JSON.stringify(
      formState.questions
        .filter(q => q.conditions && q.conditions.length > 0)
        .map(q => ({
          questionId: q.id,
          conditions: q.conditions
        }))
    );
    
    return `// Quote Form Script
document.addEventListener('DOMContentLoaded', function() {
  // Form state
  const state = {
    currentQuestionIndex: 0,
    answers: {},
    questions: ${JSON.stringify(formState.questions)},
    conditions: ${conditionsJSON},
    submitUrl: "${formState.settings.submitUrl}",
    zapierWebhookUrl: "${formState.settings.zapierWebhookUrl}"
  };

  // DOM elements
  const questionsContainer = document.getElementById('questions-container');
  const backButton = document.getElementById('back-button');
  const nextButton = document.getElementById('next-button');
  const progressBar = document.getElementById('progress-bar');
  const startOverButton = document.getElementById('start-over-button');
  
  // Initialize form
  initForm();
  
  function initForm() {
    // Set up option click handlers
    const options = document.querySelectorAll('.option');
    options.forEach(option => {
      option.addEventListener('click', function() {
        const questionId = this.dataset.questionId;
        const optionId = this.dataset.optionId;
        const question = state.questions.find(q => q.id === questionId);
        
        if (question.type === 'multiple_choice') {
          // For multiple choice, toggle selection
          if (!state.answers[questionId]) {
            state.answers[questionId] = [];
          }
          
          const answers = state.answers[questionId];
          const index = answers.indexOf(optionId);
          
          if (index === -1) {
            answers.push(optionId);
          } else {
            answers.splice(index, 1);
          }
          
          // Update UI
          const options = document.querySelectorAll(\`[data-question-id="\${questionId}"]\`);
          options.forEach(opt => {
            if (answers.includes(opt.dataset.optionId)) {
              opt.classList.add('selected');
            } else {
              opt.classList.remove('selected');
            }
          });
        } else {
          // For single choice, set selection
          state.answers[questionId] = optionId;
          
          // Update UI
          const options = document.querySelectorAll(\`[data-question-id="\${questionId}"]\`);
          options.forEach(opt => {
            if (opt.dataset.optionId === optionId) {
              opt.classList.add('selected');
            } else {
              opt.classList.remove('selected');
            }
          });
        }
        
        updateNextButtonState();
      });
    });
    
    // Set up text input handlers
    const textInputs = document.querySelectorAll('.text-input');
    textInputs.forEach(input => {
      input.addEventListener('input', function() {
        const questionId = this.id.replace('input-', '');
        state.answers[questionId] = this.value;
        updateNextButtonState();
      });
    });
    
    // Set up navigation button handlers
    backButton.addEventListener('click', goToPreviousQuestion);
    nextButton.addEventListener('click', goToNextQuestion);
    startOverButton.addEventListener('click', resetForm);
    
    // Show first question
    updateView();
  }
  
  function updateView() {
    // Hide all questions
    const allQuestions = document.querySelectorAll('.question');
    allQuestions.forEach(q => q.style.display = 'none');
    
    if (state.currentQuestionIndex === null) {
      document.getElementById('thank-you-screen').style.display = 'block';
      return;
    }
    
    // Show current question
    const currentQuestionId = state.questions[state.currentQuestionIndex].id;
    document.getElementById(\`question-\${currentQuestionId}\`).style.display = 'block';
    
    // Update navigation buttons
    backButton.disabled = state.currentQuestionIndex === 0;
    nextButton.textContent = isLastVisibleQuestion() ? 'Submit' : 'Next';
    
    // Update progress bar
    updateProgressBar();
    
    // Update next button state
    updateNextButtonState();
  }
  
  function updateProgressBar() {
    const totalVisible = countVisibleQuestions();
    if (totalVisible === 0) return;
    
    let visibleCount = 0;
    for (let i = 0; i <= state.currentQuestionIndex; i++) {
      if (isQuestionVisible(state.questions[i])) {
        visibleCount++;
      }
    }
    
    const progress = (visibleCount / totalVisible) * 100;
    progressBar.style.width = \`\${progress}%\`;
  }
  
  function updateNextButtonState() {
    if (state.currentQuestionIndex === null) {
      nextButton.disabled = true;
      return;
    }
    
    const currentQuestion = state.questions[state.currentQuestionIndex];
    const answer = state.answers[currentQuestion.id];
    
    // Disable next button if required question is not answered
    nextButton.disabled = currentQuestion.required && !isAnswered(currentQuestion.id);
  }
  
  function isAnswered(questionId) {
    const answer = state.answers[questionId];
    if (answer === undefined) return false;
    if (Array.isArray(answer)) return answer.length > 0;
    return answer !== '';
  }
  
  function goToNextQuestion() {
    if (isLastVisibleQuestion()) {
      submitForm();
      return;
    }
    
    let nextIndex = state.currentQuestionIndex + 1;
    while (nextIndex < state.questions.length) {
      if (isQuestionVisible(state.questions[nextIndex])) {
        state.currentQuestionIndex = nextIndex;
        updateView();
        return;
      }
      nextIndex++;
    }
    
    // If no more visible questions, show thank you screen
    submitForm();
  }
  
  function goToPreviousQuestion() {
    if (state.currentQuestionIndex <= 0) return;
    
    let prevIndex = state.currentQuestionIndex - 1;
    while (prevIndex >= 0) {
      if (isQuestionVisible(state.questions[prevIndex])) {
        state.currentQuestionIndex = prevIndex;
        updateView();
        return;
      }
      prevIndex--;
    }
  }
  
  function isLastVisibleQuestion() {
    let nextIndex = state.currentQuestionIndex + 1;
    while (nextIndex < state.questions.length) {
      if (isQuestionVisible(state.questions[nextIndex])) {
        return false;
      }
      nextIndex++;
    }
    return true;
  }
  
  function countVisibleQuestions() {
    return state.questions.filter(q => isQuestionVisible(q)).length;
  }
  
  function isQuestionVisible(question) {
    // Find condition rules for this question
    const conditionData = state.conditions.find(c => c.questionId === question.id);
    
    // If no conditions, question is visible
    if (!conditionData || !conditionData.conditions || conditionData.conditions.length === 0) {
      return true;
    }
    
    // Check each condition
    return conditionData.conditions.every(condition => {
      const answer = state.answers[condition.questionId];
      
      if (answer === undefined) {
        return false;
      }
      
      if (Array.isArray(answer)) {
        const hasValue = answer.includes(condition.value);
        return condition.operator === 'equals' ? hasValue : !hasValue;
      } else {
        const matches = answer === condition.value;
        return condition.operator === 'equals' ? matches : !matches;
      }
    });
  }
  
  function submitForm() {
    // Show thank you screen
    state.currentQuestionIndex = null;
    updateView();
    
    // Submit data to Zapier if webhook URL provided
    if (state.zapierWebhookUrl) {
      // Transform answers to include question text and answer text instead of just IDs
      const transformedAnswers = {};
      
      Object.keys(state.answers).forEach(questionId => {
        const question = state.questions.find(q => q.id === questionId);
        if (!question) return;
        
        const questionKey = question.text;
        
        if (question.type === 'text_input') {
          // For text inputs, just use the value directly
          transformedAnswers[questionKey] = state.answers[questionId];
        } else if (question.type === 'multiple_choice') {
          // For multiple choice, map the array of IDs to array of text values
          const answerIds = state.answers[questionId];
          if (Array.isArray(answerIds)) {
            const answerTexts = answerIds.map(id => {
              const option = question.options?.find(opt => opt.id === id);
              return option ? option.text : id;
            });
            transformedAnswers[questionKey] = answerTexts.join(', ');
          }
        } else if (question.type === 'single_choice') {
          // For single choice, map the ID to the text value
          const answerId = state.answers[questionId];
          const option = question.options?.find(opt => opt.id === answerId);
          transformedAnswers[questionKey] = option ? option.text : answerId;
        }
      });
      
      fetch(state.zapierWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transformedAnswers),
        mode: 'no-cors'
      }).catch(err => console.error('Error submitting form:', err));
    }
    
    // Redirect if URL provided
    if (state.submitUrl) {
      setTimeout(() => {
        window.location.href = state.submitUrl;
      }, 2000);
    }
  }
  
  function resetForm() {
    state.currentQuestionIndex = 0;
    state.answers = {};
    
    // Reset options selection UI
    document.querySelectorAll('.option').forEach(opt => {
      opt.classList.remove('selected');
    });
    
    // Reset text inputs
    document.querySelectorAll('.text-input').forEach(input => {
      input.value = '';
    });
    
    updateView();
  }
});`;
  };

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string): string => {
    // Remove the hash if present
    hex = hex.replace('#', '');

    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `${r}, ${g}, ${b}`;
  };

  // Copy code to clipboard
  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Download file
  const downloadFile = (content: string, filename: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Handle different downloads based on file type
  const handleDownload = (type: 'html' | 'css' | 'js' | 'all') => {
    switch (type) {
      case 'html':
        downloadFile(generateHTML(), 'quote-form.html');
        break;
      case 'css':
        downloadFile(generateCSS(), 'form-styles.css');
        break;
      case 'js':
        downloadFile(generateJS(), 'form-script.js');
        break;
      case 'all':
        const zip = new JSZip();
        zip.file('quote-form.html', generateHTML());
        zip.file('form-styles.css', generateCSS());
        zip.file('form-script.js', generateJS());
        zip.generateAsync({ type: 'blob' }).then((blob: Blob) => {
          const element = document.createElement('a');
          element.href = URL.createObjectURL(blob);
          element.download = 'quote-form.zip';
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
        });
        break;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Export Form Code</CardTitle>
          <CardDescription>
            Get the code for your form to embed on your website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="single" 
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "single" | "separate")}
            className="w-full"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="single">Single File</TabsTrigger>
              <TabsTrigger value="separate">Separate Files</TabsTrigger>
            </TabsList>
            
            <TabsContent value="single" className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={() => copyToClipboard(generateHTML())}
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <ClipboardCopyIcon className="w-4 h-4" />
                      Copy Code
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => downloadFile(generateHTML(), 'quote-form.html')}
                  className="flex items-center gap-2"
                >
                  <DownloadIcon className="w-4 h-4" />
                  Download HTML
                </Button>
              </div>
              
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-96">
                  <code>{generateHTML()}</code>
                </pre>
              </div>
            </TabsContent>
            
            <TabsContent value="separate" className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => downloadFile(generateHTML(), 'quote-form.html')}
                  className="flex items-center gap-2"
                >
                  <DownloadIcon className="w-4 h-4" />
                  Download HTML
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => downloadFile(generateCSS(), 'form-styles.css')}
                  className="flex items-center gap-2"
                >
                  <DownloadIcon className="w-4 h-4" />
                  Download CSS
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => downloadFile(generateJS(), 'form-script.js')}
                  className="flex items-center gap-2"
                >
                  <DownloadIcon className="w-4 h-4" />
                  Download JS
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => handleDownload('all')}
                  className="flex items-center gap-2"
                >
                  <DownloadIcon className="w-4 h-4" />
                  Download All Files
                </Button>
              </div>
              
              <div className="grid gap-4">
                <div>
                  <h3 className="font-medium mb-2">HTML (quote-form.html)</h3>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-60 text-wrap">
                    <code>{generateHTML()}</code>
                  </pre>
                </div>
                <div>
                  <h3 className="font-medium mb-2">CSS (form-styles.css)</h3>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-60 text-wrap">
                    <code>{generateCSS()}</code>
                  </pre>
                </div>
                <div>
                  <h3 className="font-medium mb-2">JavaScript (form-script.js)</h3>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-60 text-wrap">
                    <code>{generateJS()}</code>
                  </pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="text-sm text-muted-foreground">
        <p>
          The generated code includes a responsive, mobile-friendly form with conditional logic and form validation.
          Simply copy or download the code and add it to your website.
        </p>
      </div>
    </div>
  );
};

export default CodeExport; 