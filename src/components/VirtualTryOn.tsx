import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "./ImageUpload";
import { Download, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const VirtualTryOn = () => {
  const [userImage, setUserImage] = useState<File | null>(null);
  const [clothingImage, setClothingImage] = useState<File | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleWearMeUp = async () => {
    if (!userImage || !clothingImage) {
      toast.error("Please upload both user photo and clothing image");
      return;
    }

    setIsProcessing(true);
    try {
      // Convert images to base64
      const userImageData = await fileToBase64(userImage);
      const clothingImageData = await fileToBase64(clothingImage);

      // Call Supabase edge function
      const { data, error } = await supabase.functions.invoke('virtual-tryon', {
        body: {
          userImageData,
          clothingImageData,
          userImageType: userImage.type,
          clothingImageType: clothingImage.type
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.imageUrl) {
        setResultImage(data.imageUrl);
        toast.success("Virtual try-on complete! 🎉");
      } else if (data?.error) {
        // Handle specific error types from the edge function
        if (data.error === 'PROHIBITED_CONTENT') {
          toast.error("Content blocked by AI safety filters. Please try different images that clearly show a person and clothing item.");
        } else if (data.userMessage) {
          toast.error(data.userMessage);
        } else {
          toast.error(data.message || "Failed to process virtual try-on");
        }
        return;
      } else {
        throw new Error("No image returned from processing");
      }
    } catch (error) {
      console.error('Virtual try-on error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to process virtual try-on");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = 'virtual-try-on-result.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Image downloaded!");
  };

  const canProcess = userImage && clothingImage && !isProcessing;

  return (
    <div className="min-h-screen bg-gradient-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-ai bg-clip-text text-transparent mb-4">
            AI Virtual Try-On
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your photo and a clothing item, then let AI magic dress you up instantly
          </p>
        </div>


        <div className="grid lg:grid-cols-3 gap-8">
          {/* User Photo Upload */}
          <div className="space-y-4">
            <ImageUpload
              onImageSelect={setUserImage}
              selectedImage={userImage}
              title="Your Photo"
              description="Upload a clear photo of yourself"
            />
          </div>

          {/* Clothing Upload */}
          <div className="space-y-4">
            <ImageUpload
              onImageSelect={setClothingImage}
              selectedImage={clothingImage}
              title="Clothing Item"
              description="Upload the clothing you want to try on"
            />
          </div>

          {/* Result */}
          <div className="space-y-4">
            <div className="relative border-2 border-dashed rounded-xl p-8 bg-gradient-card backdrop-blur-sm shadow-card border-border min-h-[400px] flex flex-col">
              {isProcessing ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-gradient-ai rounded-full flex items-center justify-center animate-pulse">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">AI is working its magic...</h3>
                      <p className="text-sm text-muted-foreground">This may take a few moments</p>
                    </div>
                  </div>
                </div>
              ) : resultImage ? (
                <div className="flex-1">
                  <img
                    src={resultImage}
                    alt="Virtual try-on result"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="mt-4">
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Result
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-muted/20 rounded-full flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Result Preview</h3>
                      <p className="text-sm text-muted-foreground">Your AI-generated result will appear here</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center mt-8">
          <Button
            onClick={handleWearMeUp}
            disabled={!canProcess}
            size="lg"
            className="bg-gradient-ai hover:shadow-glow transition-all duration-300 text-white font-semibold px-8 py-4 text-lg"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {isProcessing ? "Processing..." : "Wear Me Up!"}
          </Button>
        </div>

      </div>
    </div>
  );
};