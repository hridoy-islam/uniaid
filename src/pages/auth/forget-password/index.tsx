import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { requestOtp } from '@/redux/features/authSlice';
import { AppDispatch } from '@/redux/store';
import { useRouter } from '@/routes/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';

import { Link } from 'react-router-dom';
import { z } from 'zod';
import AuthLayout from '../components/auth-layout';

const formSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' })
});

type UserFormValue = z.infer<typeof formSchema>;

export default function ForgotPassword() {
  const [error, setError] = useState('');
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' }
  });
  const { isSubmitting } = form.formState;

  const onSubmit = async (data: UserFormValue) => {
    setError('');
    const result: any = await dispatch(requestOtp(data));
    if (result?.payload?.success) {
      localStorage.setItem('tp_otp_email', data.email);
      router.push('/otp');
    } else {
      setError(result?.payload || 'Something went wrong');
    }
  };

  return (
    <AuthLayout
      title="Forgot Password"
      description="Enter your registered email and we will send you a code to reset your password."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email..."
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            disabled={isSubmitting}
            className="w-full bg-teal-600 text-white hover:bg-teal-600/90"
            type="submit"
          >
            {isSubmitting ? 'Sending...' : 'Reset Password'}
          </Button>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <p className="text-center text-sm text-black">
            Remembered your password?{' '}
            <Link to="/login" className="text-teal-600 hover:text-teal-500">
              Sign In
            </Link>
          </p>
        </form>
      </Form>
    </AuthLayout>
  );
}
