"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  onProcessFiles: () => void;
  selectedFiles: File[];
  isProcessing: boolean;
}

export function FileUpload({ onFilesSelected, onProcessFiles, selectedFiles, isProcessing }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (files) {
      const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
      const invalidFiles = Array.from(files).filter(file => file.type !== 'application/pdf');
      
      if (invalidFiles.length > 0) {
        setDragError(`${invalidFiles.length} arquivo(s) não são PDFs válidos`);
        setTimeout(() => setDragError(null), 5000);
      }
      
      if (pdfFiles.length > 0) {
        onFilesSelected(pdfFiles);
        setDragError(null);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    setDragError(null);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    onFilesSelected(newFiles);
  };

  const clearAllFiles = () => {
    onFilesSelected([]);
    setDragError(null);
  };

  const getTotalSize = () => {
    const totalBytes = selectedFiles.reduce((acc, file) => acc + file.size, 0);
    const totalMB = totalBytes / 1024 / 1024;
    return totalMB.toFixed(2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload de Arquivos PDF
        </CardTitle>
        <CardDescription>
          Arraste e solte os arquivos PDF de folha de ponto aqui ou clique para selecionar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alertas de erro */}
        {dragError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{dragError}</AlertDescription>
          </Alert>
        )}

        {/* Área de Drag & Drop */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
            isDragOver
              ? 'border-primary bg-primary/5 scale-105'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className={`h-12 w-12 mx-auto mb-4 transition-colors ${
            isDragOver ? 'text-primary' : 'text-muted-foreground'
          }`} />
          <p className="text-lg font-medium mb-2">
            {isDragOver ? 'Solte os arquivos aqui' : 'Arraste e solte os arquivos PDF aqui'}
          </p>
          <p className="text-muted-foreground mb-4">ou</p>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Selecionar Arquivos
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Lista de arquivos selecionados */}
        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Arquivos Selecionados ({selectedFiles.length})</h4>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Total: {getTotalSize()} MB
                </span>
                <Button variant="outline" size="sm" onClick={clearAllFiles}>
                  Limpar Todos
                </Button>
              </div>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-primary" />
                    <div>
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-muted-foreground block">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={isProcessing}
                    className="hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botão de processamento */}
        <Button
          onClick={onProcessFiles}
          disabled={selectedFiles.length === 0 || isProcessing}
          className="w-full h-12 text-base font-medium transition-all duration-200 hover:scale-[1.02]"
          size="lg"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
              Processando {selectedFiles.length} arquivo(s)...
            </>
          ) : (
            <>
              <FileText className="h-5 w-5 mr-2" />
              Processar {selectedFiles.length} Arquivo(s)
            </>
          )}
        </Button>

        {/* Dicas de uso */}
        {selectedFiles.length === 0 && (
          <div className="text-center text-sm text-muted-foreground">
            <p>💡 Dica: Você pode selecionar múltiplos arquivos PDF de uma vez</p>
            <p>📋 Os arquivos devem ser folhas de ponto no formato padrão</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
