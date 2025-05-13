"use client";

import { Button } from "@/components/ui/button";
import { RotateCcwIcon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface RestoreButtonProps {
  formId: string;
  versionId: string;
}

export default function RestoreButton({ formId, versionId }: RestoreButtonProps) {
  const [isRestoring, setIsRestoring] = useState(false);
  const router = useRouter();

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const response = await fetch(`/api/forms/${formId}/restore/${versionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // If it's a redirect response, follow it
        if (response.redirected) {
          router.push(response.url);
        } else {
          // Otherwise refresh the current page
          router.refresh();
        }
      } else {
        console.error("Failed to restore:", await response.text());
        alert("Failed to restore version. Please try again.");
      }
    } catch (error) {
      console.error("Error during restore:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="gap-1"
      onClick={handleRestore}
      disabled={isRestoring}
    >
      <RotateCcwIcon size={14} />
      {isRestoring ? "Restoring..." : "Restore"}
    </Button>
  );
} 