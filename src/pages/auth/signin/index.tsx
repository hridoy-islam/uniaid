import { Layers } from 'lucide-react';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import UserAuthForm from './components/user-auth-form';

export default function SignInPage() {
  const { user } = useSelector((state: any) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/admin'); // Adjust the path as needed
    }
  }, [user, navigate]);

  return (
    <div className="flex min-h-screen">
      {/* Left Section */}
      <div className="relative hidden w-1/2 bg-supperagent lg:block">
        <div className="flex h-full flex-col gap-60 p-8">
          {/* Logo */}
          <div className="flex items-center gap-2 text-white">
            <Layers className="h-6 w-6" />
            <span className="text-lg font-semibold">Recruitment</span>
          </div>

          {/* Main Content */}
          <div className="relative z-10 mb-20">
            <div className="mb-8">
              <img
                src="/illustration.svg?height=300&width=400"
                alt="Desk illustration"
                width={400}
                height={300}
              />
            </div>
            <h1 className="mb-4 text-4xl font-bold text-white">
              A few more clicks to <br />
              sign in to your account.
            </h1>
            <p className="text-lg text-gray-300">
              Manage all your admission accounts in one place.
            </p>
          </div>
        </div>

        {/* Curved Edge */}
        <div
          className="absolute right-0 top-0 h-full w-32 bg-supperagent"
          style={{
            clipPath:
              'polygon(100% 0, 0% 0, 0 100%, 100% 100%, 100% 0, 100% 0, 0 100%, 0 100%)',
            background: `linear-gradient(to right,  0%, transparent 100%)`
          }}
        />
      </div>

      {/* Right Section */}
      <div className="flex w-full items-center justify-center bg-gray-50 px-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="mb-10">
            <h2 className="text-3xl font-bold">Sign In</h2>
          </div>

          <UserAuthForm />
        </div>
      </div>
    </div>
  );
}
