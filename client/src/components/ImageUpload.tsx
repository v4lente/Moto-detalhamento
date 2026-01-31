import { useState, useRef, useEffect, useId, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, X, Loader2, Crop } from "lucide-react";
import ReactCrop, { centerCrop, makeAspectCrop, type Crop as CropType, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
  aspectRatio?: number;
}

function getCroppedImg(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  
  const cropX = Math.round(crop.x * scaleX);
  const cropY = Math.round(crop.y * scaleY);
  const cropWidth = Math.round(crop.width * scaleX);
  const cropHeight = Math.round(crop.height * scaleY);
  
  canvas.width = cropWidth;
  canvas.height = cropHeight;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No 2d context");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.92
    );
  });
}

export function ImageUpload({ value, onChange, className, aspectRatio }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    const newCrop: CropType = {
      unit: "%",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    };
    
    setCrop(newCrop);
    
    setCompletedCrop({
      x: 0,
      y: 0,
      width: width,
      height: height,
      unit: "px",
    });
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOriginalFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleCropConfirm = async () => {
    if (!imgRef.current || !completedCrop || !originalFile) return;

    setIsConfirming(true);
    setIsUploading(true);
    setCropDialogOpen(false);

    try {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
      const croppedFile = new File([croppedBlob], originalFile.name, { type: "image/jpeg" });

      const response = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: croppedFile.name,
          size: croppedFile.size,
          contentType: croppedFile.type,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao obter URL de upload");
      }

      const { uploadURL, objectPath } = await response.json();

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: croppedFile,
        headers: { "Content-Type": croppedFile.type },
      });

      if (!uploadResponse.ok) {
        throw new Error("Falha ao enviar arquivo");
      }

      setPreview(objectPath);
      onChange(objectPath);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload da imagem");
    } finally {
      setIsUploading(false);
      setIsConfirming(false);
      setImageSrc(null);
      setOriginalFile(null);
    }
  };

  const handleCropCancel = () => {
    if (isConfirming) return;
    setCropDialogOpen(false);
    setImageSrc(null);
    setOriginalFile(null);
  };

  const handleDialogChange = (open: boolean) => {
    if (!open && !isConfirming) {
      handleCropCancel();
    }
  };

  const handleClear = () => {
    setPreview(null);
    onChange("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id={inputId}
      />
      
      {preview ? (
        <div className="relative">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-32 object-contain rounded-lg border border-border bg-black/20"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full h-32 border-dashed"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm">Enviando...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Clique para enviar imagem</span>
            </div>
          )}
        </Button>
      )}

      <Dialog open={cropDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-2xl bg-card border-primary/20" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <Crop className="h-5 w-5" />
              Recortar Imagem
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex justify-center py-4 max-h-[60vh] overflow-auto">
            {imageSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                className="max-w-full"
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop"
                  onLoad={onImageLoad}
                  style={{ maxHeight: "50vh" }}
                />
              </ReactCrop>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleCropCancel}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              className="bg-primary text-black hover:bg-primary/90"
              onClick={handleCropConfirm}
              disabled={!completedCrop}
            >
              Confirmar Recorte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
