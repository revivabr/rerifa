import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  bucket?: string;
  folder?: string;
}

export function ImageUpload({ value, onChange, label, bucket = "banners-reviva", folder = "campaigns" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

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

      const { data } = await supabase.storage.from(bucket).createSignedUrl(filePath, 31536000); // 1 year expiry
      onChange(data?.signedUrl || "");
      toast.success("Imagem enviada com sucesso!");
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
      console.error(error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Input 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            placeholder="Cole a URL ou faça upload" 
          />
        </div>
        
        <div className="relative">
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
        </div>
      </div>

      {value && (
        <div className="relative mt-2 aspect-video w-full max-w-sm overflow-hidden rounded-lg border border-border bg-secondary">
          <img 
            src={value} 
            alt="Preview" 
            className="h-full w-full object-cover"
            onError={(e) => {
              console.error("Image failed to load:", value);
            }}
          />
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
