import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AnimatedCard } from '@/components/auth/AnimatedCard';
import { Button } from '@/components/ui/button';
import { OtpInput } from '@/components/auth/OtpInput';
import { useForgotPasswordStore } from '@/stores/forgotPasswordStore';
import { toast } from 'sonner';

const ForgotPasswordVerify = () => {
  const navigate = useNavigate();
  const { email, resend } = useForgotPasswordStore();
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Redirect if no email set
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setOtpError(true);
      return;
    }

    // Mock: reject all zeros
    if (otp === '000000') {
      setOtpError(true);
      toast.error('Invalid verification code');
      return;
    }

    setIsVerifying(true);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success('Verification successful!');
      navigate('/forgot-password/reset');
    } catch (error) {
      setOtpError(true);
      toast.error('Invalid verification code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    resend();
    setCountdown(30);
    setCanResend(false);
    toast.success('New code sent to your email');
  };

  const handleOtpChange = (value: string) => {
    setOtp(value);
    setOtpError(false);
  };

  return (
    <AuthLayout>
      <AnimatedCard>
        <motion.div
          animate={otpError ? { x: [-6, 6, -3, 3, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Check your email</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Enter the 6-digit code we sent to{' '}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <OtpInput value={otp} onChange={handleOtpChange} error={otpError} />
              {otpError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-destructive text-center"
                >
                  Invalid code. Please try again.
                </motion.p>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Didn't receive the code?
              </p>
              {canResend ? (
                <button
                  onClick={handleResend}
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Resend code
                </button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Resend in <span className="font-medium text-foreground">{countdown}s</span>
                </p>
              )}
            </div>

            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleVerify}
                disabled={isVerifying || otp.length !== 6}
                className="w-full h-11"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify code'
                )}
              </Button>
            </motion.div>

            <div className="flex justify-between text-sm pt-2">
              <Link
                to="/forgot-password"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Change email
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={14} className="mr-1" />
                Back to login
              </Link>
            </div>
          </div>
        </motion.div>
      </AnimatedCard>
    </AuthLayout>
  );
};

export default ForgotPasswordVerify;