const VALID_TIME_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

/**
 * Returns current date in YYYY-MM-DD formatted string in local time.
 */
function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validates reading input fields according to business requirements:
 * 1. Value is required -> "Please enter a glucose value."
 * 2. Value must be a whole number between 40 and 600 -> "Value must be between 40 and 600 mg/dl."
 * 3. Date cannot be in the future -> "Date cannot be in the future."
 * 4. Slot must be one of the four allowed slots.
 */
function validateReadingInput({ reading_date, time_slot, glucose_value }) {
  const errors = [];

  // 1. Date validation
  if (!reading_date || typeof reading_date !== 'string') {
    errors.push('Date is required.');
  } else {
    const trimmedDate = reading_date.trim().slice(0, 10);
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(trimmedDate)) {
      errors.push('Date must be in YYYY-MM-DD format.');
    } else {
      const today = getTodayDateString();
      if (trimmedDate > today) {
        errors.push('Date cannot be in the future.');
      }
    }
  }

  // 2. Time slot validation
  if (!time_slot || typeof time_slot !== 'string') {
    errors.push('Time slot is required.');
  } else if (!VALID_TIME_SLOTS.includes(time_slot.trim())) {
    errors.push(
      `Invalid time slot. Allowed values: ${VALID_TIME_SLOTS.join(', ')}`
    );
  }

  // 3. Glucose value validation
  if (
    glucose_value === undefined ||
    glucose_value === null ||
    glucose_value === '' ||
    (typeof glucose_value === 'string' && glucose_value.trim() === '')
  ) {
    errors.push('Please enter a glucose value.');
  } else {
    const num = Number(glucose_value);
    if (!Number.isInteger(num) || num < 40 || num > 600) {
      errors.push('Value must be between 40 and 600 mg/dl.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  VALID_TIME_SLOTS,
  getTodayDateString,
  validateReadingInput
};
