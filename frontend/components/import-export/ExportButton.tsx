"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Download } from "lucide-react";
import api from "@/lib/api";

interface ExportButtonProps {
  endpoint: string;
  filename?: string;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ExportButton({
  endpoint,
  filename,
  label = "Export",
  variant = "outline",
  size = "default",
  className = "",
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get(endpoint, {
        responseType: 'blob',
      });

      // Extract filename from Content-Disposition header if available
      let downloadFilename = filename;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        if (filenameMatch) {
          downloadFilename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadFilename || 'export.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Your file has been downloaded",
      });
    } catch (error: any) {
      console.error("Export failed:", error);
      toast({
        title: "Export failed",
        description: error.response?.data?.detail || "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={exporting}
      className={className}
    >
      <Download className="mr-2 h-4 w-4" />
      {exporting ? "Exporting..." : label}
    </Button>
  );
}

