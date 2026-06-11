import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, X, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  bucket?: string;
  folder?: string;
  isFolderSelect?: boolean;
}

export function ImageUpload({ value, onChange, label, bucket = "banners-reviva", folder = "campaigns", isFolderSelect = false }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [showGoogleDriveHelp, setShowGoogleDriveHelp] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      onChange(data.publicUrl);
      toast.success("Imagem enviada com sucesso!");
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
      console.error(error);
    } finally {
      setUploading(false);
    }
  }

  function handleGoogleDriveUrl(url: string) {
    if (isFolderSelect) {
      // Se for seleção de pasta, apenas salva a URL da pasta
      if (url.includes("drive.google.com/drive/folders/")) {
        onChange(url);
        toast.success("Pasta do Google Drive vinculada!");
        setShowGoogleDriveHelp(false);
      } else {
        toast.error("URL da pasta do Google Drive inválida.");
      }
      return;
    }

    // Converter URL compartilhada do Google Drive em URL de imagem pública
    // Padrão: https://drive.google.com/open?id=FILE_ID ou https://drive.google.com/file/d/FILE_ID/view
    const match = url.match(/[?&]id=([a-zA-Z0-9-_]+)/) || url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      const fileId = match[1];
      const publicUrl = `https://lh3.googleusercontent.com/u/0/d/${fileId}=w1000`;
      onChange(publicUrl);
      toast.success("URL do Google Drive vinculada!");
      setShowGoogleDriveHelp(false);
    } else {
      toast.error("URL do Google Drive inválida. Verifique o formato.");
    }
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      
      {/* URL Input */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Input 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            placeholder={isFolderSelect ? "URL da pasta do Google Drive" : "https://... ou faça upload"} 
          />
        </div>
        
        {/* Upload Button */}
        <div className="relative">
          {!isFolderSelect && (
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              className="w-full sm:w-auto"
              asChild
            >
              <label className="cursor-pointer">
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {uploading ? "Enviando..." : "Upload"}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            </Button>
          )}
        </div>

        {/* Google Drive Help Button */}
        <Dialog open={showGoogleDriveHelp} onOpenChange={setShowGoogleDriveHelp}>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="icon" title="Usar Google Drive">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isFolderSelect ? "Vincular Pasta do Google Drive" : "Usar imagem do Google Drive"}</DialogTitle>
              <DialogDescription>
                {isFolderSelect 
                  ? "Cole aqui a URL da pasta pública do Google Drive da Associação Reviva"
                  : "Cole aqui uma imagem compartilhada do Google Drive da Associação Reviva"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="drive-url">URL do Google Drive</Label>
                <Input
                  id="drive-url"
                  placeholder={isFolderSelect ? "https://drive.google.com/drive/folders/..." : "https://drive.google.com/open?id=..."}

                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      const input = e.currentTarget;
                      handleGoogleDriveUrl(input.value);
                    }
                  }}
                />
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
                <p className="font-semibold mb-2">Como obter a URL:</p>
                <ol className="list-inside list-decimal space-y-1 text-xs">
                  {isFolderSelect ? (
                    <>
                      <li>Abra a pasta no Google Drive</li>
                      <li>Clique em "Compartilhar"</li>
                      <li>Defina como "Qualquer pessoa com o link pode visualizar"</li>
                      <li>Copie o link da barra de endereços</li>
                    </>
                  ) : (
                    <>
                      <li>Abra o arquivo no Google Drive</li>
                      <li>Clique em "Compartilhar"</li>
                      <li>Defina como "Qualquer pessoa com o link pode visualizar"</li>
                      <li>Copie o link gerado</li>
                    </>
                  )}
                  <li>Cole aqui e pressione Enter</li>
                </ol>
              </div>
              <Button 
                onClick={(e) => {
                  const input = (e.target as HTMLElement).parentElement?.querySelector("input") as HTMLInputElement;
                  if (input) handleGoogleDriveUrl(input.value);
                }}
                className="w-full"
              >
                Confirmar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {value && !isFolderSelect && (
        <div className="relative mt-2 aspect-video w-full max-w-sm overflow-hidden rounded-lg border border-border bg-secondary">
          <img src={value} alt="Preview" className="h-full w-full object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 h-7 w-7"
            onClick={() => onChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
