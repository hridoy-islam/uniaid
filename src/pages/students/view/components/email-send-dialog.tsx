import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import axiosInstance from '@/lib/axios';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useParams } from 'react-router-dom';

const formSchema = z.object({
  emailConfigId: z.string(),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required')
});

export function EmailSendDialog({ open, onOpenChange, onSend }) {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [emailConfigs, setEmailConfigs] = useState<any[]>([]); // For "To" options
  const [emailDrafts, setEmailDrafts] = useState<any[]>([]); // For draft options
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const {id} = useParams();

  useEffect(() => {
    const fetchEmail = async () => {
      if (!id) return;

      try {
        const response = await axiosInstance.get(`/students/${id}`);
        setEmail(response?.data?.data?.email); 
      } catch (error) {
        console.error('Error fetching email:', error);
      }
    };

    if (open) {
      fetchEmail();
    }
  }, [id, open]);


  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emailConfigId: '',
      subject: '',
      body: '',
      draftId: '' // Initialize draftId
    }
  });

  const handleDraftChange = (draftId: string) => {
    const selectedDraft = emailDrafts.find((draft) => draft._id === draftId);

    if (selectedDraft) {
      form.setValue('subject', selectedDraft.subject || '');
      form.setValue('body', selectedDraft.body || '');
      form.setValue('draftId', draftId); // Set draftId in the form state
    }
  };

  const handleSubmit = (values: z.infer<typeof formSchema>) => {

    const payload = {
      emailConfigId: values.emailConfigId,
      subject: values.subject,
      body: values.body,
      emailDraft: form.getValues("draftId"),
      to:email,
      Emails: [email]
    }

    onSend(payload);
    form.reset();
    setAttachments([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [emailConfigResponse, emailDraftResponse] = await Promise.all([
          axiosInstance.get('/email-configs?limit=all'),
          axiosInstance.get('/email-drafts?limit=all')
        ]);
        setEmailConfigs(emailConfigResponse.data.data.result);
        setEmailDrafts(emailDraftResponse.data.data.result);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>
            Fill in the details below to send your email.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormItem>
              <FormLabel>From</FormLabel>
              <Select onValueChange={(value) => form.setValue('emailConfigId', value)}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Email" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {emailConfigs.map((config) => (
                    <SelectItem key={config._id} value={config._id}>
                      {config.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
            <FormItem>
              <FormLabel>Draft</FormLabel>
              <Select value={form.watch('draftId')} onValueChange={handleDraftChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a draft" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {emailDrafts.map((draft) => (
                    <SelectItem key={draft._id} value={draft._id}>{draft.subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter email subject" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter email body"
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Attachments</FormLabel>
              <FormControl>
                <Input type="file" multiple onChange={handleFileChange} />
              </FormControl>
            </FormItem>
            <DialogFooter>
              <Button
                type="submit"
                className="bg-supperagent text-white hover:bg-supperagent/90"
              >
                Send Email
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
