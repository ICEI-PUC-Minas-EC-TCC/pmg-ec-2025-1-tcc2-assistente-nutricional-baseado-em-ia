"use client";

import { useState, type ChangeEvent } from 'react';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function useFileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dataUri, setDataUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setFile(null);
    setPreview(null);
    setDataUri(null);
    setIsProcessing(true);

    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        setError(`O arquivo é muito grande. O tamanho máximo é ${MAX_FILE_SIZE_MB}MB.`);
        setIsProcessing(false);
        event.target.value = ''; 
        return;
      }
      if (!selectedFile.type.startsWith('image/')) {
        setError('Tipo de arquivo inválido. Por favor, envie uma imagem (PNG, JPG, GIF, WebP).');
        setIsProcessing(false);
        event.target.value = ''; 
        return;
      }

      setFile(selectedFile);

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        setDataUri(result);
        setIsProcessing(false);
      };
      reader.onerror = () => {
        setError('Falha ao ler o arquivo.');
        setIsProcessing(false);
        event.target.value = ''; 
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setDataUri(null);
    setError(null);
    setIsProcessing(false);
  };

  return { file, preview, dataUri, error, handleFileChange, reset, isProcessing };
}
