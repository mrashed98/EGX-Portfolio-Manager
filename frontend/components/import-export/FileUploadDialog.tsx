"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileSpreadsheet, Download } from "lucide-react";

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  acceptedFileTypes: string;
  onUpload: (file: File, additionalData?: any) => Promise<void>;
  templateUrl?: string;
  showNameInput?: boolean;
  nameInputLabel?: string;
  nameInputPlaceholder?: string;
}

export function FileUploadDialog({
  open,
  onOpenChange,
  title,
  description,
  acceptedFileTypes,
  onUpload,
  templateUrl,
  showNameInput = false,
  nameInputLabel = "Name",
  nameInputPlaceholder = "Enter name",
}: FileUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    if (showNameInput && !name.trim()) {
      toast({
        title: "Name required",
        description: `Please enter a ${nameInputLabel.toLowerCase()}`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      await onUpload(file, { name: name.trim() });
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
      setFile(null);
      setName("");
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.response?.data?.detail || error.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (templateUrl) {
      window.open(templateUrl, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {templateUrl && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleDownloadTemplate}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          )}

          {showNameInput && (
            <div className="space-y-2">
              <Label htmlFor="name">{nameInputLabel}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={nameInputPlaceholder}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept={acceptedFileTypes}
                onChange={handleFileChange}
                className="flex-1"
              />
              {file && (
                <FileSpreadsheet className="h-5 w-5 text-green-500" />
              )}
            </div>
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-pulse" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

