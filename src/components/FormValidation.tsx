import { z } from 'zod';

// Email validation schema
export const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// Contact form validation schema
export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Email campaign validation schema
export const emailCampaignSchema = z.object({
  name: z.string().min(3, 'Campaign name must be at least 3 characters'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  scheduled_at: z.date().optional(),
});

// Funnel validation schema
export const funnelSchema = z.object({
  name: z.string().min(3, 'Funnel name must be at least 3 characters'),
  description: z.string().optional(),
  funnel_data: z.object({
    steps: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['landing', 'optin', 'sales', 'upsell', 'downsell', 'thank_you']),
      content: z.string(),
    })).min(2, 'Funnel must have at least 2 steps'),
  }),
});

// User profile validation schema
export const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  company_name: z.string().optional(),
  phone: z.string().optional(),
});

// Authentication validation schemas
export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Validation helper function
export const validateForm = <T,>(schema: z.ZodSchema<T>, data: any): { success: true; data: T } | { success: false; errors: Record<string, string> } => {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};

// Form error display component
export const FormErrors = ({ errors, field }: { errors: Record<string, string>; field: string }) => {
  if (!errors[field]) return null;
  
  return (
    <p className="text-sm text-destructive mt-1">
      {errors[field]}
    </p>
  );
};

export default {
  emailSchema,
  contactSchema,
  emailCampaignSchema,
  funnelSchema,
  profileSchema,
  signInSchema,
  signUpSchema,
  validateForm,
  FormErrors,
};