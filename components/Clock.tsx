import React from 'react';
import { useUIContext } from '../context/UIContext';

/**
 * Calculates the ISO 8601 week number for a given date.
 * @param d The date for which to calculate the week number.
 * @returns The calendar week number.
 */
const getWeekNumber = (d: Date): number => {
    // Copy date so don't modify original
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Get first day of year
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
}

const Clock: React.FC = () => {
    const { currentDate } = useUIContext();

    const formatOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' };
    const dateString = currentDate.toLocaleDateString('de-DE', formatOptions);
    const [dayOfWeek, datePart] = dateString.split(', ');

    const weekNumber = getWeekNumber(currentDate);

    return (
        <div className="text-sm text-right">
            <div className="text-[var(--color-text-tertiary)] font-medium">{dayOfWeek}, {datePart}</div>
            <div className="text-[var(--color-accent-text)] font-semibold">{weekNumber}. KW</div>
        </div>
    );
};

export default Clock;