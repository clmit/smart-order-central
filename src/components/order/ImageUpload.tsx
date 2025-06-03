
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import heic2any from 'heic2any';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  currentImage?: string;
}

export const ImageUpload = ({ onImageUploaded, currentImage }: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Check if the file is a HEIC image
      const isHeic = file.type === 'image/heic' || 
                    file.type === 'image/heif' || 
                    file.name.toLowerCase().endsWith('.heic') || 
                    file.name.toLowerCase().endsWith('.heif');

      let uploadFile: File = file;

      // Convert HEIC to JPEG if necessary
      if (isHeic) {
        toast({
          title: 'Конвертация HEIC изображения',
          description: 'Пожалуйста, подождите...',
        });
        
        try {
          const jpegBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.8
          }) as Blob;
          
          uploadFile = new File([jpegBlob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
            type: 'image/jpeg'
          });
        } catch (conversionError) {
          console.error('Error converting HEIC to JPEG:', conversionError);
          toast({
            title: 'Ошибка конвертации',
            description: 'Не удалось конвертировать HEIC файл',
            variant: 'destructive',
          });
          setIsUploading(false);
          return;
        }
      }

      // Create a preview for the image
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(uploadFile);

      // Generate a unique filename
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `product-photos/${fileName}`;

      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('product-photos')
        .upload(filePath, uploadFile);

      if (error) {
        throw error;
      }

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('product-photos')
        .getPublicUrl(filePath);

      // Pass the URL back to the parent component
      onImageUploaded(publicUrl);

      toast({
        title: 'Фото загружено',
        description: 'Фото товара успешно загружено',
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Ошибка загрузки',
        description: error instanceof Error ? error.message : 'Не удалось загрузить фото',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
    onImageUploaded('');
  };

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative">
          <img 
            src={preview} 
            alt="Превью фото товара" 
            className="object-cover w-full h-40 rounded-md" 
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed rounded-md flex flex-col items-center justify-center h-40 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Загрузить фото товара</p>
          <p className="text-xs text-muted-foreground">Поддерживаются JPG, PNG и HEIC</p>
        </div>
      )}
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/heic,image/heif"
        className="hidden"
        disabled={isUploading}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <>Загрузка...</>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            {preview ? 'Выбрать другой файл' : 'Выбрать файл'}
          </>
        )}
      </Button>
    </div>
  );
};

export default ImageUpload;
