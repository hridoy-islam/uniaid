import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  loginUser,
  resetError
} from '@/redux/features/authSlice';
import { AppDispatch } from '@/redux/store';
import { useRouter } from '@/routes/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import * as z from 'zod';

const formSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' }),
  password: z.string()
});

type UserFormValue = z.infer<typeof formSchema>;

// "Remember me" keeps the email filled in for the next sign in
const REMEMBERED_EMAIL_KEY = 'uniaid_remembered_email';

export default function UserAuthForm() {
  const router = useRouter();
  const { loading, error } = useSelector((state: any) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
  const [remember, setRemember] = useState(!!rememberedEmail);
  const defaultValues = {
    email: rememberedEmail,
    password: ''
  };
  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const onSubmit = async (data: UserFormValue) => {
    const result: any = await dispatch(loginUser(data));
    if (result?.payload?.success) {
      if (remember) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, data.email);
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
      router.push('/admin');
    }
  };

  useEffect(() => {
    // Reset the error when the component mounts
    dispatch(resetError());
  }, [dispatch]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
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
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
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
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked === true)}
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Remember me
              </label>
            </div>

            <Link
              to="/forgot-password"
              className="text-sm text-teal-600 hover:text-teal-500"
            >
              Forgot Password?
            </Link>
          </div>

          <Button disabled={loading} type="submit" className="w-full text-white bg-teal-600 hover:bg-teal-600/90">
            Login
          </Button>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <p className="text-center text-sm text-black">
            Don't have an account?{' '}
            <Link to="/signup" className="text-teal-600 hover:text-teal-500">
              Sign up
            </Link>
          </p>
          <p className="text-center text-sm text-black">
            By signin up, you agree to our{" "}
            <Link to="/terms" className="text-teal-600 hover:text-teal-500">
              Terms and Conditions
            </Link>{" "}
            &{" "}
            <Link to="/privacy" className="text-teal-600 hover:text-teal-500">
              Privacy Policy
            </Link>
          </p>
        </form>
      </Form>
    </>
  );
}
