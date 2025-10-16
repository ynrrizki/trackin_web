/**
 * Utility functions for currency formatting and parsing
 */

/**
 * Format number to Indonesian Rupiah format with dots as thousand separators
 * @param value - The numeric value to format
 * @returns Formatted string (e.g., "1.000.000")
 */
export const formatRupiah = (value: number | string): string => {
    if (value === '' || value === null || value === undefined) return '';

    // Convert to number if string
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d]/g, '')) : value;

    if (isNaN(numValue)) return '';

    // Format with dots as thousand separators
    return numValue.toLocaleString('id-ID', {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
    });
};

/**
 * Parse formatted rupiah string to number
 * @param value - Formatted string (e.g., "1.000.000" or "1,000,000")
 * @returns Numeric value
 */
export const parseRupiah = (value: string): number => {
    if (!value) return 0;

    // Remove all non-digit characters except commas and dots
    // Then remove dots and commas (thousand separators)
    const cleaned = value.replace(/[^\d.,]/g, '').replace(/[.,]/g, '');

    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
};

/**
 * Format input value for display while user is typing
 * @param value - Current input value
 * @returns Formatted value for display
 */
export const formatRupiahInput = (value: string): string => {
    // Remove all non-digit characters
    const numbers = value.replace(/[^\d]/g, '');

    if (!numbers) return '';

    // Convert to number and format
    const numValue = parseInt(numbers, 10);
    return formatRupiah(numValue);
};

/**
 * Validate if string contains valid rupiah format
 * @param value - String to validate
 * @returns True if valid format
 */
export const isValidRupiahFormat = (value: string): boolean => {
    if (!value) return true; // Empty is valid

    // Allow digits, dots, and commas
    const rupiahRegex = /^[\d.,]+$/;
    return rupiahRegex.test(value);
};

/**
 * Get display value for rupiah input
 * @param value - Raw numeric value
 * @returns Formatted display value
 */
export const getRupiahDisplayValue = (value: string | number): string => {
    if (value === '' || value === null || value === undefined) return '';

    const numValue = typeof value === 'string' ? parseRupiah(value) : value;
    return numValue > 0 ? formatRupiah(numValue) : '';
};
