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
    <Card>
      <CardHeader>
        <CardTitle>Form Settings</CardTitle>
        <CardDescription>Configure how your form looks and behaves</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid gap-4">
            <h3 className="text-md font-medium">Appearance</h3>
            <div className="grid gap-2">
              <Label htmlFor="backgroundColor">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => handleChange(e, "backgroundColor")}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={settings.backgroundColor}
                  onChange={(e) => handleChange(e, "backgroundColor")}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="buttonColor">Button Color</Label>
              <div className="flex gap-2">
                <Input
                  id="buttonColor"
                  type="color"
                  value={settings.buttonColor}
                  onChange={(e) => handleChange(e, "buttonColor")}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={settings.buttonColor}
                  onChange={(e) => handleChange(e, "buttonColor")}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <h3 className="text-md font-medium">Submission Settings</h3>
            <div className="grid gap-2">
              <Label htmlFor="submitUrl">Submit URL (where to redirect after submission)</Label>
              <Input
                id="submitUrl"
                placeholder="https://example.com/thank-you"
                value={settings.submitUrl}
                onChange={(e) => handleChange(e, "submitUrl")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="zapierWebhookUrl">Zapier Webhook URL (for data collection)</Label>
              <Input
                id="zapierWebhookUrl"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                value={settings.zapierWebhookUrl}
                onChange={(e) => handleChange(e, "zapierWebhookUrl")}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FormSettingsEditor; 