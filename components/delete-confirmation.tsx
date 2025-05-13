"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";

type DeleteConfirmationProps = {
  id: string;
  name: string;
  deleteAction: string;
  type: "form" | "version";
};

export default function DeleteConfirmation({ id, name, deleteAction, type }: DeleteConfirmationProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(deleteAction, {
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
        setOpen(false);
      } else {
        console.error("Failed to delete:", await response.text());
        alert("Failed to delete. Please try again.");
      }
    } catch (error) {
      console.error("Error during delete:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-destructive hover:bg-destructive/10"
              onClick={() => setOpen(true)}
            >
              <TrashIcon size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete {type === "form" ? "Form" : "Version"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this {type}?</DialogTitle>
            <DialogDescription>
              {type === "form"
                ? "This will permanently delete the form and all its versions. This action cannot be undone."
                : "This will permanently delete this version. This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-medium">{name}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : `Delete ${type === "form" ? "Form" : "Version"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 