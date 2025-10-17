import { useState } from 'react';
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

const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema) as any,
    defaultValues: {
      rememberMe: false,
    },
  });

  // Real-time validation
  const {
    isFieldValid,
    isFieldValidating,
  } = useRealTimeValidation({
    watch,
    schema: loginSchema,
    debounceMs: 500,
  });

  // const rememberMe = watch('rememberMe');

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password, data.rememberMe);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error: any) {
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
      
      // Handle specific error types
      const errorMessage = error.message || 'An unexpected error occurred';
      
      if (errorMessage.includes('Invalid credentials') || errorMessage.includes('Incorrect password')) {
        toast.error('Invalid email or password. Please check your credentials and try again.');
      } else if (errorMessage.includes('User not found') || errorMessage.includes('No account found')) {
        toast.error('No account found with this email address. Please check your email or sign up.');
      } else if (errorMessage.includes('Account locked') || errorMessage.includes('locked')) {
        toast.error('Your account has been temporarily locked. Please try again later or contact support.');
      } else if (errorMessage.includes('Email not verified') || errorMessage.includes('verification')) {
        toast.error('Please verify your email address before signing in. Check your inbox for a verification link.');
      } else if (errorMessage.includes('Too many attempts') || errorMessage.includes('rate limit')) {
        toast.error('Too many login attempts. Please wait a few minutes before trying again.');
      } else if (errorMessage.includes('Network') || errorMessage.includes('connection')) {
        toast.error('Connection error. Please check your internet connection and try again.');
      } else if (errorMessage.includes('Server error') || errorMessage.includes('500')) {
        toast.error('Server error. Please try again in a few moments.');
      } else {
        toast.error(errorMessage);
      }
      
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
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
        <motion.div
          animate={shakeError ? { x: [-4, 4, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Sign in to access your account
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
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@iconcomputers.com"
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

            <motion.div
              variants={itemVariants}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <Controller
                  name="rememberMe"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="remember"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Forgot password?
              </Link>
            </motion.div>

            <motion.div variants={itemVariants}>
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-[image:var(--gradient-button)] hover:opacity-90 transition-opacity"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </motion.div>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Create one
                </Link>
              </p>
            </motion.div>
          </motion.form>
        </motion.div>
      </AnimatedCard>
    </AuthLayout>
  );
};

export default Login;