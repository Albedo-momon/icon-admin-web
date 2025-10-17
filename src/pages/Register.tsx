import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AnimatedCard } from '@/components/auth/AnimatedCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/stores/authStore';
import { useRealTimeValidation } from '@/hooks/useRealTimeValidation';
import { toast } from 'sonner';

const registerSchema = z
  .object({
    name: z.string()
      .min(1, 'Full name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
    email: z.string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address')
      .max(100, 'Email must be less than 100 characters'),
    password: z.string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must be less than 100 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    confirmPassword: z.string()
      .min(1, 'Please confirm your password'),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const register_user = useAuthStore((state) => state.register);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      agreeToTerms: false,
    },
  });

  // Real-time validation
  const {
    isFieldValid,
    isFieldValidating,
  } = useRealTimeValidation({
    watch,
    schema: registerSchema,
    debounceMs: 500,
  });

  const password = watch('password');

  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) strength += 25;

    setPasswordStrength(strength);
  }, [password]);

  const getStrengthColor = () => {
    if (passwordStrength <= 25) return 'bg-destructive';
    if (passwordStrength <= 50) return 'bg-orange-500';
    if (passwordStrength <= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (passwordStrength <= 25) return 'Weak';
    if (passwordStrength <= 50) return 'Fair';
    if (passwordStrength <= 75) return 'Good';
    return 'Strong';
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      await register_user(data.name, data.email, data.password);
      setShowSuccess(true);
      toast.success('Account created successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error: any) {
      // Handle specific error types
      const errorMessage = error.message || 'An unexpected error occurred';
      
      if (errorMessage.includes('Email already exists') || errorMessage.includes('form_identifier_exists')) {
        toast.error('An account with this email already exists. Please use a different email or try logging in.');
      } else if (errorMessage.includes('Invalid email') || errorMessage.includes('email format')) {
        toast.error('Please enter a valid email address.');
      } else if (errorMessage.includes('Password too weak') || errorMessage.includes('password requirements')) {
        toast.error('Password must contain at least 8 characters with uppercase, lowercase, and numbers.');
      } else if (errorMessage.includes('Network') || errorMessage.includes('connection')) {
        toast.error('Connection error. Please check your internet connection and try again.');
      } else if (errorMessage.includes('Server error') || errorMessage.includes('500')) {
        toast.error('Server error. Please try again in a few moments.');
      } else if (errorMessage.includes('Rate limit') || errorMessage.includes('too many requests')) {
        toast.error('Too many registration attempts. Please wait a few minutes before trying again.');
      } else if (errorMessage.includes('EMAIL_VERIFICATION_REQUIRED')) {
        // Store email for verification page
        sessionStorage.setItem('verificationEmail', data.email);
        toast.success('Account created! Redirecting to verification...');
        // Stop loading before redirect
        setIsSubmitting(false);
        // Immediate redirect without delay
        navigate('/email-verification');
        return;
      } else if (errorMessage.includes('verification required') || errorMessage.includes('missing_requirements')) {
        toast.success('Account created! Please check your email to verify your account before signing in.');
        // Stop loading before redirect
        setIsSubmitting(false);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      } else {
        toast.error(errorMessage);
      }
      
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <AuthLayout>
      <AnimatedCard>
        {showSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            </motion.div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Account Created!
            </h3>
            <p className="text-muted-foreground text-center">
              Redirecting to login...
            </p>
          </motion.div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">Create Account</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Join Icon Computers Admin
              </p>
            </div>

            <motion.form
              onSubmit={handleSubmit(onSubmit)}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <Input
                    id="name"
                    placeholder="John Doe"
                    {...register('name')}
                    className={`h-11 pr-10 ${
                      errors.name 
                        ? 'border-destructive focus-visible:ring-destructive' 
                        : isFieldValid('name') 
                          ? 'border-green-500 focus-visible:ring-green-500' 
                          : ''
                    }`}
                    aria-invalid={errors.name ? 'true' : 'false'}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isFieldValidating('name') && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!isFieldValidating('name') && isFieldValid('name') && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    {!isFieldValidating('name') && errors.name && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
                {errors.name && (
                  <motion.p
                    id="name-error"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive flex items-center gap-1"
                    role="alert"
                  >
                    <span className="text-xs">⚠</span>
                    {errors.name.message}
                  </motion.p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    {...register('email')}
                    className={`h-11 pr-10 ${
                      errors.email 
                        ? 'border-destructive focus-visible:ring-destructive' 
                        : isFieldValid('email') 
                          ? 'border-green-500 focus-visible:ring-green-500' 
                          : ''
                    }`}
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isFieldValidating('email') && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!isFieldValidating('email') && isFieldValid('email') && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    {!isFieldValidating('email') && errors.email && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
                {errors.email && (
                  <motion.p
                    id="email-error"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive flex items-center gap-1"
                    role="alert"
                  >
                    <span className="text-xs">⚠</span>
                    {errors.email.message}
                  </motion.p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className={`h-11 pr-20 ${
                      errors.password 
                        ? 'border-destructive focus-visible:ring-destructive' 
                        : isFieldValid('password') 
                          ? 'border-green-500 focus-visible:ring-green-500' 
                          : ''
                    }`}
                    aria-invalid={errors.password ? 'true' : 'false'}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  <div className="absolute right-12 top-1/2 -translate-y-1/2">
                    {isFieldValidating('password') && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!isFieldValidating('password') && isFieldValid('password') && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    {!isFieldValidating('password') && errors.password && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {password && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${passwordStrength}%` }}
                          transition={{ duration: 0.3 }}
                          className={`h-full ${getStrengthColor()}`}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {getStrengthLabel()}
                      </span>
                    </div>
                  </div>
                )}
                {errors.password && (
                  <motion.p
                    id="password-error"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive flex items-center gap-1"
                    role="alert"
                  >
                    <span className="text-xs">⚠</span>
                    {errors.password.message}
                  </motion.p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    className={`h-11 pr-20 ${
                      errors.confirmPassword 
                        ? 'border-destructive focus-visible:ring-destructive' 
                        : isFieldValid('confirmPassword') 
                          ? 'border-green-500 focus-visible:ring-green-500' 
                          : ''
                    }`}
                    aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                    aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                  />
                  <div className="absolute right-12 top-1/2 -translate-y-1/2">
                    {isFieldValidating('confirmPassword') && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!isFieldValidating('confirmPassword') && isFieldValid('confirmPassword') && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    {!isFieldValidating('confirmPassword') && errors.confirmPassword && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <motion.p
                    id="confirmPassword-error"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive flex items-center gap-1"
                    role="alert"
                  >
                    <span className="text-xs">⚠</span>
                    {errors.confirmPassword.message}
                  </motion.p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-start space-x-2">
                <div className="relative">
                  <Controller
                    name="agreeToTerms"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="terms"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className={`mt-1 ${
                          errors.agreeToTerms 
                            ? 'border-destructive' 
                            : isFieldValid('agreeToTerms') 
                              ? 'border-green-500' 
                              : ''
                        }`}
                        aria-invalid={!!errors.agreeToTerms}
                        aria-describedby={errors.agreeToTerms ? 'terms-error' : undefined}
                      />
                    )}
                  />
                  <div className="absolute -right-6 top-1/2 -translate-y-1/2">
                    {isFieldValidating('agreeToTerms') && (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    )}
                    {!isFieldValidating('agreeToTerms') && isFieldValid('agreeToTerms') && (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    )}
                    {!isFieldValidating('agreeToTerms') && errors.agreeToTerms && (
                      <AlertCircle className="h-3 w-3 text-destructive" />
                    )}
                  </div>
                </div>
                <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                  I agree to the{' '}
                  <Link to="#" className="text-primary hover:text-primary/80">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="#" className="text-primary hover:text-primary/80">
                    Privacy Policy
                  </Link>
                </label>
              </motion.div>
              {errors.agreeToTerms && (
                <motion.p
                  id="terms-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive flex items-center gap-1"
                  role="alert"
                >
                  <span className="text-xs">⚠</span>
                  {errors.agreeToTerms.message}
                </motion.p>
              )}

              <motion.div variants={itemVariants}>
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div variants={itemVariants} className="text-center pt-4">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </motion.div>
            </motion.form>
          </>
        )}
      </AnimatedCard>
    </AuthLayout>
  );
};

export default Register;