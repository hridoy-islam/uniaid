import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { mockData } from '@/types';
import axiosInstance from '@/lib/axios';

export function DocumentDialog({
  open,
  onOpenChange,
  onSubmit,
  entityId // This could be student ID or any other initial data passed
}) {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [customType, setCustomType] = useState<string>(''); // New state for custom type description

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !type) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('entityId', entityId); // Assuming inititalData is the student ID
    formData.append(
      'file_type',
      type === 'Other' ? customType : type.toLowerCase()
    );
    formData.append('file', file); // 'files' is expected as an array

    try {
      await axiosInstance.post('/documents', formData, {
        // headers: {
        //   'Content-Type': 'multipart/form-data',
        //   'x-company-token': import.meta.env.VITE_COMPANY_TOKEN
        // },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent?.total
          );
          setUploadProgress(percentCompleted);
        }
      });

      onSubmit(); // Notify parent to refetch data after successful upload
      onOpenChange(false); // Close dialog after submission
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {mockData.DocumentType.map((type, idx) => (
                  <SelectItem key={idx} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {type === 'Other' && (
              <Input
                type="text"
                placeholder="Describe the document type"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
              />
            )}
          </div>
          <div className="space-y-2">
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-center text-sm text-muted-foreground">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !file ||
                !type ||
                isUploading ||
                (type === 'Other' && !customType)
              }
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
