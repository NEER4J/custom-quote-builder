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
    <div class="quote-form-card">
      <!-- Progress bar -->
      <div class="progress-bar">
        <div class="progress-bar-fill" id="progress-bar"></div>
      </div>
      
      <div class="form-content" id="form-content">
        <div id="questions-container">
          ${formState.questions.map((question, index) => `
          <div class="question" id="question-${question.id}" ${index > 0 ? 'style="display: none;"' : ''}>
            <div class="question-header">
              <h2 class="question-text">${question.text}${question.required ? '<span class="required">*</span>' : ''}</h2>
              ${question.description ? `<p class="question-description">${question.description}</p>` : ''}
            </div>
            
            ${question.type === 'text_input' 
              ? `<div class="text-input-container">
                  <input type="text" class="text-input" id="input-${question.id}" placeholder="Type your answer here..." ${question.required ? 'required' : ''} />
                </div>`
              : question.type === 'single_choice'
                ? `<div class="options-container">
                    <div class="desktop-options">
                      ${question.options?.map(option => `
                        <div class="option single-option" data-option-id="${option.id}" data-question-id="${question.id}">
                          ${option.description ? `
                          <div class="info-button" data-option-id="${option.id}">
                            <span class="info-icon">i</span>
                            <div class="info-tooltip" id="tooltip-${option.id}">${option.description}</div>
                          </div>` : ''}
                          <div class="option-content">
                            ${option.icon ? `<div class="option-icon"><img src="${option.icon}" alt="${option.text}" class="option-image"></div>` : ''}
                            <span class="option-text">${option.text}</span>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                    <div class="mobile-options">
                      ${question.options?.map(option => `
                        <div class="mobile-option" data-option-id="${option.id}" data-question-id="${question.id}">
                          ${option.description ? `
                          <div class="info-button" data-option-id="${option.id}">
                            <span class="info-icon">i</span>
                            <div class="info-tooltip" id="tooltip-${option.id}">${option.description}</div>
                          </div>` : ''}
                          <div class="option-content">
                            ${option.icon ? `<div class="option-icon"><img src="${option.icon}" alt="${option.text}" class="option-image"></div>` : ''}
                            <span class="option-text">${option.text}</span>
                          </div>
                          <div class="check-indicator"></div>
                        </div>
                      `).join('')}
                    </div>
                  </div>`
                : `<div class="options-container">
                    <div class="desktop-options">
                      ${question.options?.map(option => `
                        <div class="option multiple-option" data-option-id="${option.id}" data-question-id="${question.id}">
                          ${option.description ? `
                          <div class="info-button" data-option-id="${option.id}">
                            <span class="info-icon">i</span>
                            <div class="info-tooltip" id="tooltip-${option.id}">${option.description}</div>
                          </div>` : ''}
                          <div class="checkbox"><div class="checkbox-inner"></div></div>
                          <div class="option-content">
                            ${option.icon ? `<div class="option-icon"><img src="${option.icon}" alt="${option.text}" class="option-image"></div>` : ''}
                            <span class="option-text">${option.text}</span>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                    <div class="mobile-options">
                      ${question.options?.map(option => `
                        <div class="mobile-option" data-option-id="${option.id}" data-question-id="${question.id}">
                          ${option.description ? `
                          <div class="info-button" data-option-id="${option.id}">
                            <span class="info-icon">i</span>
                            <div class="info-tooltip" id="tooltip-${option.id}">${option.description}</div>
                          </div>` : ''}
                          <div class="option-content">
                            ${option.icon ? `<div class="option-icon"><img src="${option.icon}" alt="${option.text}" class="option-image"></div>` : ''}
                            <span class="option-text">${option.text}</span>
                          </div>
                          <div class="checkbox"><div class="checkbox-inner"></div></div>
                        </div>
                      `).join('')}
                    </div>
                  </div>`
            }
            <div class="next-button-container">
              <button class="next-button" id="next-button-${question.id}" style="background-color: ${formState.settings.buttonColor}">
                Next <span class="next-icon">→</span>
              </button>
            </div>
          </div>`).join('')}
          
          <div class="question" id="thank-you-screen" style="display: none;">
            <div class="thank-you-content">
              <div class="thank-you-icon">✓</div>
              <h2>Thank you for your response!</h2>
              <p>Your answers have been recorded. We appreciate your time.</p>
              <button class="start-over-button" id="start-over-button" style="background-color: ${formState.settings.buttonColor}">
                <span class="refresh-icon">↻</span> Start Over
              </button>
            </div>
          </div>
        </div>
        
        <div class="form-navigation" id="form-navigation">
          <button class="back-button" id="back-button" disabled>
            <span class="back-icon">←</span> Back
          </button>
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
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.quote-form-container {
  width: 100%;
  margin: 0 auto;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.quote-form-card {
  background-color: #f3f4f6;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background-color: #e9ecef;
}

.progress-bar-fill {
  height: 100%;
  background-color: ${formState.settings.buttonColor};
  width: 0;
  transition: width 0.5s ease-out;
}

.form-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
}

#questions-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.question {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.question-header {
  margin-bottom: 2rem;
  text-align: center;
}

.question-text {
  font-size: 2rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.question-description {
  color: #6c757d;
}

.required {
  color: #e53e3e;
  margin-left: 3px;
}

.text-input-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.text-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 1rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.text-input:focus {
  outline: none;
  border-color: ${formState.settings.buttonColor};
  box-shadow: 0 0 0 2px rgba(${hexToRgb(formState.settings.buttonColor)}, 0.25);
}

.options-container {
  width: 100%;
  padding: 0 0.5rem;
}

.desktop-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

@media (min-width: 768px) {
  .desktop-options {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .desktop-options {
    grid-template-columns: repeat(4, 1fr);
  }
}

.mobile-options {
  display: none;
  flex-direction: column;
  gap: 0.5rem;
}

.option {
  position: relative;
  padding: 1rem;
  background-color: white;
  border-radius: 0.375rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  height: 100%;
  text-align: center;
}

.option:hover {
  transform: scale(1.05);
}

.option.selected {
  border: 2px solid ${formState.settings.buttonColor};
}

.option:not(.selected) {
  border: 1px solid transparent;
}

.option-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.option-icon {
  margin-bottom: 0.75rem;
  width: 100%;
  display: flex;
  justify-content: center;
}

.option-image {
  height: 5rem;
  width: auto;
  object-fit: contain;
}

.option-text {
  text-align: center;
  font-weight: 500;
}

.info-button {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 10;
}

.info-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background-color: #e2e8f0;
  color: #64748b;
  font-size: 0.75rem;
  font-style: italic;
  cursor: pointer;
}

.info-tooltip {
  display: none;
  position: absolute;
  left: 0;
  width: max-content;
  top: 100%;
  margin-top: 0.5rem;
  padding: 0.5rem;
  max-width: 200px;
  background-color: #f2f3f3;
  border-radius: 0.25rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 20;
  font-size: 0.75rem;
  color: #4b5563;
}

.info-button:hover .info-tooltip {
  display: block;
}

.checkbox {
  position: absolute;
  top: 0.8rem;
  right: 0.8rem;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #cbd5e0;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox-inner {
  display: none;
  width: 0.625rem;
  height: 0.625rem;
}

.multiple-option.selected .checkbox-inner {
  display: block;
}

.multiple-option.selected .checkbox::after {
  content: "✓";
  position: absolute;
  color: ${formState.settings.buttonColor};
  font-size: 0.75rem;
}

.mobile-option {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  cursor: pointer;
  position: relative;
}

.mobile-option.selected {
  border: 2px solid ${formState.settings.buttonColor};
}

.mobile-option .option-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: start;
  gap: 0.75rem;
  width: 100%;
}

.mobile-option .option-icon {
  margin-bottom: 0;
  width: 4rem;
  flex-shrink: 0;
  margin-right: 0;
}

.mobile-option .option-image {
  height: 3.5rem;
}

.mobile-option .option-text {
  text-align: center;
}

.check-indicator {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 1.25rem;
  height: 1.25rem;
}

.mobile-option.selected .check-indicator::after {
  content: "✓";
  color: ${formState.settings.buttonColor};
  position: absolute;
  font-size: 1rem;
}

.next-button-container {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  width: 100%;
}

.form-navigation {
  display: flex;
  justify-content: flex-start;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
  margin-top: 1.5rem;
}

.back-button, .next-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.back-button {
  background-color: transparent;
  color: #6b7280;
  border: none;
}

.back-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.next-button {
  background-color: ${formState.settings.buttonColor} !important;
  color: white;
  border: none;
}

.next-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.thank-you-content {
  text-align: center;
  padding: 2rem 0;
}

.thank-you-icon {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background-color: rgba(${hexToRgb(formState.settings.buttonColor)}, 0.2);
  color: ${formState.settings.buttonColor};
  font-size: 2rem;
  margin-bottom: 1.5rem;
}

.thank-you-content h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.thank-you-content p {
  color: #6c757d;
  max-width: 24rem;
  margin: 0 auto 1.5rem;
}

.start-over-button {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  background-color: ${formState.settings.buttonColor};
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.refresh-icon {
  font-size: 1rem;
}

@media (max-width: 640px) {
  .desktop-options {
    display: none;
  }
  
  .mobile-options {
    display: flex;
  }
  
  .question-text {
    font-size: 1.25rem;
  }
  
  .form-content {
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
          conditions: q.conditions,
          conditionLogic: q.conditionLogic || "AND"
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
  const progressBar = document.getElementById('progress-bar');
  const startOverButton = document.getElementById('start-over-button');
  const formNavigation = document.getElementById('form-navigation');
  
  // Track visible questions
  let activeQuestionIds = [];
  
  // Initialize form
  initForm();
  
  function initForm() {
    // Set up single choice option click handlers
    document.querySelectorAll('.single-option').forEach(option => {
      option.addEventListener('click', function() {
        const questionId = this.dataset.questionId;
        const optionId = this.dataset.optionId;
        
        // Set answer
        state.answers[questionId] = optionId;
        
        // Update UI
        updateOptionSelection(questionId, optionId, true);
        
        // Recalculate visible questions based on new answer
        calcVisibleQuestions();
        
        // Auto advance to next question
        setTimeout(() => {
          goToNextQuestion();
        }, 300);
      });
    });
    
    // Set up multiple choice option click handlers
    document.querySelectorAll('.multiple-option').forEach(option => {
      option.addEventListener('click', function() {
        const questionId = this.dataset.questionId;
        const optionId = this.dataset.optionId;
        
        // Initialize answer array if needed
        if (!state.answers[questionId]) {
          state.answers[questionId] = [];
        }
        
        const answers = state.answers[questionId];
        const index = answers.indexOf(optionId);
        
        // Toggle selection
        if (index === -1) {
          answers.push(optionId);
        } else {
          answers.splice(index, 1);
        }
        
        // Update UI
        updateMultipleChoiceSelection(questionId);
        
        // Recalculate visible questions based on new answer
        calcVisibleQuestions();
        
        // Update next button state
        updateNextButtonState();
      });
    });
    
    // Set up mobile option click handlers
    document.querySelectorAll('.mobile-option').forEach(option => {
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
          updateMultipleChoiceSelection(questionId);
          
          // Recalculate visible questions based on new answer
          calcVisibleQuestions();
          
          // Update next button state
          updateNextButtonState();
        } else {
          // For single choice
          state.answers[questionId] = optionId;
          
          // Update UI
          updateOptionSelection(questionId, optionId, true);
          
          // Recalculate visible questions based on new answer
          calcVisibleQuestions();
          
          // Auto advance to next question
          setTimeout(() => {
            goToNextQuestion();
          }, 300);
        }
      });
    });
    
    // Set up next buttons for each question
    state.questions.forEach(question => {
      const nextButton = document.getElementById(\`next-button-\${question.id}\`);
      if (nextButton) {
        nextButton.addEventListener('click', goToNextQuestion);
      }
    });
    
    // Set up info buttons to show tooltips on mobile
    document.querySelectorAll('.info-icon').forEach(infoBtn => {
      infoBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const optionId = this.parentElement.dataset.optionId;
        const tooltip = document.getElementById(\`tooltip-\${optionId}\`);
        
        // Toggle tooltip visibility
        if (tooltip.style.display === 'block') {
          tooltip.style.display = 'none';
        } else {
          // Hide all other tooltips first
          document.querySelectorAll('.info-tooltip').forEach(t => {
            t.style.display = 'none';
          });
          
          tooltip.style.display = 'block';
        }
      });
    });
    
    // Close tooltips when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.info-button')) {
        document.querySelectorAll('.info-tooltip').forEach(tooltip => {
          tooltip.style.display = 'none';
        });
      }
    });
    
    // Set up text input handlers
    document.querySelectorAll('.text-input').forEach(input => {
      input.addEventListener('input', function() {
        const questionId = this.id.replace('input-', '');
        state.answers[questionId] = this.value;
        
        // Recalculate visible questions whenever text input changes
        calcVisibleQuestions();
        
        updateNextButtonState();
      });
    });
    
    // Set up back button
    backButton.addEventListener('click', goToPreviousQuestion);
    startOverButton.addEventListener('click', resetForm);
    
    // Calculate initially visible questions
    calcVisibleQuestions();
    
    // Show first question
    updateView();
  }
  
  function calcVisibleQuestions() {
    activeQuestionIds = state.questions
      .filter(isQuestionVisible)
      .map(q => q.id);
    
    // If current question is no longer visible, move to first visible question
    if (!activeQuestionIds.includes(state.questions[state.currentQuestionIndex]?.id)) {
      const firstVisibleIndex = state.questions.findIndex(q => activeQuestionIds.includes(q.id));
      if (firstVisibleIndex !== -1) {
        state.currentQuestionIndex = firstVisibleIndex;
      }
    }
  }
  
  function updateOptionSelection(questionId, selectedOptionId, isSingleChoice) {
    // Update desktop options
    const options = document.querySelectorAll(\`.option[data-question-id="\${questionId}"]\`);
    options.forEach(opt => {
      if (opt.dataset.optionId === selectedOptionId) {
        opt.classList.add('selected');
      } else if (isSingleChoice) {
        opt.classList.remove('selected');
      }
    });
    
    // Update mobile options
    const mobileOptions = document.querySelectorAll(\`.mobile-option[data-question-id="\${questionId}"]\`);
    mobileOptions.forEach(opt => {
      if (opt.dataset.optionId === selectedOptionId) {
        opt.classList.add('selected');
      } else if (isSingleChoice) {
        opt.classList.remove('selected');
      }
    });
  }
  
  function updateMultipleChoiceSelection(questionId) {
    const selectedOptions = state.answers[questionId] || [];
    
    // Update desktop options
    document.querySelectorAll(\`.multiple-option[data-question-id="\${questionId}"]\`).forEach(opt => {
      if (selectedOptions.includes(opt.dataset.optionId)) {
        opt.classList.add('selected');
      } else {
        opt.classList.remove('selected');
      }
    });
    
    // Update mobile options
    document.querySelectorAll(\`.mobile-option[data-question-id="\${questionId}"]\`).forEach(opt => {
      if (selectedOptions.includes(opt.dataset.optionId)) {
        opt.classList.add('selected');
      } else {
        opt.classList.remove('selected');
      }
    });
  }
  
  function updateView() {
    // Hide all questions
    document.querySelectorAll('.question').forEach(q => {
      q.style.display = 'none';
    });
    
    if (state.currentQuestionIndex === null) {
      document.getElementById('thank-you-screen').style.display = 'block';
      formNavigation.style.display = 'none';
      return;
    }
    
    // Show current question
    const currentQuestionId = state.questions[state.currentQuestionIndex].id;
    const currentQuestion = state.questions[state.currentQuestionIndex];
    document.getElementById(\`question-\${currentQuestionId}\`).style.display = 'flex';
    
    // Update navigation buttons
    backButton.disabled = state.currentQuestionIndex === 0;
    
    // Update next buttons text and visibility
    state.questions.forEach(question => {
      const nextBtn = document.getElementById(\`next-button-\${question.id}\`);
      if (nextBtn) {
        // Show submit text on the last question
        const isLastQuestion = activeQuestionIds.indexOf(question.id) === activeQuestionIds.length - 1;
        if (isLastQuestion) {
          nextBtn.innerHTML = 'Submit <span class="next-icon">→</span>';
        } else {
          nextBtn.innerHTML = 'Next <span class="next-icon">→</span>';
        }
      }
    });
    
    // Update progress bar
    updateProgressBar();
    
    // Update next button state
    updateNextButtonState();
  }
  
  function updateProgressBar() {
    if (activeQuestionIds.length === 0) return;
    
    const currentQuestionId = state.questions[state.currentQuestionIndex].id;
    const progress = ((activeQuestionIds.indexOf(currentQuestionId) + 1) / activeQuestionIds.length) * 100;
    progressBar.style.width = \`\${progress}%\`;
  }
  
  function updateNextButtonState() {
    if (state.currentQuestionIndex === null) return;
    
    const currentQuestion = state.questions[state.currentQuestionIndex];
    const nextButton = document.getElementById(\`next-button-\${currentQuestion.id}\`);
    
    if (!nextButton) return;
    
    // Disable next button if required question is not answered
    if (currentQuestion.required) {
      nextButton.disabled = !isAnswered(currentQuestion.id);
    } else {
      nextButton.disabled = false;
    }
    
    // For single choice questions, hide the next button (since they auto-advance)
    // Exception: show it if it's the last question
    if (currentQuestion.type === 'single_choice') {
      const isLastQuestion = activeQuestionIds.indexOf(currentQuestion.id) === activeQuestionIds.length - 1;
      nextButton.style.display = isLastQuestion ? 'flex' : 'none';
    } else {
      nextButton.style.display = 'flex';
    }
  }
  
  function isAnswered(questionId) {
    const answer = state.answers[questionId];
    if (answer === undefined) return false;
    if (Array.isArray(answer)) return answer.length > 0;
    if (typeof answer === 'string') return answer.trim() !== '';
    return answer !== '';
  }
  
  function goToNextQuestion() {
    // Check if we're at the last visible question
    const currentQuestionId = state.questions[state.currentQuestionIndex].id;
    const currentActiveIndex = activeQuestionIds.indexOf(currentQuestionId);
    
    if (currentActiveIndex < activeQuestionIds.length - 1) {
      // Move to next visible question
      const nextQuestionId = activeQuestionIds[currentActiveIndex + 1];
      const nextIndex = state.questions.findIndex(q => q.id === nextQuestionId);
      if (nextIndex !== -1) {
        state.currentQuestionIndex = nextIndex;
        updateView();
      }
    } else {
      // This is the last question, submit the form
      submitForm();
    }
  }
  
  function goToPreviousQuestion() {
    const currentQuestionId = state.questions[state.currentQuestionIndex].id;
    const currentActiveIndex = activeQuestionIds.indexOf(currentQuestionId);
    
    if (currentActiveIndex > 0) {
      // Move to previous visible question
      const prevQuestionId = activeQuestionIds[currentActiveIndex - 1];
      const prevIndex = state.questions.findIndex(q => q.id === prevQuestionId);
      if (prevIndex !== -1) {
        state.currentQuestionIndex = prevIndex;
        updateView();
      }
    }
  }
  
  function isQuestionVisible(question) {
    // Find condition rules for this question
    const conditionData = state.conditions.find(c => c.questionId === question.id);
    
    // If no conditions, question is visible
    if (!conditionData || !conditionData.conditions || conditionData.conditions.length === 0) {
      return true;
    }
    
    // Determine overall logic (AND/OR) between conditions
    const logic = conditionData.conditionLogic || "AND"; // Default to AND if not specified
    
    const results = conditionData.conditions.map(condition => {
      const sourceQuestion = state.questions.find(q => q.id === condition.questionId);
      const answer = state.answers[condition.questionId];
      
      if (answer === undefined || !sourceQuestion) {
        return false; // Cannot evaluate if answer or source question is missing
      }
      
      // Handle condition based on the source question type
      if (sourceQuestion.type === "multiple_choice" || sourceQuestion.type === "single_choice") {
        const answerArray = Array.isArray(answer) ? answer : [answer]; // Ensure answer is an array
        
        // Check if any selected answer matches any of the condition values
        return condition.values.some(val => answerArray.includes(val));
      } else if (sourceQuestion.type === "text_input") {
        // Simple equality check for text input
        return condition.values[0] === answer;
      }
      
      return false; // Default to false if type is unknown
    });
    
    // Apply AND/OR logic
    return logic === "AND" ? results.every(Boolean) : results.some(Boolean);
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
    
    // Reset selections
    document.querySelectorAll('.option, .mobile-option').forEach(opt => {
      opt.classList.remove('selected');
    });
    
    // Reset text inputs
    document.querySelectorAll('.text-input').forEach(input => {
      input.value = '';
    });
    
    // Recalculate visible questions
    calcVisibleQuestions();
    
    // Show navigation again
    formNavigation.style.display = 'flex';
    
    // Update view
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