import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmailSendDialog } from './email-send-dialog';
import { EmailLogTable } from './email-log-table';
import axiosInstance from '@/lib/axios';
import { useParams } from 'react-router-dom';

export function SendEmailComponent({ student}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [emailLogs, setEmailLogs] = useState<any>([]);
  const {id} = useParams();


  const handleSendEmail = async (payload) => {
    try {
      const emailData = { ...payload, studentId: id, emails: [student.email] };

     
      const logResponse = await axiosInstance.post(`/email-logs`, emailData);
      const logId = logResponse.data?.data?._id; 

      
      await axiosInstance.post(`/email-send`, emailData);

      if (logId) {
        await axiosInstance.patch(`/email-logs/${logId}`, { status: "sent" });
      }

      fetchData(); 
    } catch (error) {
      console.error("Error sending email:", error);
    }
    setIsDialogOpen(false);
  };

  const fetchData = async () => {
      try {
        const response = await axiosInstance.get(
          `/email-logs`,{
      params: { studentId: id }, 
    }

        );
        setEmailLogs(response.data.data.result);
      } catch (error) {
        console.error('Error fetching notes:', error);
      }
    };
  
    useEffect(() => {
      fetchData();
    }, [student,id]);

  return (
    <div className="space-y-4 rounded-md p-4 shadow-md">
      <div className="flex justify-between">
        <h2 className="mb-4 text-xl font-semibold">Email Logs</h2>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="flex justify-end bg-supperagent text-white hover:bg-supperagent/90"
        >
          Send Email
        </Button>
      </div>
      
      <EmailSendDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSend={handleSendEmail}
      />
      <EmailLogTable logs={emailLogs} />
    </div>
  );
}
