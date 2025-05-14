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
import { Paintbrush, Globe, ExternalLink, Wand2, Key, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type FormSettingsEditorProps = {
  settings: FormSettings;
  onSettingsChange: (settings: FormSettings) => void;
};

const FormSettingsEditor = ({ settings, onSettingsChange }: FormSettingsEditorProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof FormSettings) => {
    onSettingsChange({
      ...settings,
      [field]: e.target.value
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid gap-6">
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Paintbrush className="h-4 w-4" />
            <h3 className="text-sm font-medium uppercase tracking-wide">Appearance</h3>
          </div>
          
          <Separator />
          
          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="backgroundColor" className="text-sm font-medium">Background Color</Label>
              <div className="flex gap-3">
                <div className="relative">
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={settings.backgroundColor}
                    onChange={(e) => handleChange(e, "backgroundColor")}
                    className="w-10 h-10 p-1 overflow-hidden rounded-full cursor-pointer"
                  />
                  <div className="absolute inset-0 rounded-full pointer-events-none border" />
                </div>
                <Input
                  value={settings.backgroundColor}
                  onChange={(e) => handleChange(e, "backgroundColor")}
                  className="flex-1 bg-background/50"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Choose a background color for your form
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="buttonColor" className="text-sm font-medium">Button Color</Label>
              <div className="flex gap-3">
                <div className="relative">
                  <Input
                    id="buttonColor"
                    type="color"
                    value={settings.buttonColor}
                    onChange={(e) => handleChange(e, "buttonColor")}
                    className="w-10 h-10 p-1 overflow-hidden rounded-full cursor-pointer"
                  />
                  <div className="absolute inset-0 rounded-full pointer-events-none border" />
                </div>
                <Input
                  value={settings.buttonColor}
                  onChange={(e) => handleChange(e, "buttonColor")}
                  className="flex-1 bg-background/50"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Choose a color for the form submit button
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ExternalLink className="h-4 w-4" />
            <h3 className="text-sm font-medium uppercase tracking-wide">Integration Settings</h3>
          </div>
          
          <Separator />
          
          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="submitUrl" className="text-sm font-medium">Redirect URL</Label>
              <Input
                id="submitUrl"
                placeholder="https://example.com/thank-you"
                value={settings.submitUrl}
                onChange={(e) => handleChange(e, "submitUrl")}
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground">
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
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground">
                Connect to Zapier to process form submissions
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <h3 className="text-sm font-medium uppercase tracking-wide">Address API Settings</h3>
          </div>
          
          <Separator />
          
          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="customApiKey" className="text-sm font-medium">Custom API Key</Label>
              <Input
                id="customApiKey"
                placeholder="Your WebBuildAPI key"
                value={settings.customApiKey || ""}
                onChange={(e) => handleChange(e, "customApiKey")}
                className="bg-background/50"
                type="password"
              />
              <p className="text-xs text-muted-foreground">
                API key for WebBuildAPI postcode lookup service
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="postcodes4uUsername" className="text-sm font-medium">Postcodes4u Username</Label>
              <Input
                id="postcodes4uUsername"
                placeholder="Your Postcodes4u username"
                value={settings.postcodes4uUsername || ""}
                onChange={(e) => handleChange(e, "postcodes4uUsername")}
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground">
                Username for Postcodes4u service
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="postcodes4uProductKey" className="text-sm font-medium">Postcodes4u Product Key</Label>
              <Input
                id="postcodes4uProductKey"
                placeholder="Your Postcodes4u product key"
                value={settings.postcodes4uProductKey || ""}
                onChange={(e) => handleChange(e, "postcodes4uProductKey")}
                className="bg-background/50"
                type="password"
              />
              <p className="text-xs text-muted-foreground">
                Product key for Postcodes4u service
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wand2 className="h-4 w-4" />
            <h3 className="text-sm font-medium uppercase tracking-wide">Advanced Settings</h3>
          </div>
          
          <Separator />
          
          <div className="space-y-2 rounded-lg bg-accent/10 border border-accent/20 p-4 text-sm">
            <p className="text-muted-foreground">
              More advanced settings like custom CSS, custom JavaScript, and email notifications will be available in the full version.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormSettingsEditor; 