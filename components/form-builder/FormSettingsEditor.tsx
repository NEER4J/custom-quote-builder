"use client";

import { FormSettings } from "./FormDesigner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaintbrushIcon, GlobeIcon } from "lucide-react";

type FormSettingsEditorProps = {
  settings: FormSettings;
  onChange: (settings: FormSettings) => void;
};

const FormSettingsEditor = ({ settings, onChange }: FormSettingsEditorProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof FormSettings) => {
    onChange({
      ...settings,
      [field]: e.target.value
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
        <div className="grid gap-6">
        <div className="grid gap-5">
          <div className="flex items-center gap-2">
            <PaintbrushIcon className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
            <h3 className="text-lg font-medium">Appearance</h3>
          </div>
          
          <div className="grid gap-3 p-5 bg-zinc-50 dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800">
            <div className="grid gap-2">
              <Label htmlFor="backgroundColor" className="text-sm font-medium">Background Color</Label>
              <div className="flex gap-3">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => handleChange(e, "backgroundColor")}
                  className="w-12 h-12 p-1 border-zinc-300 dark:border-zinc-700 rounded-md"
                />
                <Input
                  value={settings.backgroundColor}
                  onChange={(e) => handleChange(e, "backgroundColor")}
                  className="border-zinc-300 dark:border-zinc-700 focus-visible:ring-black"
                />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Choose a background color for your form
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="buttonColor" className="text-sm font-medium">Button Color</Label>
              <div className="flex gap-3">
                <Input
                  id="buttonColor"
                  type="color"
                  value={settings.buttonColor}
                  onChange={(e) => handleChange(e, "buttonColor")}
                  className="w-12 h-12 p-1 border-zinc-300 dark:border-zinc-700 rounded-md"
                />
                <Input
                  value={settings.buttonColor}
                  onChange={(e) => handleChange(e, "buttonColor")}
                  className="border-zinc-300 dark:border-zinc-700 focus-visible:ring-black"
                />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Choose a color for the form submit button
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="flex items-center gap-2">
            <GlobeIcon className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
            <h3 className="text-lg font-medium">Integration Settings</h3>
          </div>
          
          <div className="grid gap-5 p-5 bg-zinc-50 dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800">
            <div className="grid gap-2">
              <Label htmlFor="submitUrl" className="text-sm font-medium">Redirect URL</Label>
              <Input
                id="submitUrl"
                placeholder="https://example.com/thank-you"
                value={settings.submitUrl}
                onChange={(e) => handleChange(e, "submitUrl")}
                className="border-zinc-300 dark:border-zinc-700 focus-visible:ring-black"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Where to redirect users after form submission
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="zapierWebhookUrl" className="text-sm font-medium">Zapier Webhook URL</Label>
              <Input
                id="zapierWebhookUrl"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                value={settings.zapierWebhookUrl}
                onChange={(e) => handleChange(e, "zapierWebhookUrl")}
                className="border-zinc-300 dark:border-zinc-700 focus-visible:ring-black"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Connect to Zapier to process form submissions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormSettingsEditor; 