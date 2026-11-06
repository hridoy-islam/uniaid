import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { requestOtp, validateRequestOtp } from '@/redux/features/authSlice';
import { AppDispatch } from '@/redux/store';
import { useRouter } from '@/routes/hooks';
import { jwtDecode } from 'jwt-decode';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { Link } from 'react-router-dom';
import AuthLayout from '../components/auth-layout';

const VERIFY_FAILED = 'Verification failed';
const RESEND_FAILED = 'Unable to send a new code';

export default function Otp() {
  const [otp, setOtp] = useState(Array(4).fill(''));
  const [error, setError] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const inputRefs = useRef([]);
  const router = useRouter();
  // Read once: the key can be removed while this page is open (e.g. another tab)
  const [email] = useState(() => localStorage.getItem('tp_otp_email'));

  // useEffect(() => {
  //   if (!email) router.push('/forgot-password');
  // }, []);

  const handleKeyDown = (e) => {
    if (
      !/^[0-9]{1}$/.test(e.key) &&
      e.key !== 'Backspace' &&
      e.key !== 'Delete' &&
      e.key !== 'Tab' &&
      !e.metaKey &&
      !e.ctrlKey
    ) {
      e.preventDefault();
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      setError(null);
      const index = inputRefs.current.indexOf(e.target);
      // Clear this box, or step back when it is already empty
      const clearIndex = otp[index] || index === 0 ? index : index - 1;
      setOtp((prevOtp) =>
        prevOtp.map((digit, i) => (i === clearIndex ? '' : digit))
      );
      inputRefs.current[clearIndex].focus();
    }
  };

  const handleInput = (e) => {
    const { target } = e;
    const index = inputRefs.current.indexOf(target);
    if (target.value) {
      setError(null);
      setOtp((prevOtp) => [
        ...prevOtp.slice(0, index),
        target.value,
        ...prevOtp.slice(index + 1)
      ]);
      if (index < otp.length - 1) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleFocus = (e) => {
    e.target.select();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    if (!new RegExp(`^[0-9]{${otp.length}}$`).test(text)) {
      return;
    }
    const digits = text.split('');
    setError(null);
    setOtp(digits);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    setError(null);
    setMessage('');
    setSubmitting(true);
    const result: any = await dispatch(
      validateRequestOtp({ email, otp: otpCode })
    );
    setSubmitting(false);
    if (result?.payload?.success) {
      const decoded = jwtDecode(result?.payload?.data?.resetToken);
      localStorage.setItem(
        'tp_user_data',
        JSON.stringify({ ...decoded, token: result?.payload?.data?.resetToken })
      );
      router.push('/new-password');
    } else {
      setError({
        title: VERIFY_FAILED,
        description:
          result?.payload ||
          'We could not verify your code. Please try again.'
      });
    }
  };

  const handleResend = async () => {
    setError(null);
    setMessage('');
    setResending(true);
    const result: any = await dispatch(requestOtp({ email }));
    setResending(false);
    if (result?.payload?.success) {
      setOtp(Array(4).fill(''));
      setMessage('A new verification code has been sent to your email.');
    } else {
      setError({
        title: RESEND_FAILED,
        description: result?.payload || 'Please try again in a moment.'
      });
    }
  };

  return (
    <AuthLayout
      title="Verification Code"
      description="Enter the verification code sent to your email."
    >
      <div className="space-y-6">

       

        <form id="otp-form" className="flex justify-between gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              maxLength={1}
              value={digit}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onPaste={handlePaste}
              ref={(el) => (inputRefs.current[index] = el)}
              aria-invalid={error?.title === VERIFY_FAILED}
              className={`flex w-full items-center justify-center rounded-lg border bg-white p-2 text-center text-2xl font-medium text-black outline-none sm:text-4xl ${
                error?.title === VERIFY_FAILED
                  ? 'border-red-500'
                  : 'border-black/20'
              }`}
            />
          ))}
        </form>

        <Button
          disabled={submitting || otp.some((digit) => digit === '')}
          onClick={handleOtpSubmit}
          className="w-full bg-teal-600 text-white hover:bg-teal-600/90"
        >
          {submitting ? 'Verifying...' : 'Verify OTP'}
        </Button>
        {error && (
          <Alert className="border-red-200 bg-red-50 text-black [&>svg]:text-red-600">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-semibold text-red-700">
              {error.title}
            </AlertTitle>
            <AlertDescription>{error.description}</AlertDescription>
          </Alert>
        )}
        <p className="text-center text-sm text-black">
          Didn't get the code?{' '}
          <button
            type="button"
            disabled={resending}
            onClick={handleResend}
            className="text-teal-600 hover:text-teal-500 disabled:opacity-50"
          >
            {resending ? 'Sending...' : 'Resend code'}
          </button>
        </p>
        <p className="text-center text-sm text-black">
          <Link to="/login" className="text-teal-600 hover:text-teal-500">
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
