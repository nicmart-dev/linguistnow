// src/utils.js

/**
 * Get the date 7 days from today.
 * @returns {string} The date in a human-readable format.
 */
export const availableUntil = () => {
    const today = new Date();
    const aWeekFromToday = new Date(today);
    aWeekFromToday.setDate(today.getDate() + 7);

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return aWeekFromToday.toLocaleDateString(undefined, options);
};