import { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  selectedImage: File | null;
  title: string;
  description: string;
  className?: string;
}

export const ImageUpload = ({ onImageSelect, selectedImage, title, description, className }: ImageUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      onImageSelect(imageFile);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(imageFile);
    }
  }, [onImageSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, [onImageSelect]);

  const clearImage = useCallback(() => {
    setPreview(null);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-all duration-300",
          "bg-gradient-card backdrop-blur-sm shadow-card",
          "hover:shadow-ai hover:border-primary/50",
          isDragOver ? "border-primary bg-primary/5" : "border-border",
          preview ? "border-primary/30" : ""
        )}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
      >
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-64 object-cover rounded-lg"
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 p-1 bg-destructive/80 hover:bg-destructive rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-destructive-foreground" />
            </button>
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-sm text-white">
              {selectedImage?.name}
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-gradient-ai rounded-full shadow-ai">
                <Upload className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{description}</p>
              <label className="inline-flex items-center px-4 py-2 bg-gradient-ai text-white rounded-lg cursor-pointer hover:shadow-glow transition-all duration-300 font-medium">
                <ImageIcon className="w-4 h-4 mr-2" />
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};