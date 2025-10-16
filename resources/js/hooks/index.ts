import { useCallback, useEffect, useState } from 'react';

/**
 * Debounce hook for delaying function execution
 */
export const useDebounce = <T>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

/**
 * Toggle hook for boolean states
 */
export const useToggle = (initialValue: boolean = false): [boolean, () => void, (value: boolean) => void] => {
    const [value, setValue] = useState(initialValue);

    const toggle = useCallback(() => {
        setValue((prev) => !prev);
    }, []);

    const setToggle = useCallback((newValue: boolean) => {
        setValue(newValue);
    }, []);

    return [value, toggle, setToggle];
};

/**
 * Local storage hook with JSON serialization
 */
export const useLocalStorage = <T>(key: string, initialValue: T): [T, (value: T) => void, () => void] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = useCallback(
        (value: T) => {
            try {
                setStoredValue(value);
                window.localStorage.setItem(key, JSON.stringify(value));
            } catch (error) {
                console.warn(`Error setting localStorage key "${key}":`, error);
            }
        },
        [key],
    );

    const removeValue = useCallback(() => {
        try {
            window.localStorage.removeItem(key);
            setStoredValue(initialValue);
        } catch (error) {
            console.warn(`Error removing localStorage key "${key}":`, error);
        }
    }, [key, initialValue]);

    return [storedValue, setValue, removeValue];
};

/**
 * Form validation hook - simplified version
 */
export interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: unknown) => string | null;
}

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

export const useFormValidation = (values: Record<string, unknown>, rules: Record<string, ValidationRule>): ValidationResult => {
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const newErrors: Record<string, string> = {};

        Object.keys(rules).forEach((field) => {
            const value = values[field];
            const rule = rules[field];

            if (!rule) return;

            // Required validation
            if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
                newErrors[field] = `${field} is required`;
                return;
            }

            // Skip other validations if field is empty and not required
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                return;
            }

            // String-specific validations
            if (typeof value === 'string') {
                // Min length validation
                if (rule.minLength && value.length < rule.minLength) {
                    newErrors[field] = `${field} must be at least ${rule.minLength} characters`;
                    return;
                }

                // Max length validation
                if (rule.maxLength && value.length > rule.maxLength) {
                    newErrors[field] = `${field} must be no more than ${rule.maxLength} characters`;
                    return;
                }

                // Pattern validation
                if (rule.pattern && !rule.pattern.test(value)) {
                    newErrors[field] = `${field} format is invalid`;
                    return;
                }
            }

            // Custom validation
            if (rule.custom) {
                const customError = rule.custom(value);
                if (customError) {
                    newErrors[field] = customError;
                    return;
                }
            }
        });

        setErrors(newErrors);
    }, [values, rules]);

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

/**
 * Async operation hook with loading and error states
 */
export const useAsyncOperation = <T, E = Error>() => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<E | null>(null);
    const [data, setData] = useState<T | null>(null);

    const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
        setLoading(true);
        setError(null);
        try {
            const result = await asyncFunction();
            setData(result);
            return result;
        } catch (err) {
            setError(err as E);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setLoading(false);
        setError(null);
        setData(null);
    }, []);

    return {
        loading,
        error,
        data,
        execute,
        reset,
    };
};
