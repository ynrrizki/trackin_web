/**
 * Password generation utilities
 */

export interface PasswordGeneratorOptions {
    length?: number;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
    excludeSimilarChars?: boolean;
}

const DEFAULT_OPTIONS: Required<PasswordGeneratorOptions> = {
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilarChars: false,
};

/**
 * Generate a random password with customizable options
 */
export const generatePassword = (options: PasswordGeneratorOptions = {}): string => {
    const config = { ...DEFAULT_OPTIONS, ...options };

    let charset = '';

    if (config.includeLowercase) {
        charset += config.excludeSimilarChars ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
    }

    if (config.includeUppercase) {
        charset += config.excludeSimilarChars ? 'ABCDEFGHJKMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }

    if (config.includeNumbers) {
        charset += config.excludeSimilarChars ? '23456789' : '0123456789';
    }

    if (config.includeSymbols) {
        charset += '!@#$%^&*';
    }

    if (charset === '') {
        throw new Error('At least one character type must be included');
    }

    let password = '';
    for (let i = 0; i < config.length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
};

/**
 * Generate a simple random password (backward compatibility)
 */
export const generateSimplePassword = (length: number = 12): string => {
    return generatePassword({ length });
};

/**
 * Validate password strength
 */
export interface PasswordStrength {
    score: number; // 0-4
    feedback: string[];
    isValid: boolean;
}

export const validatePasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
        score += 1;
    } else {
        feedback.push('Password should be at least 8 characters long');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
        score += 1;
    } else {
        feedback.push('Password should include uppercase letters');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
        score += 1;
    } else {
        feedback.push('Password should include lowercase letters');
    }

    // Number check
    if (/\d/.test(password)) {
        score += 1;
    } else {
        feedback.push('Password should include numbers');
    }

    // Symbol check
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
        score += 1;
    } else if (score < 4) {
        feedback.push('Password should include special characters');
    }

    return {
        score: Math.min(score, 4),
        feedback,
        isValid: score >= 3,
    };
};
