import { Input } from '@/components/ui/input';
import { formatRupiahInput, parseRupiah, getRupiahDisplayValue } from '@/utils/currency';
import { forwardRef, useState, useEffect } from 'react';

interface RupiahInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value: string | number;
    onChange: (value: string) => void;
    onValueChange?: (numericValue: number) => void;
}

export const RupiahInput = forwardRef<HTMLInputElement, RupiahInputProps>(
    ({ value, onChange, onValueChange, ...props }, ref) => {
        const [displayValue, setDisplayValue] = useState('');

        // Update display value when value prop changes
        useEffect(() => {
            setDisplayValue(getRupiahDisplayValue(value));
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const inputValue = e.target.value;

            // Format the input for display
            const formatted = formatRupiahInput(inputValue);
            setDisplayValue(formatted);

            // Parse to numeric value for form data
            const numericValue = parseRupiah(inputValue);

            // Call both callbacks
            onChange(numericValue.toString());
            onValueChange?.(numericValue);
        };

        return (
            <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                    Rp
                </span>
                <Input
                    ref={ref}
                    {...props}
                    value={displayValue}
                    onChange={handleChange}
                    className="pl-8"
                    placeholder="0"
                    type="text"
                    inputMode="numeric"
                />
            </div>
        );
    }
);

RupiahInput.displayName = 'RupiahInput';
