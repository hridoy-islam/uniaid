import { Toaster } from '@/components/ui/toaster';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth-layout';
import UserAuthForm from './components/user-auth-form';

export default function SignInPage() {
  const { user } = useSelector((state: any) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Teachers land straight on their own slots
      navigate(user.role === 'teacher' ? '/admin/my-slots' : '/admin');
    }
  }, [user, navigate]);

  return (
    <>
      <AuthLayout title="Sign In">
        <UserAuthForm />
      </AuthLayout>
      {/* Shows the "Account Created" toast after sign up */}
      <Toaster />
    </>
  );
}
