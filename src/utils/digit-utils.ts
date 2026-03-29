/**
 * Utility to normalize Bengali digits to English digits for numeric processing.
 */
export function normalizeBengaliDigits(input: string | number): number {
    if (input === undefined || input === null) return 0;
    if (typeof input === 'number') return input;

    const bengaliToEnglish: { [key: string]: string } = {
        '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
        '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
    };

    const normalized = input.toString().replace(/[০-৯]/g, (digit) => bengaliToEnglish[digit]);
    return parseFloat(normalized) || 0;
}

/**
 * Utility to check if a string contains Bengali digits.
 */
export function hasBengaliDigits(input: string): boolean {
    return /[০-৯]/.test(input);
}
