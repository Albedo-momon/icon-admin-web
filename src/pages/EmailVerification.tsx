import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';

const verificationSchema = z.object({
  code: z.string().min(6, 'Verification code must be 6 digits').max(6, 'Verification code must be 6 digits'),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function EmailVerification() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
  });

  useEffect(() => {
    // Get email from sessionStorage first, then URL params, or redirect if not available
    const storedEmail = sessionStorage.getItem('verificationEmail');
    const emailParam = searchParams.get('email');
    
    if (storedEmail) {
      setEmail(storedEmail);
    } else if (emailParam) {
      setEmail(emailParam);
    } else {
      // No email found, redirect back to register
      toast({
        title: 'Session expired',
        description: 'Please register again to receive a verification code.',
        variant: 'destructive',
      });
      navigate('/register');
    }
  }, [searchParams, navigate, toast]);

  const { verifyEmail: verifyEmailStore, resendVerificationEmail } = useAuthStore();

  const verifyEmail = async (data: VerificationFormData) => {
    setIsVerifying(true);
    try {
      await verifyEmailStore(data.code);
      
      // Clear stored email after successful verification
      sessionStorage.removeItem('verificationEmail');
      
      toast({
        title: 'Email verified successfully!',
        description: 'Your account has been created. Redirecting to dashboard...',
      });
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Email verification error:', error);
      
      let errorMessage = 'Verification failed. Please try again.';
      if (error.message?.includes('incorrect')) {
        errorMessage = 'Invalid verification code. Please check and try again.';
      } else if (error.message?.includes('expired')) {
        errorMessage = 'Verification code has expired. Please request a new one.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Verification failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      await resendVerificationEmail();
      
      toast({
        title: 'Verification email sent!',
        description: 'Please check your email for a new verification code.',
      });
    } catch (error: any) {
      console.error('Resend verification error:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to resend email',
        description: error.message || 'Please try again or contact support.',
      });
    } finally {
      setIsResending(false);
    }
  };

  const code = watch('code');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <motion.div variants={itemVariants} className="mx-auto mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Verify Your Email
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                We've sent a verification code to
                <br />
                <span className="font-medium text-gray-900">{email}</span>
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(verifyEmail)} className="space-y-4">
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  {...register('code')}
                  className={`h-12 text-center text-lg tracking-widest ${
                    errors.code ? 'border-destructive' : ''
                  }`}
                  aria-invalid={errors.code ? 'true' : 'false'}
                />
                {errors.code && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {errors.code.message}
                  </motion.p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-3">
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={isVerifying || !code || code.length !== 6}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Verify Email
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Didn't receive the code?
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Resend verification email'
                    )}
                  </Button>
                </div>
              </motion.div>
            </form>

            <motion.div variants={itemVariants} className="pt-4 border-t">
              <Button
                variant="ghost"
                onClick={() => navigate('/register')}
                className="w-full text-gray-600 hover:text-gray-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Registration
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}