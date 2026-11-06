import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import AuthLayout from '@/pages/auth/components/auth-layout';
import { changePassword } from '@/redux/features/authSlice';
import { AppDispatch } from '@/redux/store';
import { useRouter } from '@/routes/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';

import { Link } from 'react-router-dom';
import { z } from 'zod';

const formSchema = z.object({
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' })
});

type UserFormValue = z.infer<typeof formSchema>;

export default function NewPassword() {
  const { loading } = useSelector((state: any) => state.auth);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const defaultValues = {
    password: '',
    confirmPassword: ''
  };
  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const onSubmit = async (data: UserFormValue) => {
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    const userData = JSON.parse(localStorage.getItem('tp_user_data'));
    // console.log({token: userData.token, password: data.password, userId: userData._id });
    const result: any = await dispatch(
      changePassword({
        token: userData.token,
        password: data.password,
        userId: userData._id
      })
    );
    if (result?.payload?.success) {
      localStorage.removeItem('tp_user_data');
      localStorage.removeItem('tp_otp_email');
      setSuccess(true);
    } else {
      setError(result?.payload || 'Something went wrong');
    }
  };

  useEffect(() => {
    if (localStorage.getItem('tp_user_data') === null) router.push('/login');
  }, []);

  if (success) {
    return (
      <AuthLayout title="Password Updated">
        <div className="space-y-6">
          <Alert className="border-teal-200 bg-teal-50 text-black [&>svg]:text-teal-600">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle className="font-semibold text-teal-700">
              Password changed successfully
            </AlertTitle>
            <AlertDescription>
              You can now sign in with your new password.
            </AlertDescription>
          </Alert>
          <Button
            asChild
            className="w-full bg-teal-600 text-white hover:bg-teal-600/90"
          >
            <Link to="/login">Go to Login</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="New Password"
      description="Enter your new password to login."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password..."
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirm your password..."
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            disabled={loading}
            className="w-full bg-teal-600 text-white hover:bg-teal-600/90"
            type="submit"
          >
            Submit
          </Button>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <p className="text-center text-sm text-black">
            <Link to="/login" className="text-teal-600 hover:text-teal-500">
              Back to sign in
            </Link>
          </p>
        </form>
      </Form>
    </AuthLayout>
  );
}
