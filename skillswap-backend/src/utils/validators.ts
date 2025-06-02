import { z } from 'zod';

// User registration schema
export const registerSchema = z.object({
  idToken: z.string().min(1, 'Firebase ID token is required'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['student', 'mentor']).optional().default('student'),
  avatar_url: z.string().url('Invalid avatar URL').optional(),
  skills_offered: z.array(z.string().min(1).max(50))
    .max(10, 'Maximum 10 skills allowed')
    .optional()
    .default([]),
  skills_wanted: z.array(z.string().min(1).max(50))
    .max(10, 'Maximum 10 skills allowed')
    .optional()
    .default([]),
  availability: z.object({
    days: z.array(z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']))
      .optional()
      .default([]),
    times: z.array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'))
      .optional()
      .default([])
  }).optional().default({ days: [], times: [] })
});

// Profile update schema
export const updateProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters')
    .optional(),
  avatar_url: z.string().url('Invalid avatar URL').optional(),
  skills_offered: z.array(z.string().min(1).max(50))
    .max(10, 'Maximum 10 skills allowed')
    .optional(),
  skills_wanted: z.array(z.string().min(1).max(50))
    .max(10, 'Maximum 10 skills allowed')
    .optional(),
  availability: z.object({
    days: z.array(z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']))
      .optional(),
    times: z.array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'))
      .optional()
  }).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

// Login schema
export const loginSchema = z.object({
  idToken: z.string().min(1, 'Firebase ID token is required')
});

// Pagination schema
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(10),
  offset: z.number().int().min(0).optional().default(0)
});

// UID parameter schema
export const uidParamSchema = z.object({
  uid: z.string().min(1, 'User ID is required').max(128, 'Invalid user ID format')
});

// Validation helper function
export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      throw new Error(`Validation failed: ${JSON.stringify(errorMessages)}`);
    }
    throw error;
  }
};

// Skill name validator
export const isValidSkillName = (skill: string): boolean => {
  return /^[a-zA-Z0-9\s\-\+\#\.\/]+$/.test(skill) && skill.length >= 1 && skill.length <= 50;
};

// Email validator
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// URL validator
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Time format validator (HH:MM)
export const isValidTimeFormat = (time: string): boolean => {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};

// Day validator
export const isValidDay = (day: string): boolean => {
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].includes(day);
};

// Clean and validate skills array
export const cleanSkillsArray = (skills: string[]): string[] => {
  return skills
    .map(skill => skill.trim())
    .filter(skill => skill.length > 0 && isValidSkillName(skill))
    .slice(0, 10); // Limit to 10 skills
};

// Clean and validate availability
export const cleanAvailability = (availability: any): { days: string[], times: string[] } => {
  const cleaned = {
    days: [] as string[],
    times: [] as string[]
  };

  if (availability?.days && Array.isArray(availability.days)) {
    cleaned.days = availability.days.filter(isValidDay);
  }

  if (availability?.times && Array.isArray(availability.times)) {
    cleaned.times = availability.times.filter(isValidTimeFormat);
  }

  return cleaned;
};