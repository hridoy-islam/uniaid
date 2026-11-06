import { HTMLAttributes } from 'react';
import { useForm } from 'react-hook-form';
import axiosInstance from '../../../lib/axios';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/routes/hooks';
import { useToast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().trim().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Enter a valid email address' }),
  phone: z.string(),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' })
});

type SignUpFormValue = z.infer<typeof formSchema>;

interface SignUpFormProps extends HTMLAttributes<HTMLDivElement> {}

export function SignUpForm({ className, ...props }: SignUpFormProps) {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<SignUpFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: ''
    }
  });

  async function onSubmit(data: SignUpFormValue) {
    try {
      const result = await axiosInstance.post(`/auth/signup`, {
        ...data,
        role: 'agent'
      });
      if (result?.data?.success) {
        toast({
          title: 'Account Created',
          description: 'You have successfully created an account'
        });
        router.push('/login');
      } else {
        toast({
          title: 'Error',
          description: result.data.message || 'Something went wrong',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('API Error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Server not reachable',
        variant: 'destructive'
      });
    }
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Your Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Phone" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              className="mt-2 bg-teal-600 text-white hover:bg-teal-600/90"
              type="submit"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
