import { useEffect, useState, useCallback, useRef } from 'react';
import type { FieldValues, UseFormWatch } from 'react-hook-form';
import type { ZodSchema } from 'zod';

interface UseRealTimeValidationProps<T extends FieldValues> {
  watch: UseFormWatch<T>;
  schema: ZodSchema<T>;
  debounceMs?: number;
}

interface ValidationState {
  [key: string]: {
    isValid: boolean;
    error?: string;
    isValidating: boolean;
  };
}

export function useRealTimeValidation<T extends FieldValues>({
  watch,
  schema,
  debounceMs = 300,
}: UseRealTimeValidationProps<T>) {
  const [validationState, setValidationState] = useState<ValidationState>({});
  const debounceTimersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const previousValuesRef = useRef<any>({});
  const isValidatingRef = useRef<{ [key: string]: boolean }>({});

  const watchedValues = watch();

  useEffect(() => {
    // Only process fields that have actually changed
    const changedFields = Object.keys(watchedValues).filter(
      fieldName => previousValuesRef.current[fieldName] !== watchedValues[fieldName]
    );

    if (changedFields.length === 0) return;

    // Update previous values
    previousValuesRef.current = { ...watchedValues };

    changedFields.forEach((fieldName) => {
      const fieldValue = watchedValues[fieldName];
      
      // Skip validation for empty values to prevent unnecessary loading states
      if (!fieldValue || fieldValue === '') {
        // Clear any existing timer
        if (debounceTimersRef.current[fieldName]) {
          clearTimeout(debounceTimersRef.current[fieldName]);
          delete debounceTimersRef.current[fieldName];
        }
        
        isValidatingRef.current[fieldName] = false;
        setValidationState(prev => ({
          ...prev,
          [fieldName]: {
            isValid: false,
            error: undefined,
            isValidating: false,
          },
        }));
        return;
      }
      
      // Prevent multiple validations for the same field
      if (isValidatingRef.current[fieldName]) {
        return;
      }
      
      // Clear existing timer for this field
      if (debounceTimersRef.current[fieldName]) {
        clearTimeout(debounceTimersRef.current[fieldName]);
      }

      // Set validation state to "validating"
      isValidatingRef.current[fieldName] = true;
      setValidationState(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          isValidating: true,
        },
      }));

      // Create new debounced validation timer
      const timer = setTimeout(() => {
        try {
          // Validate the entire schema but only check for errors on this specific field
          const result = schema.safeParse(watchedValues);
          
          if (result.success) {
            // If the entire form is valid, this field is valid
            isValidatingRef.current[fieldName] = false;
            setValidationState(prev => ({
              ...prev,
              [fieldName]: {
                isValid: true,
                error: undefined,
                isValidating: false,
              },
            }));
          } else {
            // Check if there are errors for this specific field
            const fieldError = result.error.issues.find(err =>
              err.path.length > 0 && err.path[0] === fieldName
            );
            
            isValidatingRef.current[fieldName] = false;
            if (fieldError) {
              // This field has an error
              setValidationState(prev => ({
                ...prev,
                [fieldName]: {
                  isValid: false,
                  error: fieldError.message,
                  isValidating: false,
                },
              }));
            } else {
              // This field is valid (error is in another field)
              setValidationState(prev => ({
                ...prev,
                [fieldName]: {
                  isValid: true,
                  error: undefined,
                  isValidating: false,
                },
              }));
            }
          }
        } catch (error: any) {
          // Fallback error handling
          isValidatingRef.current[fieldName] = false;
          setValidationState(prev => ({
            ...prev,
            [fieldName]: {
              isValid: false,
              error: 'Validation error',
              isValidating: false,
            },
          }));
        }
        
        // Clean up the timer reference
        delete debounceTimersRef.current[fieldName];
      }, debounceMs);

      debounceTimersRef.current[fieldName] = timer;
    });

    // Cleanup: only cancel timers for fields that changed in this cycle,
    // and reset their validating flags so we don't get stuck in a loading state.
    return () => {
      changedFields.forEach((fieldName) => {
        const timer = debounceTimersRef.current[fieldName];
        if (timer) {
          clearTimeout(timer);
          delete debounceTimersRef.current[fieldName];
        }
        // Ensure validating flag is cleared if we canceled a pending validation
        isValidatingRef.current[fieldName] = false;
        // Also clear any transient validating UI state
        setValidationState(prev => ({
          ...prev,
          [fieldName]: {
            ...(prev[fieldName] || { isValid: false, error: undefined }),
            isValidating: false,
          },
        }));
      });
    };
  }, [watchedValues, schema, debounceMs]);

  const getFieldValidation = useCallback((fieldName: string) => {
    return validationState[fieldName] || {
      isValid: false,
      error: undefined,
      isValidating: false,
    };
  }, [validationState]);

  const isFieldValid = useCallback((fieldName: string) => {
    return validationState[fieldName]?.isValid || false;
  }, [validationState]);

  const isFieldValidating = useCallback((fieldName: string) => {
    return validationState[fieldName]?.isValidating || false;
  }, [validationState]);

  const getFieldError = useCallback((fieldName: string) => {
    return validationState[fieldName]?.error;
  }, [validationState]);

  return {
    validationState,
    getFieldValidation,
    isFieldValid,
    isFieldValidating,
    getFieldError,
  };
}