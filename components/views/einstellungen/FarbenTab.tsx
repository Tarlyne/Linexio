import React from 'react';
import { Theme } from '../../../context/UIContext';
import { CheckIcon } from '../../icons';

interface ThemesTabProps {
    activeTheme: Theme;
    onChangeTheme: (theme: Theme) => void;
}

interface ThemeOption {
    id: Theme;
    name: string;
    preview: {
        bg: string;
        sidebar: string;
        main: string;
        accent: string;
    }
}

const themes: ThemeOption[] = [
    {
        id: 'dark',
        name: 'Aurora Nocturne',
        preview: {
            bg: 'bg-gray-900',
            sidebar: 'bg-gray-800',
            main: 'bg-gray-800',
            accent: 'bg-cyan-500',
        }
    },
    {
        id: 'terranova',
        name: 'Terranova',
        preview: {
            bg: 'bg-[#101418]',
            sidebar: 'bg-[#1A2027]',
            main: 'bg-[#1A2027]',
            accent: 'bg-green-500',
        }
    },
    {
        id: 'solaris',
        name: 'Solaris',
        preview: {
            bg: 'bg-gray-100',
            sidebar: 'bg-white',
            main: 'bg-white',
            accent: 'bg-blue-500',
        }
    },
    {
        id: 'sepia',
        name: 'Sepia',
        preview: {
            bg: 'bg-stone-100',
            sidebar: 'bg-white',
            main: 'bg-white',
            accent: 'bg-orange-600',
        }
    },
    {
        id: 'amethyst',
        name: 'Amethyst',
        preview: {
            bg: 'bg-[#161625]',
            sidebar: 'bg-[#211F33]',
            main: 'bg-[#211F33]',
            accent: 'bg-purple-500',
        }
    },
    {
        id: 'scribe',
        name: 'Scribe',
        preview: {
            bg: 'bg-[#1c1917]',
            sidebar: 'bg-[#292524]',
            main: 'bg-[#292524]',
            accent: 'bg-amber-500',
        }
    }
];

const ThemeCard: React.FC<{ option: ThemeOption; isActive: boolean; onClick: () => void; }> = ({ option, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${isActive ? 'border-[var(--color-accent-border-focus)] bg-[var(--color-accent-secondary-transparent-50)]' : 'border-[var(--color-border)] hover:border-[var(--color-ui-tertiary)]'}`}
        >
            <div className={`w-full h-24 rounded-md flex p-3 gap-3 ${option.preview.bg}`}>
                <div className={`w-1/4 rounded-sm ${option.preview.sidebar}`}></div>
                <div className={`w-3/4 flex flex-col gap-2`}>
                    <div className={`h-4 w-1/3 rounded-sm ${option.preview.accent}`}></div>
                    <div className={`h-full w-full rounded-sm ${option.preview.main}`}></div>
                </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
                <span className="font-semibold text-[var(--color-text-primary)]">{option.name}</span>
                {isActive && (
                    <div className="w-6 h-6 rounded-full bg-[var(--color-accent-primary)] flex items-center justify-center">
                        <CheckIcon className="w-4 h-4 text-[var(--color-text-primary)]" />
                    </div>
                )}
            </div>
        </button>
    );
};

const ThemesTab: React.FC<ThemesTabProps> = ({ activeTheme, onChangeTheme }) => {
    return (
        <div className="bg-[var(--color-ui-primary)] p-8 rounded-lg border border-[var(--color-border)] w-full max-w-3xl space-y-6 mx-auto">
            <div>
                <h3 className="text-xl font-bold text-[var(--color-accent-text)] mb-2">Themes</h3>
                <p className="text-[var(--color-text-tertiary)]">
                    Wählen Sie das Erscheinungsbild, das Ihnen am besten gefällt. Ihre Auswahl wird auf diesem Gerät gespeichert.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {themes.map(themeOption => (
                    <ThemeCard
                        key={themeOption.id}
                        option={themeOption}
                        isActive={activeTheme === themeOption.id}
                        onClick={() => onChangeTheme(themeOption.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default ThemesTab;