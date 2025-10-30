import { Layers } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left Section */}
      <div className="relative hidden w-1/2 bg-supperagent lg:block">
        <div className="flex h-full flex-col gap-60 p-8">
          {/* Logo */}
          <div className="flex items-center gap-2 text-white">
            <Layers className="h-6 w-6" />
            <span className="text-lg font-semibold">Allied Nexus</span>
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
            background:
              'linear-gradient(to right, #0d9488 0%, transparent 100%)'
          }}
        />
      </div>

      {/* Right Section */}
      <div className="flex w-full items-center justify-center bg-gray-50 px-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="mb-10">
            <h2 className="text-3xl font-bold">Sign In</h2>
          </div>

          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                type="text"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                placeholder="Enter your password"
                type="password"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </label>
              </div>

              <Link
                to="/forgot-password"
                className="text-sm text-supperagent hover:text-supperagent"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-supperagent text-white hover:bg-supperagent/90"
            >
              Login
            </Button>

            <p className="text-center text-sm text-gray-600">
              By signin up, you agree to our{' '}
              <Link
                to="/terms"
                className="text-supperagent hover:text-supperagent"
              >
                Terms and Conditions
              </Link>{' '}
              &{' '}
              <Link
                to="/privacy"
                className="text-supperagent hover:text-supperagent"
              >
                Privacy Policy
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
