'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await login(email.trim(), password);
      
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo and Title */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <img
                src="https://admin.chosen-international.com/public/assets/logo/ChosenLogo.svg"
                alt="CHOSEN Logo"
                className="w-24 h-24 mx-auto object-contain"
              />
            </div>
            <h1 
              className="text-4xl font-bold tracking-tight text-black mb-2"
              style={{ fontFamily: 'Avenir, -apple-system, BlinkMacSystemFont, sans-serif' }}
            >
              CHOSEN
            </h1>
            <p className="text-gray-600 text-sm">
              Admin Portal
            </p>
          </div>

          {/* Login Card */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive" className="border-red-300 bg-red-50">
                    <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
                  </Alert>
                )}
                
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-black text-sm">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="h-10 border-gray-300 focus:border-black"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-black text-sm">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 border-gray-300 focus:border-black"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  className="w-full h-10 bg-black text-white hover:bg-gray-900 mt-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 px-4">
        <div className="text-center space-y-1">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} CHOSEN International
          </p>
          {/* <p className="text-xs text-gray-400">
            Made by CHOSEN Team
          </p> */}  
        </div>
      </footer>
    </div>
  );
}