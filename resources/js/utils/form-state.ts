import { useState, useCallback } from 'react';

/**
 * Generic form state management utility
 */
export interface FormState<T> {
    data: T;
    errors: Record<keyof T, string>;
    touched: Record<keyof T, boolean>;
    isDirty: boolean;
    isValid: boolean;
}

export interface FormActions<T> {
    setField: (field: keyof T, value: T[keyof T]) => void;
    setFields: (fields: Partial<T>) => void;
    setError: (field: keyof T, error: string) => void;
    clearError: (field: keyof T) => void;
    setTouched: (field: keyof T, touched: boolean) => void;
    reset: (newData?: Partial<T>) => void;
    validate: () => boolean;
}

export type FormManager<T> = FormState<T> & FormActions<T>;

/**
 * Custom hook for managing form state
 */
export const useFormState = <T extends Record<string, unknown>>(
    initialData: T,
    validators?: Partial<Record<keyof T, (value: T[keyof T]) => string | null>>
): FormManager<T> => {
    const [data, setData] = useState<T>(initialData);
    const [errors, setErrors] = useState<Record<keyof T, string>>({} as Record<keyof T, string>);
    const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
    const [isDirty, setIsDirty] = useState(false);

    const setField = useCallback((field: keyof T, value: T[keyof T]) => {
        setData(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }

        // Validate field if validator exists
        if (validators?.[field]) {
            const error = validators[field]!(value);
            if (error) {
                setErrors(prev => ({ ...prev, [field]: error }));
            }
        }
    }, [errors, validators]);

    const setFields = useCallback((fields: Partial<T>) => {
        setData(prev => ({ ...prev, ...fields }));
        setIsDirty(true);
    }, []);

    const setError = useCallback((field: keyof T, error: string) => {
        setErrors(prev => ({ ...prev, [field]: error }));
    }, []);

    const clearError = useCallback((field: keyof T) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    }, []);

    const setTouchedField = useCallback((field: keyof T, touchedValue: boolean) => {
        setTouched(prev => ({ ...prev, [field]: touchedValue }));
    }, []);

    const reset = useCallback((newData?: Partial<T>) => {
        const resetData = newData ? { ...initialData, ...newData } : initialData;
        setData(resetData);
        setErrors({} as Record<keyof T, string>);
        setTouched({} as Record<keyof T, boolean>);
        setIsDirty(false);
    }, [initialData]);

    const validate = useCallback(() => {
        if (!validators) return true;

        const newErrors: Record<keyof T, string> = {} as Record<keyof T, string>;
        let isValid = true;

        Object.keys(validators).forEach((field) => {
            const validator = validators[field as keyof T];
            if (validator) {
                const error = validator(data[field as keyof T]);
                if (error) {
                    newErrors[field as keyof T] = error;
                    isValid = false;
                }
            }
        });

        setErrors(newErrors);
        return isValid;
    }, [data, validators]);

    const isValid = Object.keys(errors).length === 0;

    return {
        data,
        errors,
        touched,
        isDirty,
        isValid,
        setField,
        setFields,
        setError,
        clearError,
        setTouched: setTouchedField,
        reset,
        validate,
    };
};

/**
 * Simple tab state management (without complex form integration)
 */
export interface SimpleTabState<T extends string> {
    activeTab: T;
    setActiveTab: (tab: T) => void;
}

export const useTabState = <T extends string>(
    initialTab: T,
    availableTabs: T[]
): SimpleTabState<T> => {
    const [activeTab, setActiveTab] = useState<T>(initialTab);

    const setTab = useCallback((tab: T) => {
        if (availableTabs.includes(tab)) {
            setActiveTab(tab);
        }
    }, [availableTabs]);

    return {
        activeTab,
        setActiveTab: setTab,
    };
};

/**
 * Array form state management (for dynamic forms)
 */
export interface ArrayFormState<T> {
    items: T[];
    addItem: (item?: Partial<T>) => void;
    removeItem: (index: number) => void;
    updateItem: (index: number, item: Partial<T>) => void;
    moveItem: (fromIndex: number, toIndex: number) => void;
    reset: (items?: T[]) => void;
}

export const useArrayFormState = <T extends Record<string, unknown>>(
    initialItems: T[] = [],
    defaultItem: T
): ArrayFormState<T> => {
    const [items, setItems] = useState<T[]>(initialItems);

    const addItem = useCallback((item?: Partial<T>) => {
        const newItem = item ? { ...defaultItem, ...item } : defaultItem;
        setItems(prev => [...prev, newItem]);
    }, [defaultItem]);

    const removeItem = useCallback((index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    }, []);

    const updateItem = useCallback((index: number, item: Partial<T>) => {
        setItems(prev => prev.map((existingItem, i) =>
            i === index ? { ...existingItem, ...item } : existingItem
        ));
    }, []);

    const moveItem = useCallback((fromIndex: number, toIndex: number) => {
        setItems(prev => {
            const newItems = [...prev];
            const [movedItem] = newItems.splice(fromIndex, 1);
            newItems.splice(toIndex, 0, movedItem);
            return newItems;
        });
    }, []);

    const reset = useCallback((newItems?: T[]) => {
        setItems(newItems || initialItems);
    }, [initialItems]);

    return {
        items,
        addItem,
        removeItem,
        updateItem,
        moveItem,
        reset,
    };
};
