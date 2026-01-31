import { useState, Dispatch, SetStateAction } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue: Dispatch<SetStateAction<T>> = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
}


export const getSystemSchoolYear = (date?: Date): string => {
    const today = date || new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-11
    const startYear = month >= 7 ? year : year - 1; // School year starts in August (index 7)
    return `${startYear.toString().slice(-2)}/${(startYear + 1).toString().slice(-2)}`;
};

export const calculateNextSchoolYear = (current: string): string => {
    try {
        const [startStr] = current.split('/');
        const start = parseInt(startStr, 10);
        if (isNaN(start)) return getSystemSchoolYear();
        return `${String(start + 1).padStart(2, '0')}/${String(start + 2).padStart(2, '0')}`;
    } catch (e) {
        return getSystemSchoolYear();
    }
};

export const isAppleMobile = (): boolean => {
  // ARCHITEKTONISCHES MEMORANDUM: iPad-Erkennung
  // Problem: Seit iPadOS 13 melden sich iPads standardmäßig mit dem User Agent von macOS ("MacIntel").
  // Eine alleinige Prüfung von `navigator.userAgent` auf "iPad" ist daher unzuverlässig.
  // Lösung: Wir verwenden eine robustere Methode, die zwei Kriterien kombiniert:
  // 1. `navigator.platform`: Prüft auf Plattformen wie "iPhone", "iPod", "iPad".
  // 2. `navigator.maxTouchPoints > 1` auf "MacIntel": Stellt sicher, dass es sich um ein Touch-Gerät handelt.
  //    Ein iPad, das sich als "MacIntel" ausgibt, hat einen Touchscreen. Ein echter Mac in der Regel nicht.
  // Diese Kombination identifiziert alle relevanten Apple-Mobilgeräte zuverlässig.
  const platform = navigator.platform;
  const isIOS = /iPhone|iPad|iPod/.test(platform);
  const isIPadOnMacOS = platform === 'MacIntel' && navigator.maxTouchPoints > 1;

  return isIOS || isIPadOnMacOS;
};