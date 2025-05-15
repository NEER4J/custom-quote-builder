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

  // Transform form state to use human-readable IDs instead of UUIDs
  const transformFormState = (): FormState => {
    const idMap = new Map<string, string>(); // Maps old IDs to new IDs
    const questionIdToIndex = new Map<string, number>(); // Maps original question IDs to their index

    // Create a deep copy of the form state
    const newState = JSON.parse(JSON.stringify(formState)) as FormState;
    
    // Make sure success pages are included in the transformed state
    if (formState.settings.successPages) {
      console.log(`Including ${formState.settings.successPages.length} success pages in exported form`);
      
      // If success pages exist in the original but not in the copy, initialize it
      if (!newState.settings.successPages) {
        newState.settings.successPages = [];
      }
      
      // Ensure success pages are properly copied
      if (newState.settings.successPages.length === 0 && formState.settings.successPages.length > 0) {
        newState.settings.successPages = JSON.parse(JSON.stringify(formState.settings.successPages));
      }
    }
    
    // First pass: assign new IDs to questions and map old to new
    newState.questions.forEach((question, index) => {
      const newQuestionId = `q_${index + 1}`;
      idMap.set(question.id, newQuestionId);
      questionIdToIndex.set(question.id, index);
      question.id = newQuestionId;
    });
    
    // Second pass: update options and conditions
    newState.questions.forEach((question, qIndex) => {
      // Update options
      if (question.options) {
        question.options.forEach((option, oIndex) => {
          const newOptionId = `${question.id}_opt_${oIndex + 1}`;
          idMap.set(option.id, newOptionId);
          option.id = newOptionId;
        });
      }
      
      // Update conditions
      if (question.conditions) {
        const newConditions = question.conditions.map((condition, cIndex) => {
          // Update condition ID
          const newConditionId = `${question.id}_cond_${cIndex + 1}`;
          
          // Update questionId reference
          let newQuestionId = condition.questionId;
          if (idMap.has(condition.questionId)) {
            newQuestionId = idMap.get(condition.questionId)!;
          }
          
          // Update values array with new option IDs
          const newValues = condition.values.map(value => {
            return idMap.has(value) ? idMap.get(value)! : value;
          });
          
          return {
            ...condition,
            id: newConditionId, 
            questionId: newQuestionId,
            values: newValues
          };
        });
        
        question.conditions = newConditions;
      }
    });
    
    // Third pass: handle any special condition references in the conditions array
    const conditionQuestions = newState.questions.filter(q => q.conditions && q.conditions.length > 0);
    
    if (conditionQuestions.length > 0) {
      const conditionsArray = conditionQuestions.map(q => ({
        questionId: q.id,
        conditions: q.conditions,
        conditionLogic: q.conditionLogic || "AND"
      }));
      
      // Ensure all references in the conditions array use the updated IDs
      conditionsArray.forEach(item => {
        if (item.conditions) {
          item.conditions.forEach(condition => {
            // Update questionId
            if (idMap.has(condition.questionId)) {
              condition.questionId = idMap.get(condition.questionId)!;
            }
            
            // Update values
            if (condition.values) {
              condition.values = condition.values.map(value => 
                idMap.has(value) ? idMap.get(value)! : value
              );
            }
          });
        }
      });
    }
    
    // Update success page conditions to use new IDs
    if (newState.settings.successPages && newState.settings.successPages.length > 0) {
      console.log(`Updating IDs for ${newState.settings.successPages.length} success pages`);
      
      newState.settings.successPages.forEach(page => {
        if (!page.conditions) return;
        
        page.conditions.forEach(condition => {
          // Update questionId reference
          if (idMap.has(condition.questionId)) {
            const newQuestionId = idMap.get(condition.questionId);
            console.log(`Updating success page condition: ${condition.questionId} -> ${newQuestionId}`);
            condition.questionId = newQuestionId!;
          }
          
          // Update values array with new option IDs
          if (condition.values) {
            const oldValues = [...condition.values];
            condition.values = condition.values.map(value => 
              idMap.has(value) ? idMap.get(value)! : value
            );
            console.log(`Updating success page condition values: ${JSON.stringify(oldValues)} -> ${JSON.stringify(condition.values)}`);
          }
        });
      });
    }
    
    return newState;
  };

  // Generate HTML code for the form
  const generateHTML = (): string => {
    // Transform form state to use human-readable IDs
    const transformedFormState = transformFormState();
    
    // Create a custom prefix for all classes to prevent conflicts
    const prefix = "qform-";
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${transformedFormState.title}</title>
  ${activeTab === "single" 
    ? `<style>
${generateCSS(prefix)}
    </style>` 
    : '<link rel="stylesheet" href="form-styles.css">'
  }
  ${transformedFormState.questions.some(q => q.type === "address" && q.postcodeApi === "postcodes4u")
    ? '<script type="text/javascript" src="http://www.postcodes4u.co.uk/postcodes4u.js"></script>'
    : ''
  }
</head>
<body style="background-color: ${transformedFormState.settings.backgroundColor}">
  <div class="${prefix}container">
    <div class="${prefix}card">
      <!-- Progress bar -->
      <div class="${prefix}progress-bar">
        <div class="${prefix}progress-bar-fill" id="${prefix}progress-bar"></div>
      </div>
      
      <div class="${prefix}form-content" id="${prefix}form-content">
        <div id="${prefix}questions-container">
          ${transformedFormState.questions.map((question, index) => `
          <div class="${prefix}question" id="${prefix}question-${question.id}" ${index > 0 ? 'style="display: none;"' : ''}>
            <div class="${prefix}question-header">
              <h2 class="${prefix}question-text">${question.text}${question.required ? `<span class="${prefix}required">*</span>` : ''}</h2>
              ${question.description ? `<p class="${prefix}question-description">${question.description}</p>` : ''}
            </div>
            
            ${question.type === 'text_input' 
              ? `<div class="${prefix}text-input-container">
                  <input type="text" class="${prefix}text-input" id="${prefix}input-${question.id}" placeholder="Type your answer here..." ${question.required ? 'required' : ''} />
                </div>`
              : question.type === 'address'
                ? `<div class="${prefix}address-container">
                    ${question.postcodeApi === 'postcodes4u' 
                      ? `<!-- Postcodes4u Integration -->
                         <div class="${prefix}address-search" id="${prefix}address-search-${question.id}">
                           <div id='postcodes4ukey' style='display: none;'>${transformedFormState.settings.postcodes4uProductKey || ''}</div>
                           <div id='postcodes4uuser' style='display: none;'>${transformedFormState.settings.postcodes4uUsername || ''}</div>

                           <div class="${prefix}postcode-input-wrapper">
                             <div class="${prefix}postcode-search-container">
                               <input type="text" value="" id="postcode" placeholder="Enter postcode" class="${prefix}postcode-input" />
                               <button onclick="SearchBegin();return false;" 
                                 class="${prefix}search-button" id="${prefix}search-${question.id}" 
                                 style="background-color: ${transformedFormState.settings.buttonColor}">
                                 <span class="${prefix}search-icon">🔍</span> Find
                               </button>
                             </div>
                           </div>
                           <select id="dropdown" style='display:none;' onchange="SearchIdBegin()" class="${prefix}address-dropdown">
                             <option>Select an address:</option>
                           </select>
                           <div class="${prefix}address-display" id="${prefix}postcodes4u-results-${question.id}">
                             <div class="${prefix}postcode-fields">
                               <input type="hidden" id="address-data-${question.id}" />
                               <div class="input-row">
                                 <input type="text" value="" id="company" placeholder="Company" style="display:none;" />
                               </div>
                               <div class="input-row">
                                 <input type="text" value="" id="address1" placeholder="Address Line 1" style="display:none;" />
                               </div>
                               <div class="input-row">
                                 <input type="text" value="" id="address2" placeholder="Address Line 2" style="display:none;" />
                               </div>
                               <div class="input-row">
                                 <input type="text" value="" id="town" placeholder="Town" style="display:none;" />
                               </div>
                               <div class="input-row">
                                 <input type="text" value="" id="county" placeholder="County" style="display:none;" />
                               </div>
                             </div>
                           </div>
                         </div>`
                      : `<!-- Custom API Integration -->
                         <div class="${prefix}address-search" id="${prefix}address-search-${question.id}">
                           <div class="${prefix}postcode-input-wrapper">
                             <div class="${prefix}postcode-search-container">
                               <input type="text" class="${prefix}postcode-input" id="${prefix}postcode-${question.id}" placeholder="Enter postcode" />
                               <button class="${prefix}search-button" id="${prefix}search-${question.id}" style="background-color: ${transformedFormState.settings.buttonColor}">
                                 <span class="${prefix}search-icon">🔍</span> Find
                               </button>
                             </div>
                           </div>
                           <div class="${prefix}postcode-error" id="${prefix}error-${question.id}"></div>
                           <div class="${prefix}address-results" id="${prefix}results-${question.id}"></div>
                         </div>`
                    }
                    <div class="${prefix}selected-address" id="${prefix}selected-address-${question.id}" style="display: none;">
                      <div class="${prefix}selected-address-content">
                        <div class="${prefix}selected-address-info">
                          <h4 class="${prefix}selected-address-title">Selected Address:</h4>
                          <p class="${prefix}selected-address-text" id="${prefix}address-text-${question.id}"></p>
                        </div>
                        <button class="${prefix}change-address" id="${prefix}change-${question.id}">Change</button>
                      </div>
                    </div>
                  </div>`
              : question.type === 'contact_form'
                ? `<div class="${prefix}contact-form-container">
                    <div class="${prefix}contact-form-grid">
                      <div class="${prefix}contact-form-row">
                        <div class="${prefix}contact-form-field">
                          <label for="${prefix}firstName-${question.id}" class="${prefix}contact-label">First Name</label>
                          <input type="text" id="${prefix}firstName-${question.id}" class="${prefix}contact-input" placeholder="Enter first name" ${question.required ? 'required' : ''} />
                        </div>
                        <div class="${prefix}contact-form-field">
                          <label for="${prefix}lastName-${question.id}" class="${prefix}contact-label">Last Name</label>
                          <input type="text" id="${prefix}lastName-${question.id}" class="${prefix}contact-input" placeholder="Enter last name" ${question.required ? 'required' : ''} />
                        </div>
                      </div>
                      <div class="${prefix}contact-form-field">
                        <label for="${prefix}phone-${question.id}" class="${prefix}contact-label">Phone Number</label>
                        <input type="tel" id="${prefix}phone-${question.id}" class="${prefix}contact-input" placeholder="Enter phone number" ${question.required ? 'required' : ''} />
                      </div>
                      <div class="${prefix}contact-form-field">
                        <label for="${prefix}email-${question.id}" class="${prefix}contact-label">Email Address</label>
                        <input type="email" id="${prefix}email-${question.id}" class="${prefix}contact-input" placeholder="Enter email address" ${question.required ? 'required' : ''} />
                      </div>
                      <div class="${prefix}contact-form-checkbox">
                        <input type="checkbox" id="${prefix}terms-${question.id}" class="${prefix}contact-checkbox" ${question.required ? 'required' : ''} />
                        <label for="${prefix}terms-${question.id}" class="${prefix}contact-checkbox-label">
                          I agree to the <a href="#" class="${prefix}contact-link">Terms and Conditions</a> and <a href="#" class="${prefix}contact-link">Privacy Policy</a>
                        </label>
                      </div>
                    </div>
                  </div>`
              : question.type === 'single_choice'
                ? `<div class="${prefix}options-container">
                    <div class="${prefix}options-grid">
                      ${question.options?.map(option => `
                        <div class="${prefix}option ${prefix}single-option" data-option-id="${option.id}" data-question-id="${question.id}">
                          ${option.description ? `
                          <div class="${prefix}info-button" data-option-id="${option.id}">
                            <span class="${prefix}info-icon">i</span>
                            <div class="${prefix}info-tooltip" id="${prefix}tooltip-${option.id}">${option.description}</div>
                          </div>` : ''}
                          <div class="${prefix}option-content">
                            ${option.icon ? `<div class="${prefix}option-icon"><img src="${option.icon}" alt="${option.text}" class="${prefix}option-image"></div>` : ''}
                            <span class="${prefix}option-text">${option.text}</span>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  </div>`
                : `<div class="${prefix}options-container">
                    <div class="${prefix}options-grid">
                      ${question.options?.map(option => `
                        <div class="${prefix}option ${prefix}multiple-option" data-option-id="${option.id}" data-question-id="${question.id}">
                          ${option.description ? `
                          <div class="${prefix}info-button" data-option-id="${option.id}">
                            <span class="${prefix}info-icon">i</span>
                            <div class="${prefix}info-tooltip" id="${prefix}tooltip-${option.id}">${option.description}</div>
                          </div>` : ''}
                          <div class="${prefix}checkbox"><div class="${prefix}checkbox-inner"></div></div>
                          <div class="${prefix}option-content">
                            ${option.icon ? `<div class="${prefix}option-icon"><img src="${option.icon}" alt="${option.text}" class="${prefix}option-image"></div>` : ''}
                            <span class="${prefix}option-text">${option.text}</span>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  </div>`
            }
            <div class="${prefix}next-button-container">
              <button class="${prefix}next-button" id="${prefix}next-button-${question.id}" style="background-color: ${transformedFormState.settings.buttonColor}">
                Next <span class="${prefix}next-icon">→</span>
              </button>
            </div>
          </div>`).join('')}
          
          <div class="${prefix}question" id="${prefix}thank-you-screen" style="display: none;">
            <div class="${prefix}thank-you-content">
              <div class="${prefix}thank-you-icon">✓</div>
              <h2>Thank you for your response!</h2>
              <p>Your answers have been recorded. We appreciate your time.</p>
              <button class="${prefix}start-over-button" id="${prefix}start-over-button" style="background-color: ${transformedFormState.settings.buttonColor}">
                <span class="${prefix}refresh-icon">↻</span> Start Over
              </button>
            </div>
          </div>
        </div>
        
        <div class="${prefix}form-navigation" id="${prefix}form-navigation">
          <button class="${prefix}back-button" id="${prefix}back-button" disabled>
            <span class="${prefix}back-icon">←</span> Back
          </button>
        </div>
      </div>
    </div>
  </div>

  ${activeTab === "single" 
    ? `<script>
${generateJS(prefix, transformedFormState)}
    </script>` 
    : '<script src="form-script.js"></script>'
  }
</body>
</html>`;
  };

  // Generate CSS code
  const generateCSS = (prefix: string = "qform-"): string => {
    // Use the transformed form state for CSS generation
    const transformedState = transformFormState();
    
    return `/* Quote Form Styles */
* {
  box-sizing: border-box;
}

body{
  margin: 0;
}

.${prefix}container {
  width: 100%;
  margin: 0 auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.5;
  color: #333;
  min-height: 100vh;
}

.${prefix}card {
  background-color: #f3f4f6;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.${prefix}progress-bar {
  width: 100%;
  height: 4px;
  background-color: #e9ecef;
}

.${prefix}progress-bar-fill {
  height: 100%;
  background-color: ${transformedState.settings.buttonColor};
  width: 0;
  transition: width 0.5s ease-out;
}

.${prefix}form-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
}

#${prefix}questions-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.${prefix}question {
  width: 100%;
  max-width: 1000px;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: ${prefix}fadeIn 0.3s ease-in-out;
}

@keyframes ${prefix}fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.${prefix}question-header {
  margin-bottom: 1rem;
  text-align: center;
}

.${prefix}question-text {
  font-size: 2rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.${prefix}question-description {
  color: #6c757d;
  margin-top: 0rem;
}

.${prefix}required {
  color: #e53e3e;
  margin-left: 3px;
}

.${prefix}text-input-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.${prefix}text-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 1rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.${prefix}text-input:focus {
  outline: none;
  border-color: ${transformedState.settings.buttonColor};
  box-shadow: 0 0 0 2px rgba(${hexToRgb(transformedState.settings.buttonColor)}, 0.25);
}

.${prefix}options-container {
  width: 100%;
  padding: 0 0.5rem;
}

.${prefix}options-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 0.75rem;
  justify-content: center;
}

/* Responsive grid adjustments */
@media (min-width: 640px) {
  .${prefix}options-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .${prefix}options-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .${prefix}options-grid {
    grid-template-columns: repeat(4, 1fr);
    justify-content: center;
  }
}

.${prefix}option {
  position: relative;
  padding: 1rem;
  background-color: white;
  border-radius: 0.375rem;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  transition: all 0.2s ease;
  height: 100%;
  text-align: left;
  gap: 1rem;
}

.${prefix}option:hover {
  transform: scale(1.05);
}

.${prefix}option.selected {
  border: 2px solid ${transformedState.settings.buttonColor};
}

.${prefix}option:not(.selected) {
  border: 1px solid transparent;
}

.${prefix}option-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: 100%;
  gap: 1rem;
}

.${prefix}option-icon {
  width: 3.5rem;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
}

.${prefix}option-image {
  height: 3.5rem;
  width: auto;
  object-fit: contain;
}

.${prefix}option-text {
  text-align: left;
  font-weight: 500;
}

/* Desktop styles */
@media (min-width: 640px) {
  .${prefix}option {
    flex-direction: column;
    justify-content: center;
    text-align: center;
    gap: 0;
  }
  
  .${prefix}option-content {
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0;
  }
  
  .${prefix}option-icon {
    width: 100%;
    margin-bottom: 0.75rem;
  }
  
  .${prefix}option-image {
    height: 7rem;
  }
  
  .${prefix}option-text {
    text-align: center;
    font-size: 1.25rem;
  }
}

.${prefix}info-button {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 10;
}

.${prefix}info-icon {
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

.${prefix}info-tooltip {
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

.${prefix}info-button:hover .${prefix}info-tooltip {
  display: block;
}

.${prefix}checkbox {
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

.${prefix}checkbox-inner {
  width: 12px;
  height: 12px;
  background-color: ${transformedState.settings.buttonColor};
  border-radius: 2px;
  display: none;
}

.${prefix}multiple-option.selected .${prefix}checkbox-inner {
  display: block;
}

.${prefix}multiple-option.selected .${prefix}checkbox::after {
  content: "✓";
  position: absolute;
  color: ${transformedState.settings.buttonColor};
  font-size: 0.75rem;
}

/* Mobile-specific styles */
@media (max-width: 639px) {
  .${prefix}option {
    flex-direction: row;
    padding: 0.75rem;
  }
  
  .${prefix}option-content {
    flex-direction: row;
    align-items: center;
    justify-content: start;
    gap: 0.75rem;
  }
  
  .${prefix}option-icon {
    margin-bottom: 0;
    width: 4rem;
    flex-shrink: 0;
  }
  
  .${prefix}option-image {
    height: 3.5rem;
  }
  
  .${prefix}question-text {
    font-size: 1.5rem;
  }
  
  .${prefix}form-content {
    padding: 1rem;
  }
}

.${prefix}next-button-container {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  width: 100%;
}

.${prefix}form-navigation {
  display: flex;
  justify-content: flex-start;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
  margin-top: 1.5rem;
}

.${prefix}back-button, .${prefix}next-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.${prefix}back-button {
  background-color: transparent;
  color: #6b7280;
  border: none;
}

.${prefix}back-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: transparent;
}

.${prefix}back-button:hover {
  background-color: ${transformedState.settings.buttonColor};
  color: white;
}

.${prefix}next-button {
  background-color: ${transformedState.settings.buttonColor} !important;
  color: white;
  border: none;
}

.${prefix}next-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.${prefix}thank-you-content {
  text-align: center;
  padding: 2rem 0;
}

.${prefix}thank-you-icon {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background-color: rgba(${hexToRgb(transformedState.settings.buttonColor)}, 0.2);
  color: ${transformedState.settings.buttonColor};
  font-size: 2rem;
  margin-bottom: 1.5rem;
}

.${prefix}thank-you-content h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.${prefix}thank-you-content p {
  color: #6c757d;
  max-width: 24rem;
  margin: 0 auto 1.5rem;
}

.${prefix}start-over-button {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  background-color: ${transformedState.settings.buttonColor};
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.${prefix}refresh-icon {
  font-size: 1rem;
}

/* Address search styles */
.${prefix}address-container {
  max-width: 500px;
  margin: 0 auto;
  width: 100%;
}

.${prefix}postcode-input-wrapper {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  width: 100%;
}

.${prefix}postcode-search-container {
  display: flex;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.${prefix}postcode-input {
  flex: 1;
  border: none;
  padding: 12px 16px;
  font-size: 14px;
  outline: none;
  background-color: #fff;
}

.${prefix}search-button {
  background-color: ${transformedState.settings.buttonColor};
  border: none;
  color: white;
  padding: 0 16px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.${prefix}search-button:hover {
  opacity: 0.9;
}

.${prefix}search-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.${prefix}search-icon {
  font-size: 14px;
}

.${prefix}postcode-error {
  color: #e74c3c;
  font-size: 14px;
  margin-bottom: 12px;
  padding: 10px;
  border-radius: 8px;
  background-color: rgba(231, 76, 60, 0.1);
  display: none;
  border-left: 3px solid #e74c3c;
}

.${prefix}address-results {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
  display: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  background-color: #fff;
}

.${prefix}address-dropdown {
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  background-color: #fff;
}

.${prefix}address-results-header {
  background-color: #f8fafc;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 1px solid #e2e8f0;
  color: #64748b;
}

.${prefix}address-result-item {
  padding: 12px 16px;
  font-size: 14px;
  cursor: pointer;
  border-bottom: 1px solid #e2e8f0;
  transition: background-color 0.2s ease;
}

.${prefix}address-result-item:last-child {
  border-bottom: none;
}

.${prefix}address-result-item:hover {
  background-color: #f1f5f9;
}

.${prefix}selected-address {
  border: 1px solid #dbeafe;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
  background-color: #f0f9ff;
  padding: 16px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
}

.${prefix}selected-address-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.${prefix}selected-address-info {
  flex: 1;
}

.${prefix}selected-address-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 6px 0;
  color: #0f172a;
}

.${prefix}selected-address-text {
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
  color: #334155;
}

.${prefix}change-address {
  background: none;
  border: none;
  color: ${transformedState.settings.buttonColor};
  font-size: 13px;
  cursor: pointer;
  padding: 6px 12px;
  margin-left: 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  white-space: nowrap;
}

.${prefix}change-address:hover {
  background-color: rgba(${hexToRgb(transformedState.settings.buttonColor)}, 0.1);
}

.${prefix}loader {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: ${prefix}spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes ${prefix}spin {
  to {
    transform: rotate(360deg);
  }
}

/* Contact Form Styles */
.${prefix}contact-form-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.${prefix}contact-form-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.${prefix}contact-form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .${prefix}contact-form-row {
    grid-template-columns: 1fr 1fr;
  }
}

.${prefix}contact-form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.${prefix}contact-label {
  font-weight: 500;
  font-size: 0.875rem;
}

.${prefix}contact-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 1rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.${prefix}contact-input:focus {
  outline: none;
  border-color: ${transformedState.settings.buttonColor};
  box-shadow: 0 0 0 2px rgba(${hexToRgb(transformedState.settings.buttonColor)}, 0.25);
}

.${prefix}contact-form-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.${prefix}contact-checkbox {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: ${transformedState.settings.buttonColor};
}

.${prefix}contact-checkbox-label {
  font-size: 0.875rem;
}

.${prefix}contact-link {
  color: ${transformedState.settings.buttonColor};
  text-decoration: underline;
}
`;
  };

  // Generate JavaScript code
  const generateJS = (prefix: string = "qform-", state: FormState = transformFormState()): string => {
    const conditionsJSON = JSON.stringify(
      state.questions
        .filter(q => q.conditions && q.conditions.length > 0)
        .map(q => ({
          questionId: q.id,
          conditions: q.conditions,
          conditionLogic: q.conditionLogic || "AND"
        }))
    );
    
    // Add success pages to the state as well
    const successPagesJSON = JSON.stringify(state.settings.successPages || []);
    
    return `// Quote Form Script
document.addEventListener('DOMContentLoaded', function() {
  // Form state
  const state = {
    currentQuestionIndex: 0,
    answers: {},
    questions: ${JSON.stringify(state.questions)},
    conditions: ${conditionsJSON},
    submitUrl: "${state.settings.submitUrl}",
    zapierWebhookUrl: "${state.settings.zapierWebhookUrl}",
    customApiKey: "${state.settings.customApiKey || ''}",
    postcodes4uUsername: "${state.settings.postcodes4uUsername || ''}",
    postcodes4uProductKey: "${state.settings.postcodes4uProductKey || ''}",
    successPages: ${successPagesJSON}
  };

  // Try to load answers from session storage
  try {
    const savedAnswers = sessionStorage.getItem('qform_answers');
    if (savedAnswers) {
      state.answers = JSON.parse(savedAnswers);
    }
  } catch (e) {
    console.error('Failed to load answers from session storage:', e);
  }

  // DOM elements
  const questionsContainer = document.getElementById('${prefix}questions-container');
  const backButton = document.getElementById('${prefix}back-button');
  const progressBar = document.getElementById('${prefix}progress-bar');
  const startOverButton = document.getElementById('${prefix}start-over-button');
  const formNavigation = document.getElementById('${prefix}form-navigation');
  
  // Track visible questions
  let activeQuestionIds = [];
  
  // Initialize form
  initForm();
  
  // Helper function to save answers to session storage
  function saveAnswersToSession() {
    try {
      sessionStorage.setItem('qform_answers', JSON.stringify(state.answers));
    } catch (e) {
      console.error('Failed to save answers to session storage:', e);
    }
  }
  
  // Function to restore saved answers in the UI
  function restoreSavedAnswers() {
    // Restore single choice selections
    for (const questionId in state.answers) {
      const answer = state.answers[questionId];
      
      // For single choice questions
      if (typeof answer === 'string') {
        updateOptionSelection(questionId, answer, true);
      } 
      // For multiple choice questions
      else if (Array.isArray(answer)) {
        updateMultipleChoiceSelection(questionId);
      }
      // For text inputs
      else if (document.getElementById(\`${prefix}input-\${questionId}\`)) {
        document.getElementById(\`${prefix}input-\${questionId}\`).value = answer;
      }
      // For address data (object with fullAddress property)
      else if (answer && typeof answer === 'object' && answer.fullAddress) {
        // Restore address UI state
        const selectedAddressElement = document.getElementById(\`${prefix}selected-address-\${questionId}\`);
        const searchElement = document.getElementById(\`${prefix}address-search-\${questionId}\`);
        const selectedAddressText = document.getElementById(\`${prefix}address-text-\${questionId}\`);
        
        if (selectedAddressElement && selectedAddressText && searchElement) {
          selectedAddressText.textContent = answer.fullAddress;
          searchElement.style.display = 'none';
          selectedAddressElement.style.display = 'block';
        }
      }
      // For contact form data
      else if (answer && typeof answer === 'object') {
        // Check if this is contact form data by looking for firstName property
        if (answer.firstName !== undefined) {
          // Restore contact form field values
          if (document.getElementById(\`${prefix}firstName-\${questionId}\`)) {
            document.getElementById(\`${prefix}firstName-\${questionId}\`).value = answer.firstName || '';
          }
          if (document.getElementById(\`${prefix}lastName-\${questionId}\`)) {
            document.getElementById(\`${prefix}lastName-\${questionId}\`).value = answer.lastName || '';
          }
          if (document.getElementById(\`${prefix}phone-\${questionId}\`)) {
            document.getElementById(\`${prefix}phone-\${questionId}\`).value = answer.phone || '';
          }
          if (document.getElementById(\`${prefix}email-\${questionId}\`)) {
            document.getElementById(\`${prefix}email-\${questionId}\`).value = answer.email || '';
          }
          if (document.getElementById(\`${prefix}terms-\${questionId}\`)) {
            document.getElementById(\`${prefix}terms-\${questionId}\`).checked = !!answer.termsAccepted;
          }
        }
      }
    }
    
    // Recalculate visible questions based on loaded answers
    calcVisibleQuestions();
  }
  
  function initForm() {
    // Set up single choice option click handlers
    document.querySelectorAll('.${prefix}single-option').forEach(option => {
      option.addEventListener('click', function() {
        const questionId = this.dataset.questionId;
        const optionId = this.dataset.optionId;
        
        // Set answer
        state.answers[questionId] = optionId;
        
        // Save to session storage
        saveAnswersToSession();
        
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
    document.querySelectorAll('.${prefix}multiple-option').forEach(option => {
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
        
        // Save to session storage
        saveAnswersToSession();
        
        // Update UI
        updateMultipleChoiceSelection(questionId);
        
        // Recalculate visible questions based on new answer
        calcVisibleQuestions();
        
        // Update next button state
        updateNextButtonState();
      });
    });
    
    // Set up next buttons for each question
    state.questions.forEach(question => {
      const nextButton = document.getElementById(\`${prefix}next-button-\${question.id}\`);
      if (nextButton) {
        nextButton.addEventListener('click', goToNextQuestion);
      }
    });
    
    // Set up info buttons to show tooltips on mobile
    document.querySelectorAll('.${prefix}info-icon').forEach(infoBtn => {
      infoBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const optionId = this.parentElement.dataset.optionId;
        const tooltip = document.getElementById(\`${prefix}tooltip-\${optionId}\`);
        
        // Toggle tooltip visibility
        if (tooltip.style.display === 'block') {
          tooltip.style.display = 'none';
        } else {
          // Hide all other tooltips first
          document.querySelectorAll('.${prefix}info-tooltip').forEach(t => {
            t.style.display = 'none';
          });
          
          tooltip.style.display = 'block';
        }
      });
    });
    
    // Close tooltips when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.${prefix}info-button')) {
        document.querySelectorAll('.${prefix}info-tooltip').forEach(tooltip => {
          tooltip.style.display = 'none';
        });
      }
    });
    
    // Set up text input handlers
    document.querySelectorAll('.${prefix}text-input').forEach(input => {
      input.addEventListener('input', function() {
        const questionId = this.id.replace('${prefix}input-', '');
        state.answers[questionId] = this.value;
        
        // Save to session storage
        saveAnswersToSession();
        
        // Recalculate visible questions whenever text input changes
        calcVisibleQuestions();
        
        updateNextButtonState();
      });
    });
    
    // Restore saved answers from session storage
    restoreSavedAnswers();
    
    // Set up back button
    backButton.addEventListener('click', goToPreviousQuestion);
    startOverButton.addEventListener('click', resetForm);
    
    // Calculate initially visible questions
    calcVisibleQuestions();
    
    // Show first question
    updateView();

    // Set up contact form input handlers
    state.questions.forEach(question => {
      if (question.type === 'contact_form') {
        setupContactFormHandlers(question);
      }
    });

    // Set up address question handlers
    state.questions.forEach(question => {
      if (question.type === 'address') {
        setupAddressHandlers(question);
      }
    });
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
    // Update options
    document.querySelectorAll(\`.${prefix}option[data-question-id="\${questionId}"]\`).forEach(opt => {
      if (opt.dataset.optionId === selectedOptionId) {
        opt.classList.add('selected');
      } else if (isSingleChoice) {
        opt.classList.remove('selected');
      }
    });
  }
  
  function updateMultipleChoiceSelection(questionId) {
    const selectedOptions = state.answers[questionId] || [];
    
    // Update multiple choice options
    document.querySelectorAll(\`.${prefix}multiple-option[data-question-id="\${questionId}"]\`).forEach(opt => {
      if (selectedOptions.includes(opt.dataset.optionId)) {
        opt.classList.add('selected');
      } else {
        opt.classList.remove('selected');
      }
    });
  }
  
  function updateView() {
    // Hide all questions
    document.querySelectorAll('.${prefix}question').forEach(q => {
      q.style.display = 'none';
    });
    
    if (state.currentQuestionIndex === null) {
      document.getElementById('${prefix}thank-you-screen').style.display = 'block';
      formNavigation.style.display = 'none';
      return;
    }
    
    // Show current question
    const currentQuestionId = state.questions[state.currentQuestionIndex].id;
    const currentQuestion = state.questions[state.currentQuestionIndex];
    document.getElementById(\`${prefix}question-\${currentQuestionId}\`).style.display = 'flex';
    
    // Update navigation buttons
    backButton.disabled = state.currentQuestionIndex === 0;
    
    // Update next buttons text and visibility
    state.questions.forEach(question => {
      const nextBtn = document.getElementById(\`${prefix}next-button-\${question.id}\`);
      if (nextBtn) {
        // Show submit text on the last question
        const isLastQuestion = activeQuestionIds.indexOf(question.id) === activeQuestionIds.length - 1;
        if (isLastQuestion) {
          nextBtn.innerHTML = 'Submit <span class="${prefix}next-icon">→</span>';
        } else {
          nextBtn.innerHTML = 'Next <span class="${prefix}next-icon">→</span>';
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
    const nextButton = document.getElementById(\`${prefix}next-button-\${currentQuestion.id}\`);
    
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
    
    const question = state.questions.find(q => q.id === questionId);
    
    // Special handling for contact form
    if (question && question.type === 'contact_form' && typeof answer === 'object') {
      return (
        answer.firstName?.trim() !== "" && 
        answer.lastName?.trim() !== "" && 
        answer.phone?.trim() !== "" && 
        answer.email?.trim() !== "" && 
        answer.termsAccepted === true
      );
    }
    
    if (typeof answer === 'object') return answer !== null;
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
    
    // Transform answers to include question text and answer text instead of just IDs
    const transformedAnswers = {};
    
    Object.keys(state.answers).forEach(questionId => {
      const question = state.questions.find(q => q.id === questionId);
      if (!question) return;
      
      const questionKey = question.text;
      
      if (question.type === 'text_input') {
        // For text inputs, just use the value directly
        transformedAnswers[questionKey] = state.answers[questionId];
      } else if (question.type === 'address') {
        // For address questions, use static field names instead of question text
        const addressData = state.answers[questionId];
        if (addressData && typeof addressData === 'object') {
          transformedAnswers['useraddress'] = addressData.fullAddress;
          transformedAnswers['useraddress_building'] = addressData.buildingNumber;
          transformedAnswers['useraddress_street'] = addressData.street;
          transformedAnswers['useraddress_town'] = addressData.town;
          transformedAnswers['useraddress_postcode'] = addressData.postcode;
          
          // Also add the question text as key for reference
          // transformedAnswers[\`question_\${questionId}\`] = question.text;
        }
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
      } else if (question.type === 'contact_form') {
        // For contact form, add individual fields
        const contactData = state.answers[questionId];
        if (contactData && typeof contactData === 'object') {
          transformedAnswers['user_first_name'] = contactData.firstName || '';
          transformedAnswers['user_last_name'] = contactData.lastName || '';
          transformedAnswers['user_phone'] = contactData.phone || '';
          transformedAnswers['user_email'] = contactData.email || '';
          transformedAnswers['terms_accepted'] = contactData.termsAccepted ? 'Yes' : 'No';
          
          // Also include the full question text
          transformedAnswers[questionKey] = 'Contact Information Provided';
        }
      } else {
        // For single choice, look up the text of the selected option
        const answerId = state.answers[questionId];
        const option = question.options?.find(opt => opt.id === answerId);
        transformedAnswers[questionKey] = option ? option.text : answerId;
      }
    });
    
    // Save transformed answers to session storage for developer access
    try {
      sessionStorage.setItem('qform_transformed_answers', JSON.stringify(transformedAnswers));
    } catch (e) {
      console.error('Failed to save transformed answers to session storage:', e);
    }
    
    // Submit data to Zapier if webhook URL provided
    if (state.zapierWebhookUrl) {
      fetch(state.zapierWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transformedAnswers),
        mode: 'no-cors'
      }).catch(err => console.error('Error submitting form:', err));
    }
    
    // Check if we should redirect to a conditional success page
    let redirectUrl = state.submitUrl; // Default URL
    
    if (state.successPages && state.successPages.length > 0) {
      console.log('Evaluating success page conditions...');
      
      // Find the first matching success page
      const matchingPage = state.successPages.find(page => {
        if (!page.conditions || page.conditions.length === 0) return false;
        
        console.log(\`Checking conditions for success page: \${page.name}\`);
        
        // Check all conditions for this page
        const conditionResults = page.conditions.map(condition => {
          const answer = state.answers[condition.questionId];
          console.log(\`Condition for question \${condition.questionId}:\`);
          console.log(\`- Answer: \${JSON.stringify(answer)}\`);
          console.log(\`- Expected values: \${JSON.stringify(condition.values)}\`);
          
          if (answer === undefined) {
            console.log('- No answer provided');
            return false;
          }
          
          // For single choice or multiple choice questions
          if (Array.isArray(answer)) {
            // Multiple choice answer
            const result = condition.values.some(val => answer.includes(val));
            console.log(\`- Result (multiple choice): \${result}\`);
            return result;
          } else if (typeof answer === 'object' && !Array.isArray(answer)) {
            // For object answers (contact form, address), check if any property matches
            const objValues = Object.values(answer).map(String);
            const result = condition.values.some(val => objValues.includes(val));
            console.log(\`- Result (object): \${result}\`);
            return result;
          } else {
            // For string answers (single choice, text input)
            const result = condition.values.includes(String(answer));
            console.log(\`- Result (simple value): \${result}\`);
            return result;
          }
        });
        
        // Apply the appropriate logic
        const finalResult = page.conditionLogic === 'AND' 
          ? conditionResults.every(Boolean) 
          : conditionResults.some(Boolean);
          
        console.log(\`- Final result for \${page.name}: \${finalResult} (\${page.conditionLogic} logic)\`);
        return finalResult;
      });
      
      // If we found a matching page, use its URL
      if (matchingPage && matchingPage.url) {
        console.log(\`Redirecting to success page: \${matchingPage.name} (\${matchingPage.url})\`);
        redirectUrl = matchingPage.url;
      } else {
        console.log(\`No matching success page found, using default URL: \${redirectUrl}\`);
      }
    }
    
    // Redirect if URL provided
    if (redirectUrl) {
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 2000);
    }
  }
  
  function resetForm() {
    state.currentQuestionIndex = 0;
    state.answers = {};
    
    // Clear session storage
    try {
      sessionStorage.removeItem('qform_answers');
    } catch (e) {
      console.error('Failed to clear session storage:', e);
    }
    
    // Reset selections
    document.querySelectorAll('.${prefix}option').forEach(opt => {
      opt.classList.remove('selected');
    });
    
    // Reset text inputs
    document.querySelectorAll('.${prefix}text-input').forEach(input => {
      input.value = '';
    });
    
    // Recalculate visible questions
    calcVisibleQuestions();
    
    // Show navigation again
    formNavigation.style.display = 'flex';
    
    // Update view
    updateView();
  }

  // Setup address lookup handlers
  function setupAddressHandlers(question) {
    const searchButton = document.getElementById(\`${prefix}search-\${question.id}\`);
    const postcodeInput = document.getElementById(\`${prefix}postcode-\${question.id}\`);
    const errorElement = document.getElementById(\`${prefix}error-\${question.id}\`);
    const resultsElement = document.getElementById(\`${prefix}results-\${question.id}\`);
    const selectedAddressElement = document.getElementById(\`${prefix}selected-address-\${question.id}\`);
    const selectedAddressText = document.getElementById(\`${prefix}address-text-\${question.id}\`);
    const changeButton = document.getElementById(\`${prefix}change-\${question.id}\`);
    
    if (!searchButton && question.postcodeApi !== 'postcodes4u') return;
    
    // Add direct handler for Postcodes4u dropdown if needed
    if (question.postcodeApi === 'postcodes4u') {
      // Handle Postcodes4u dropdown change
      const dropdown = document.getElementById('dropdown');
      if (dropdown) {
        dropdown.addEventListener('change', function() {
          // Give a small delay for fields to be populated
          setTimeout(() => {
            const formattedAddress = {
              fullAddress: (document.getElementById('address1')?.value || '') + 
                (document.getElementById('address2')?.value ? ', ' + document.getElementById('address2')?.value : '') + 
                (document.getElementById('town')?.value ? ', ' + document.getElementById('town')?.value : '') + 
                (document.getElementById('county')?.value ? ', ' + document.getElementById('county')?.value : '') + 
                (document.getElementById('postcode')?.value ? ', ' + document.getElementById('postcode')?.value : ''),
              buildingNumber: document.getElementById('company')?.value || '',
              street: document.getElementById('address1')?.value || '',
              town: document.getElementById('town')?.value || '',
              postcode: document.getElementById('postcode')?.value || ''
            };
            
            // Update the UI
            const searchElement = document.getElementById(\`${prefix}address-search-\${question.id}\`);
            
            if (selectedAddressElement && selectedAddressText && searchElement) {
              selectedAddressText.textContent = formattedAddress.fullAddress;
              searchElement.style.display = 'none';
              selectedAddressElement.style.display = 'block';
              
              // Store in form state
              state.answers[question.id] = formattedAddress;
              
              // Save to session storage
              saveAnswersToSession();
              
              // Update navigation
              calcVisibleQuestions();
              updateNextButtonState();
            }
          }, 800); // Longer timeout to ensure fields are populated
        });
      }
    }
    
    // Set up event listener for the search button
    searchButton.addEventListener('click', async function() {
      const postcode = postcodeInput.value.trim();
      
      if (!postcode) {
        showError(errorElement, 'Please enter a postcode');
        return;
      }
      
      // Show loading state
      searchButton.disabled = true;
      const originalButtonText = searchButton.innerHTML;
      searchButton.innerHTML = \`<span class="${prefix}loader"></span>Searching...\`;
      
      if (question.postcodeApi === 'postcodes4u') {
        // Use the Postcodes4u API
        postcodeInput.value = postcode;
        try {
          // Postcodes4u uses its own global function
          if (typeof SearchBegin === 'function') {
            // Handle the Postcodes4u form submission
            SearchBegin();
            
            // Set up observer to detect when the Postcodes4u dropdown becomes visible
            const dropdownObserver = new MutationObserver(function(mutations) {
              mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'style' && 
                    document.getElementById('dropdown').style.display !== 'none') {
                  // When dropdown becomes visible, set up a change listener
                  document.getElementById('dropdown').addEventListener('change', function() {
                    // Collect the address data when an address is selected
                    setTimeout(() => {
                      const formattedAddress = {
                        fullAddress: document.getElementById('address1').value + ', ' + 
                                    document.getElementById('address2').value + ', ' + 
                                    document.getElementById('town').value + ', ' + 
                                    document.getElementById('county').value + ', ' + 
                                    document.getElementById('postcode').value,
                        buildingNumber: document.getElementById('company').value,
                        street: document.getElementById('address1').value,
                        town: document.getElementById('town').value,
                        postcode: document.getElementById('postcode').value
                      };
                      
                      // Store the address in a hidden field
                      const addressDataField = document.getElementById(\`address-data-\${question.id}\`);
                      if (addressDataField) {
                        addressDataField.value = JSON.stringify(formattedAddress);
                      }
                      
                      // Update the selected address display
                      const selectedAddressElement = document.getElementById(\`${prefix}selected-address-\${question.id}\`);
                      const searchElement = document.getElementById(\`${prefix}address-search-\${question.id}\`);
                      const selectedAddressText = document.getElementById(\`${prefix}address-text-\${question.id}\`);
                      
                      if (selectedAddressElement && selectedAddressText) {
                        selectedAddressText.textContent = formattedAddress.fullAddress;
                        searchElement.style.display = 'none';
                        selectedAddressElement.style.display = 'block';
                      }
                      
                      // Save the address in the form state
                      state.answers[question.id] = formattedAddress;
                      
                      // Save to session storage
                      saveAnswersToSession();
                      
                      // Update UI state
                      calcVisibleQuestions();
                      updateNextButtonState();
                    }, 500); // Give time for Postcodes4u to fill in the fields
                  });
                }
              });
            });
            
            // Start observing the dropdown
            dropdownObserver.observe(document.getElementById('dropdown'), { attributes: true });
          } else {
            showError(errorElement, 'Postcodes4u API not available');
          }
        } catch (error) {
          console.error('Error with Postcodes4u:', error);
          showError(errorElement, 'Error with postcode lookup');
        } finally {
          searchButton.disabled = false;
          searchButton.innerHTML = originalButtonText;
        }
      } else {
        // Use the custom API
        try {
          const apiKey = state.customApiKey;
          
          if (!apiKey || apiKey.trim() === '') {
            showError(errorElement, 'WebBuildAPI key is not configured. Please add your API key in the form settings.');
            searchButton.disabled = false;
            searchButton.innerHTML = originalButtonText;
            return;
          }
          
          // Format the postcode: remove spaces and convert to uppercase
          const formattedPostcode = postcode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          
          console.log('Fetching address for postcode:', formattedPostcode);
          console.log('Using API key:', apiKey ? 'API key provided (masked)' : 'No API key');
          
          const response = await fetch(\`https://webuildapi.com/post-code-lookup/api/postcodes/\${formattedPostcode}\`, {
            headers: {
              'Authorization': \`Bearer \${apiKey}\`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            if (response.status === 500) {
              console.error('Server error from API:', response.status);
              showError(errorElement, 'API server error (500). This usually indicates an invalid API key or authentication issue. Please check your WebBuildAPI key in the form settings.');
            } else {
              throw new Error(\`Failed to fetch address: \${response.status}\`);
            }
            return;
          }
          
          const data = await response.json();
          
          if (!data.SearchEnd || !data.SearchEnd.Summaries || data.SearchEnd.Summaries.length === 0) {
            showError(errorElement, 'No addresses found for this postcode');
          } else {
            showAddressResults(resultsElement, data.SearchEnd.Summaries, question.id);
            hideError(errorElement);
          }
        } catch (error) {
          console.error('Error looking up postcode:', error);
          showError(errorElement, 'Error looking up postcode. Please try again.');
        } finally {
          searchButton.disabled = false;
          searchButton.innerHTML = originalButtonText;
        }
      }
    });
    
    // Set up change button handler
    if (changeButton) {
      changeButton.addEventListener('click', function() {
        resetAddressSearch(question.id);
      });
    }
  }
  
  function showError(element, message) {
    if (!element) return;
    element.textContent = message;
    element.style.display = 'block';
  }
  
  function hideError(element) {
    if (!element) return;
    element.style.display = 'none';
  }
  
  function showAddressResults(element, addresses, questionId) {
    if (!element) return;
    
    element.innerHTML = '';
    
    const header = document.createElement('div');
    header.className = \`${prefix}address-results-header\`;
    header.textContent = 'Select an address:';
    element.appendChild(header);
    
    addresses.forEach(address => {
      const addressItem = document.createElement('div');
      addressItem.className = \`${prefix}address-result-item\`;
      addressItem.textContent = address.Address;
      addressItem.addEventListener('click', () => selectAddress(address, questionId));
      element.appendChild(addressItem);
    });
    
    element.style.display = 'block';
  }
  
  function selectAddress(address, questionId) {
    const resultsElement = document.getElementById(\`${prefix}results-\${questionId}\`);
    const selectedAddressElement = document.getElementById(\`${prefix}selected-address-\${questionId}\`);
    const selectedAddressText = document.getElementById(\`${prefix}address-text-\${questionId}\`);
    const searchElement = document.getElementById(\`${prefix}address-search-\${questionId}\`);
    
    if (!selectedAddressElement || !selectedAddressText || !searchElement) return;
    
    // Update the selected address display
    selectedAddressText.textContent = address.Address;
    
    // Hide the search and results, show the selected address
    searchElement.style.display = 'none';
    if (resultsElement) resultsElement.style.display = 'none';
    selectedAddressElement.style.display = 'block';
    
    // Store the address in the form state
    const formattedAddress = {
      fullAddress: address.Address,
      buildingNumber: address.BuildingNumber,
      street: address.StreetAddress,
      town: address.Town,
      postcode: address.Postcode
    };
    
    state.answers[questionId] = formattedAddress;
    
    // Recalculate visible questions based on new answer
    calcVisibleQuestions();
    
    // Update next button state
    updateNextButtonState();
  }
  
  function resetAddressSearch(questionId) {
    const resultsElement = document.getElementById(\`${prefix}results-\${questionId}\`);
    const selectedAddressElement = document.getElementById(\`${prefix}selected-address-\${questionId}\`);
    const searchElement = document.getElementById(\`${prefix}address-search-\${questionId}\`);
    
    if (!selectedAddressElement || !searchElement) return;
    
    // Get the current question info
    const question = state.questions.find(q => q.id === questionId);
    if (!question) return;
    
    // Hide the selected address, show the search
    selectedAddressElement.style.display = 'none';
    searchElement.style.display = 'block';
    
    // Clear any previous results or errors
    if (resultsElement) resultsElement.style.display = 'none';
    
    if (question.postcodeApi === 'postcodes4u') {
      // Clear the Postcodes4u fields
      document.getElementById('postcode').value = '';
      document.getElementById('company').value = '';
      document.getElementById('address1').value = '';
      document.getElementById('address2').value = '';
      document.getElementById('town').value = '';
      document.getElementById('county').value = '';
      
      // Hide the dropdown if visible
      const dropdown = document.getElementById('dropdown');
      if (dropdown) dropdown.style.display = 'none';
    } else {
      // Clear the custom API search
      const postcodeInput = document.getElementById(\`${prefix}postcode-\${questionId}\`);
      const errorElement = document.getElementById(\`${prefix}error-\${question.id}\`);
      
      if (postcodeInput) postcodeInput.value = '';
      if (errorElement) errorElement.style.display = 'none';
    }
    
    // Clear the answer
    delete state.answers[questionId];
    
    // Recalculate visible questions
    calcVisibleQuestions();
    
    // Update next button state
    updateNextButtonState();
  }

  function setupContactFormHandlers(question) {
    // Initialize contact form data object
    if (!state.answers[question.id]) {
      state.answers[question.id] = {
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        termsAccepted: false
      };
    }
    
    // Set up event handlers for each field
    const firstNameInput = document.getElementById(\`${prefix}firstName-\${question.id}\`);
    const lastNameInput = document.getElementById(\`${prefix}lastName-\${question.id}\`);
    const phoneInput = document.getElementById(\`${prefix}phone-\${question.id}\`);
    const emailInput = document.getElementById(\`${prefix}email-\${question.id}\`);
    const termsCheckbox = document.getElementById(\`${prefix}terms-\${question.id}\`);
    
    if (firstNameInput) {
      firstNameInput.addEventListener('input', function() {
        updateContactField(question.id, 'firstName', this.value);
      });
    }
    
    if (lastNameInput) {
      lastNameInput.addEventListener('input', function() {
        updateContactField(question.id, 'lastName', this.value);
      });
    }
    
    if (phoneInput) {
      phoneInput.addEventListener('input', function() {
        updateContactField(question.id, 'phone', this.value);
      });
    }
    
    if (emailInput) {
      emailInput.addEventListener('input', function() {
        updateContactField(question.id, 'email', this.value);
      });
    }
    
    if (termsCheckbox) {
      termsCheckbox.addEventListener('change', function() {
        updateContactField(question.id, 'termsAccepted', this.checked);
      });
    }
  }
  
  function updateContactField(questionId, field, value) {
    if (!state.answers[questionId]) {
      state.answers[questionId] = {};
    }
    
    state.answers[questionId][field] = value;
    
    // Save to session storage
    saveAnswersToSession();
    
    updateNextButtonState();
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
    // Use the transformed form state for all downloads
    const transformedState = transformFormState();
    
    switch (type) {
      case 'html':
        downloadFile(generateHTML(), 'quote-form.html');
        break;
      case 'css':
        downloadFile(generateCSS(), 'form-styles.css');
        break;
      case 'js':
        downloadFile(generateJS('qform-', transformedState), 'form-script.js');
        break;
      case 'all':
        const zip = new JSZip();
        zip.file('quote-form.html', generateHTML());
        zip.file('form-styles.css', generateCSS());
        zip.file('form-script.js', generateJS('qform-', transformedState));
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
      
      <div className="text-sm text-muted-foreground p-5">
        <p>
          The generated code includes a responsive, mobile-friendly form with conditional logic and form validation.
          Simply copy or download the code and add it to your website.
        </p>
      </div>
    </div>
  );
};

export default CodeExport; 