import { Toaster } from '@/components/ui/toaster';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/auth-layout';
import { SignUpForm } from '../components/sign-up-form';

export default function SignUpPage() {
  return (
    <>
      <AuthLayout
        title="Sign Up"
        description={
          <>
            Already have an account?{' '}
            <Link to="/login" className="text-teal-600 hover:text-teal-500">
              Sign In
            </Link>
          </>
        }
      >
        <SignUpForm />
        <p className="text-center text-sm text-black">
          By creating an account, you agree to our{' '}
          <a href="/terms" className="text-teal-600 hover:text-teal-500">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-teal-600 hover:text-teal-500">
            Privacy Policy
          </a>
          .
        </p>
      </AuthLayout>
      <Toaster />
    </>
  );
}
