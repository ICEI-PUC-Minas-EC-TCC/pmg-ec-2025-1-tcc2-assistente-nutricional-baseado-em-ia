"use client";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { XCircle, UploadCloud } from "lucide-react";
import type { ChangeEvent } from "react";
import { cn } from "@/lib/utils";

interface ImageUploadAreaProps {
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  previewUrl: string | null;
  error: string | null;
  isProcessing: boolean;
  reset: () => void;
  inputFieldId?: string;
  disabled?: boolean;
}

export default function ImageUploadArea({
  onFileChange,
  previewUrl,
  error,
  isProcessing,
  reset,
  inputFieldId = "image-upload",
  disabled = false,
}: ImageUploadAreaProps) {
  return (
    <div className="space-y-4">
      <div
        className={cn(
          "group relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/80 transition-colors",
          error ? "border-destructive" : "border-border",
          previewUrl ? "border-solid" : ""
        )}
      >
        {previewUrl ? (
          <>
            <Image
              src={previewUrl}
              alt="Pré-visualização da imagem enviada"
              fill
              style={{ objectFit: "contain" }}
              className="rounded-md p-2"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-background/70 hover:bg-destructive hover:text-destructive-foreground rounded-full"
              onClick={reset}
              aria-label="Remover imagem"
              disabled={disabled || isProcessing}
            >
              <XCircle className="h-6 w-6" />
            </Button>
          </>
        ) : (
          <Label
            htmlFor={inputFieldId}
            className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
          >
            <UploadCloud className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
            <p className="mb-2 text-sm text-muted-foreground group-hover:text-primary transition-colors">
              <span className="font-semibold">Clique para enviar</span> ou arraste e solte
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WebP (MÁX. 5MB)</p>
            {isProcessing && <p className="text-xs text-primary mt-2">Processando imagem...</p>}
          </Label>
        )}
        <Input
          id={inputFieldId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onFileChange}
          disabled={disabled || isProcessing || !!previewUrl}
        />
      </div>
      {error && <p className="text-sm text-destructive text-center">{error}</p>}
    </div>
  );
}
