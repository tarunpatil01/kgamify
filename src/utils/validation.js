import * as yup from 'yup';

// Common validation patterns
const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Company registration validation schema
export const companyRegistrationSchema = yup.object().shape({
  companyName: yup
    .string()
    .required('Company name is required')
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must be less than 100 characters'),
  
  email: yup
    .string()
    .required('Email is required')
    .matches(emailRegex, 'Please enter a valid email address'),
  
  password: yup
    .string()
    .required('Password is required')
    .matches(
      passwordRegex,
      'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password'), null], 'Passwords must match'),
  
  phone: yup
    .string()
    .required('Phone number is required')
    .matches(phoneRegex, 'Please enter a valid phone number'),
  
  address: yup
    .string()
    .required('Address is required')
    .min(10, 'Address must be at least 10 characters'),
  
  industry: yup
    .string()
    .required('Industry is required'),
  
  companySize: yup
    .string()
    .required('Company size is required'),
  
  website: yup
    .string()
    .url('Please enter a valid website URL')
    .nullable(),
  
  description: yup
    .string()
    .required('Company description is required')
    .min(50, 'Description must be at least 50 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  
  logo: yup
    .mixed()
    .test('fileSize', 'File size is too large', (value) => {
      if (!value) return true; // Optional field
      return value.size <= 5 * 1024 * 1024; // 5MB limit
    })
    .test('fileType', 'Unsupported file type', (value) => {
      if (!value) return true; // Optional field
      return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(value.type);
    }),
});

// Job posting validation schema
export const jobPostingSchema = yup.object().shape({
  title: yup
    .string()
    .required('Job title is required')
    .min(5, 'Job title must be at least 5 characters')
    .max(100, 'Job title must be less than 100 characters'),
  
  description: yup
    .string()
    .required('Job description is required')
    .min(100, 'Description must be at least 100 characters')
    .max(5000, 'Description must be less than 5000 characters'),
  
  requirements: yup
    .string()
    .required('Job requirements are required')
    .min(50, 'Requirements must be at least 50 characters')
    .max(2000, 'Requirements must be less than 2000 characters'),
  
  location: yup
    .string()
    .required('Job location is required')
    .min(2, 'Location must be at least 2 characters'),
  
  type: yup
    .string()
    .required('Job type is required')
    .oneOf(['full-time', 'part-time', 'contract', 'internship'], 'Please select a valid job type'),
  
  experience: yup
    .string()
    .required('Experience level is required')
    .oneOf(['entry', 'mid', 'senior', 'executive'], 'Please select a valid experience level'),
  
  salary: yup
    .number()
    .typeError('Salary must be a number')
    .positive('Salary must be positive')
    .nullable(),
  
  skills: yup
    .array()
    .of(yup.string())
    .min(1, 'At least one skill is required')
    .max(10, 'Maximum 10 skills allowed'),
});

// Login validation schema
export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required('Email is required')
    .matches(emailRegex, 'Please enter a valid email address'),
  
  password: yup
    .string()
    .required('Password is required'),
});

// Password reset validation schema
export const passwordResetSchema = yup.object().shape({
  email: yup
    .string()
    .required('Email is required')
    .matches(emailRegex, 'Please enter a valid email address'),
});

// New password validation schema
export const newPasswordSchema = yup.object().shape({
  password: yup
    .string()
    .required('Password is required')
    .matches(
      passwordRegex,
      'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password'), null], 'Passwords must match'),
});

// Job application validation schema
export const jobApplicationSchema = yup.object().shape({
  fullName: yup
    .string()
    .required('Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  
  email: yup
    .string()
    .required('Email is required')
    .matches(emailRegex, 'Please enter a valid email address'),
  
  phone: yup
    .string()
    .required('Phone number is required')
    .matches(phoneRegex, 'Please enter a valid phone number'),
  
  coverLetter: yup
    .string()
    .required('Cover letter is required')
    .min(100, 'Cover letter must be at least 100 characters')
    .max(2000, 'Cover letter must be less than 2000 characters'),
  
  resume: yup
    .mixed()
    .required('Resume is required')
    .test('fileSize', 'File size is too large', (value) => {
      if (!value) return false;
      return value.size <= 10 * 1024 * 1024; // 10MB limit
    })
    .test('fileType', 'Unsupported file type', (value) => {
      if (!value) return false;
      return [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ].includes(value.type);
    }),
});

// Admin login validation schema
export const adminLoginSchema = yup.object().shape({
  username: yup
    .string()
    .required('Username is required'),
  
  password: yup
    .string()
    .required('Password is required'),
});

// Helper function to validate form data
export const validateForm = async (schema, data) => {
  try {
    await schema.validate(data, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (error) {
    const errors = {};
    error.inner.forEach((err) => {
      errors[err.path] = err.message;
    });
    return { isValid: false, errors };
  }
};

// Helper function to get field error
export const getFieldError = (errors, fieldName) => {
  return errors[fieldName] || '';
}; 