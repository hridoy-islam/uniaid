import { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ImageUploader } from '@/components/shared/image-uploader';
import moment from 'moment';
import axios from 'axios';

export function StudentProfile({ student, fetchStudent }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  



  useEffect(() => {
    if (!uploadOpen) {
      fetchStudent; 
    }
  }, [uploadOpen]); 

  const handleUploadComplete = (data) => {
    
    setUploadOpen(false); // Close the upload dialog
    fetchStudent; // Re-fetch student data after upload completes
  };
  return (
    <Card className="border-0 shadow-none">
      <CardContent className="grid grid-cols-[auto,1fr,1fr] gap-6 p-6">
        <div className="relative">
          <div className="relative h-48 w-48 overflow-hidden rounded-full">
            <img
              src={
                student?.imageUrl ||
                'https://kzmjkvje8tr2ra724fhh.lite.vusercontent.net/placeholder.svg'
              }
              alt={`${student?.firstName} ${student?.lastName}`}
              className="h-full w-full object-cover"
            />
            <Button
              size="icon"
              className="absolute bottom-2 right-7 rounded-full"
              onClick={() => setUploadOpen(true)}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">
              {student?.title} {student?.firstName} {student?.lastName}
            </h2>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm text-muted-foreground">
                {student?.email}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Phone:</span>
              <span className="text-sm text-muted-foreground">
                {student?.phone}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Date of Birth:</span>
              <span className="text-sm text-muted-foreground">
                {moment(student?.dob).format('DD-MM-YYYY')}
                {/* {student?.dob} */}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Address</h3>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <p>{student?.addressLine1}</p>
              <p>{student?.addressLine2}</p>
              <p>{student?.state}</p>
              <p>{student?.postCode}</p>
              <p>{student?.country}</p>
            </div>
          </div>
        </div>
      </CardContent>

      <ImageUploader
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploadComplete={handleUploadComplete}
        studentId={student?._id}
      />
    </Card>
  );
}
