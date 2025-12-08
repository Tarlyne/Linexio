import React, { useMemo, useEffect, useState } from 'react';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { useUIContext } from '../../context/UIContext';
import { useToolsContext } from '../../context/ToolsContext';
import { useTermineContext } from '../../context/TermineContext';
import { useLicenseContext } from '../../context/LicenseContext';
import DashboardCard from '../ui/DashboardCard';
import { BookIcon, CakeIcon, CalendarDaysIcon, ChatBubbleBottomCenterTextIcon, BellIcon, ExclamationCircleIcon, InboxArrowDownIcon, WarningTriangleIcon } from '../icons';
import { Schueler, Lerngruppe, Checkliste, ChecklistenEintrag, Termin } from '../../context/types';
import { ZITATE } from '../../data/zitate';
import { FERIEN_DATA, Ferien } from '../../data/ferien';
import { db } from '../../store/db';

interface UpcomingBirthday {
  schueler: Schueler;
  lerngruppeName: string;
  wirdAlter: number;
  geburtstag: Date;
}

type DetailInfo = {
    lerngruppeId: string;
    lerngruppeName: string;
    eintragId: string;
    eintragName: string;
    checklisteId: string;
    count: number;
};

const getInitials = (firstName: string, lastName: string) => {
    const first = firstName ? firstName[0] : '';
    const last = lastName ? lastName[0] : '';
    return `${first}${last}`.toUpperCase();
}


const FerienCountdownCard: React.FC = () => {
    const { bundesland, handleNavigate, currentDate } = useUIContext();

    const ferienInfo = useMemo(() => {
        if (!bundesland || !FERIEN_DATA[bundesland]) return null;
        
        const parseLocalDate = (dateString: string): Date => {
            const [year, month, day] = dateString.split('-').map(Number);
            return new Date(year, month - 1, day);
        };

        const today = new Date(currentDate);
        today.setHours(0, 0, 0, 0);

        const ferienListe = FERIEN_DATA[bundesland];
        const oneDay = 1000 * 60 * 60 * 24;

        // 1. Check if currently in holidays
        for (const ferien of ferienListe) {
            const start = parseLocalDate(ferien.start);
            const end = parseLocalDate(ferien.end);

            if (today >= start && today <= end) {
                const daysRemaining = Math.round((end.getTime() - today.getTime()) / oneDay) + 1;

                let nextSchoolDay = new Date(end);
                nextSchoolDay.setDate(nextSchoolDay.getDate() + 1);
                while (nextSchoolDay.getDay() === 0 || nextSchoolDay.getDay() === 6) { // 0 = Sunday, 6 = Saturday
                    nextSchoolDay.setDate(nextSchoolDay.getDate() + 1);
                }

                return {
                    name: ferien.name.replace(/\s\d{4}/, ''),
                    start,
                    end,
                    days: daysRemaining,
                    nextSchoolDay,
                    inFerien: true
                };
            }
        }

        // 2. Find next upcoming holidays
        let naechsteFerien: Ferien | null = null;
        for (const ferien of ferienListe) {
            const start = parseLocalDate(ferien.start);
            if (start > today) {
                naechsteFerien = ferien;
                break;
            }
        }

        if (naechsteFerien) {
            const start = parseLocalDate(naechsteFerien.start);
            const end = parseLocalDate(naechsteFerien.end);
            // Calculate full days BETWEEN today and start date
            const daysBetween = Math.round((start.getTime() - today.getTime()) / oneDay) - 1;

            return {
                name: naechsteFerien.name.replace(/\s\d{4}/, ''),
                start,
                end,
                days: daysBetween,
                inFerien: false
            };
        }

        // 3. No holidays found
        return { name: 'Keine anstehenden Ferien gefunden.', days: null, inFerien: false, start: null, end: null };

    }, [bundesland, currentDate]);

    const formatOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit' };
    const formatOptionsFull: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };

    return (
        <DashboardCard
            icon={<CalendarDaysIcon className="w-7 h-7" />}
            title="Ferien-Countdown"
        >
            {!bundesland ? (
                <div className="text-center w-full">
                    <p className="text-base text-[var(--color-text-tertiary)] mb-3">
                        Bitte legen Sie Ihr Bundesland fest, um den Countdown anzuzeigen.
                    </p>
                    <button onClick={() => handleNavigate('einstellungen', undefined, undefined, undefined, 'allgemein')} className="text-sm font-bold text-[var(--color-accent-text)] hover:underline">
                        Zu den Einstellungen →
                    </button>
                </div>
            ) : ferienInfo && ferienInfo.days !== null ? (
                <div className="flex flex-col justify-center w-full h-full text-center">
                    <h4 className="text-xl font-bold text-[var(--color-text-primary)]">{ferienInfo.name}</h4>
                    {ferienInfo.start && ferienInfo.end && (
                        <p className="text-sm text-[var(--color-text-tertiary)]">
                            {ferienInfo.start.toLocaleDateString('de-DE', formatOptions)} - {ferienInfo.end.toLocaleDateString('de-DE', formatOptionsFull)}
                        </p>
                    )}
                    
                    <div className="mt-4">
                        <p className="text-2xl font-bold text-[var(--color-accent-text)]">
                            {ferienInfo.inFerien 
                                ? `Noch ${ferienInfo.days} Tag${ferienInfo.days !== 1 ? 'e' : ''}`
                                : ferienInfo.days < 1
                                    ? 'Beginnt morgen'
                                    : `Beginnt in ${ferienInfo.days} Tag${ferienInfo.days !== 1 ? 'en' : ''}`
                            }
                        </p>
                        {ferienInfo.inFerien && ferienInfo.nextSchoolDay && (
                            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                Nächster Schultag: {ferienInfo.nextSchoolDay.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                 <p className="text-base text-[var(--color-text-tertiary)]">
                    {ferienInfo?.name || "Keine Feriendaten verfügbar."}
                </p>
            )}
        </DashboardCard>
    );
};

const ZitatCard: React.FC<{ currentDate: Date }> = ({ currentDate }) => {
    const quote = useMemo(() => {
        const startOfYear = new Date(currentDate.getFullYear(), 0, 0);
        const diff = currentDate.getTime() - startOfYear.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        
        const quoteIndex = dayOfYear % ZITATE.length;
        return ZITATE[quoteIndex];
    }, [currentDate]);

    return (
        <DashboardCard
            icon={<ChatBubbleBottomCenterTextIcon className="w-7 h-7" />}
            title="Zitat des Tages"
        >
            <div className="flex flex-col h-full min-h-0">
                <blockquote className="flex-grow overflow-y-auto">
                    <p className="text-base text-[var(--color-text-secondary)] italic">
                        "{quote.text}"
                    </p>
                </blockquote>
                <cite className="block text-right text-sm font-semibold text-[var(--color-accent-text)] mt-3 not-italic">
                    - {quote.author} -
                </cite>
            </div>
        </DashboardCard>
    );
};

const BackupStatusCard: React.FC = () => {
    const { handleNavigate, currentDate } = useUIContext();
    const [lastBackupTimestamp, setLastBackupTimestamp] = useState<number | null | undefined>(undefined); // undefined = loading

    useEffect(() => {
        const fetchTimestamp = async () => {
            const ts = await db.get<number>('last_backup_timestamp');
            setLastBackupTimestamp(ts || null);
        };
        fetchTimestamp();
    }, []);

    const renderContent = () => {
        if (lastBackupTimestamp === undefined) {
             return <p className="text-base text-[var(--color-text-tertiary)]">Lade Status...</p>;
        }

        if (lastBackupTimestamp === null) {
            return (
                <p className="text-base text-[var(--color-warning-text)]">
                    Es wurde noch kein Backup erstellt. Sichern Sie Ihre Daten regelmäßig.
                </p>
            );
        }

        const oneDay = 1000 * 60 * 60 * 24;
        const backupDate = new Date(lastBackupTimestamp);
        const today = new Date(currentDate);
        today.setHours(0, 0, 0, 0);
        backupDate.setHours(0, 0, 0, 0);

        const daysAgo = Math.round((today.getTime() - backupDate.getTime()) / oneDay);
        
        const dateString = new Date(lastBackupTimestamp).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

        if (daysAgo >= 14) {
            return (
                 <div>
                    <p className="text-base text-[var(--color-text-secondary)]">
                        Letztes Backup erstellt am <strong className="text-[var(--color-accent-text)] font-bold">{dateString}</strong> (vor {daysAgo} Tagen).
                    </p>
                    <p className="text-base text-[var(--color-warning-text)] mt-2 font-semibold">
                        Wir empfehlen Ihnen ein neues Backup zu erstellen.
                    </p>
                </div>
            );
        }

        let daysAgoText = '';
        if (daysAgo === 0) {
            daysAgoText = '(heute)';
        } else if (daysAgo === 1) {
            daysAgoText = '(gestern)';
        } else {
            daysAgoText = `(vor ${daysAgo} Tagen)`;
        }

        return (
            <p className="text-base text-[var(--color-text-secondary)]">
                Letztes Backup erstellt am <strong className="text-[var(--color-accent-text)] font-bold">{dateString}</strong> {daysAgoText}.
            </p>
        );
    };

    return (
        <DashboardCard
            icon={<InboxArrowDownIcon className="w-7 h-7" />}
            title="Backup-Status"
            onClick={() => handleNavigate('einstellungen', undefined, undefined, undefined, 'backup')}
        >
            {renderContent()}
        </DashboardCard>
    );
};

const DashboardView: React.FC = () => {
  const { lerngruppen, allSchueler } = useLerngruppenContext();
  const { currentSchoolYear, handleNavigate, currentDate, setHeaderConfig, onShowTool } = useUIContext();
  const { checklisten, checklistenEintraege, checklistenStati } = useToolsContext();
  const { getUpcomingTermine, checkNtaForTermin } = useTermineContext();
  const { licenseeName, licenseStatus } = useLicenseContext();

  useEffect(() => {
    const greeting = licenseeName ? `Willkommen zurück, ${licenseeName}!` : 'Willkommen zurück!';
    // const isSupporter = licenseStatus === 'PRO' || licenseStatus === 'ALPHA_TESTER'; // Crown logic removed
    
    setHeaderConfig({
      title: 'Dashboard',
      subtitle: <p className="text-sm text-[var(--color-accent-text)]">{greeting}</p>,
      onBack: undefined,
      banner: null
    });
  }, [setHeaderConfig, licenseeName, licenseStatus]);

  const currentLerngruppen: Lerngruppe[] = useMemo(() => 
    lerngruppen.filter((lg: Lerngruppe) => lg.schuljahr === currentSchoolYear),
    [lerngruppen, currentSchoolYear]
  );
  
  const currentLerngruppenSchuelerIds: Set<string> = useMemo(() => {
    const ids = new Set<string>();
    currentLerngruppen.forEach(lg => {
      lg.schuelerIds.forEach(sId => ids.add(sId));
    });
    return ids;
  }, [currentLerngruppen]);
  
  const schuelerInCurrentLerngruppen: Schueler[] = useMemo(() => 
    allSchueler.filter((s: Schueler) => currentLerngruppenSchuelerIds.has(s.id)),
    [allSchueler, currentLerngruppenSchuelerIds]
  );

  const lerngruppenCount = currentLerngruppen.length;
  const schuelerCount = schuelerInCurrentLerngruppen.length;
  
  const lerngruppenMap: Map<string, Lerngruppe> = useMemo(() => 
    new Map(lerngruppen.map((lg: Lerngruppe) => [lg.id, lg])), 
    [lerngruppen]
  );

  const schuelerIdToLerngruppenMap = useMemo(() => {
    const map = new Map<string, Lerngruppe[]>();
    for (const lg of lerngruppen) {
      for (const schuelerId of lg.schuelerIds) {
        if (!map.has(schuelerId)) {
          map.set(schuelerId, []);
        }
        map.get(schuelerId)!.push(lg);
      }
    }
    return map;
  }, [lerngruppen]);

  const fehlendeAbgabenInfo = useMemo(() => {
    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);

    const currentLerngruppenIds: Set<string> = new Set(currentLerngruppen.map((lg: Lerngruppe) => lg.id));
    const currentChecklisten: Checkliste[] = checklisten.filter((c: Checkliste) => currentLerngruppenIds.has(c.lerngruppeId));
    const currentChecklistenIds: Set<string> = new Set(currentChecklisten.map((c: Checkliste) => c.id));
    const currentChecklistenMap: Map<string, Checkliste> = new Map(currentChecklisten.map((c: Checkliste) => [c.id, c]));

    const overdueEintraege: ChecklistenEintrag[] = checklistenEintraege.filter((e: ChecklistenEintrag) => {
        if (!currentChecklistenIds.has(e.checklisteId)) return false;
        if (!e.faelligkeitsdatum) return false;
        const dueDate = new Date(e.faelligkeitsdatum);
        return dueDate < today;
    });

    if (overdueEintraege.length === 0) {
        return { details: [], totalCount: 0, lerngruppenCount: 0 };
    }
    
    const details: DetailInfo[] = [];

    for (const eintrag of overdueEintraege) {
        const parentCheckliste = currentChecklistenMap.get(eintrag.checklisteId);
        if (!parentCheckliste) continue;
        
        const lerngruppe = lerngruppenMap.get(parentCheckliste.lerngruppeId);
        if (!lerngruppe) continue;
        
        const schuelerIdsInLerngruppe = lerngruppe.schuelerIds;

        const missingCountInThisEintrag = schuelerIdsInLerngruppe.reduce((count: number, schuelerId: string) => {
            const status = checklistenStati[eintrag.id]?.[schuelerId] || 'offen';
            if (status === 'offen' || status === 'nicht-erledigt') {
                return count + 1;
            }
            return count;
        }, 0);
        
        if (missingCountInThisEintrag > 0) {
            details.push({
                lerngruppeId: lerngruppe.id,
                lerngruppeName: lerngruppe.name,
                eintragId: eintrag.id,
                eintragName: eintrag.name,
                checklisteId: parentCheckliste.id,
                count: missingCountInThisEintrag
            });
        }
    }

    const totalCount: number = details.reduce((sum: number, item: DetailInfo) => sum + item.count, 0);
    const lerngruppenCount: number = new Set(details.map((item: DetailInfo) => item.lerngruppeId)).size;

    return { details, totalCount, lerngruppenCount };
  }, [checklisten, checklistenEintraege, checklistenStati, currentLerngruppen, currentDate, lerngruppenMap]);


  const upcomingBirthdays: UpcomingBirthday[] = useMemo(() => {
    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);
    const inSevenDays = new Date(today);
    inSevenDays.setDate(today.getDate() + 7);

    const birthdays: UpcomingBirthday[] = [];

    allSchueler.forEach((schueler: Schueler) => {
      if (!schueler.birthday) return;

      const [year, month, day] = schueler.birthday.split('-').map(Number);
      const birthDateThisYear = new Date(today.getFullYear(), month - 1, day);
      
      let nextBirthday: Date;
      if (birthDateThisYear < today) {
        nextBirthday = new Date(today.getFullYear() + 1, month - 1, day);
      } else {
        nextBirthday = birthDateThisYear;
      }

      if (nextBirthday >= today && nextBirthday < inSevenDays) {
        const lerngruppenForSchueler = schuelerIdToLerngruppenMap.get(schueler.id) || [];
        const currentYearLerngruppen = lerngruppenForSchueler.filter(lg => lg.schuljahr === currentSchoolYear);
        
        if(currentYearLerngruppen.length > 0) {
            const birthDate = new Date(schueler.birthday);
            const age = nextBirthday.getFullYear() - birthDate.getFullYear();
            
            birthdays.push({
              schueler,
              lerngruppeName: currentYearLerngruppen.map(lg => lg.name).join(', '),
              wirdAlter: age,
              geburtstag: nextBirthday,
            });
        }
      }
    });

    return birthdays.sort((a: UpcomingBirthday, b: UpcomingBirthday) => a.geburtstag.getTime() - b.geburtstag.getTime());
  }, [allSchueler, schuelerIdToLerngruppenMap, currentSchoolYear, currentDate]);
  
  const groupedBirthdays: Record<string, UpcomingBirthday[]> = useMemo(() => {
    return upcomingBirthdays.reduce<Record<string, UpcomingBirthday[]>>((groups: Record<string, UpcomingBirthday[]>, birthday: UpcomingBirthday) => {
        const dateString = [
            birthday.geburtstag.getFullYear(),
            (birthday.geburtstag.getMonth() + 1).toString().padStart(2, '0'),
            birthday.geburtstag.getDate().toString().padStart(2, '0')
        ].join('-');
        if (!groups[dateString]) {
            groups[dateString] = [];
        }
        groups[dateString].push(birthday);
        return groups;
    }, {});
  }, [upcomingBirthdays]);
  
  const getBirthdayLabel = (dateString: string) => {
    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const birthdayDate = new Date(dateString);
    birthdayDate.setMinutes(birthdayDate.getMinutes() + birthdayDate.getTimezoneOffset());
    
    if (birthdayDate.getTime() === today.getTime()) return 'Heute';
    if (birthdayDate.getTime() === tomorrow.getTime()) return 'Morgen';

    return birthdayDate.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' });
  };

  const numberToGermanWord = (n: number): string => {
    if (n === 0) return 'keine';
    if (n === 1) return 'eine';
    const words = ['zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];
    if (n > 1 && n <= 12) {
      return words[n - 2];
    }
    return n.toString();
  };

  // --- TERMIN LOGIK START ---
  const upcomingTermine = useMemo(() => getUpcomingTermine(14), [getUpcomingTermine]);

  const getTerminDateLabel = (dateString: string) => {
    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // YYYY-MM-DD Parsing for local date
    const [y, m, d] = dateString.split('-').map(Number);
    const terminDate = new Date(y, m - 1, d);
    
    if (terminDate.getTime() === today.getTime()) return 'Heute';
    if (terminDate.getTime() === tomorrow.getTime()) return 'Morgen';

    return terminDate.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' });
  };

  const groupedTermine = useMemo(() => {
    const groups: Record<string, Termin[]> = {};
    upcomingTermine.forEach(t => {
        if (!groups[t.date]) groups[t.date] = [];
        groups[t.date].push(t);
    });
    // Sort keys (dates)
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [upcomingTermine]);
  // --- TERMIN LOGIK ENDE ---

  const lerngruppenCountText = numberToGermanWord(lerngruppenCount);

  return (
    <div className="h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-3 gap-6 auto-rows-fr h-full">
        {/* Pos 1 */}
        <DashboardCard
          icon={<BookIcon className="w-7 h-7" />}
          title="Aktueller Überblick"
          onClick={() => handleNavigate('lerngruppen')}
        >
          <p className="text-base text-[var(--color-text-secondary)]">
            Sie verwalten aktuell{' '}
            <strong className="text-[var(--color-accent-text)] font-bold">{lerngruppenCountText}</strong>{' '}
            Lerngruppe{lerngruppenCount !== 1 ? 'n' : ''} mit insgesamt{' '}
            <strong className="text-[var(--color-accent-text)] font-bold">{schuelerCount}</strong>{' '}
            SchülerInnen.
          </p>
        </DashboardCard>

        {/* Pos 2 */}
        <ZitatCard currentDate={currentDate} />

        {/* Pos 3 & 6 */}
        <div className="lg:row-span-2 flex">
          <DashboardCard
            icon={<CakeIcon className="w-7 h-7" />}
            title="Anstehende Geburtstage"
          >
            {Object.keys(groupedBirthdays).length > 0 ? (
              <div className="space-y-4 -mx-1 pr-2 overflow-y-auto h-full max-h-[calc(100%-3rem)]">
                {Object.entries(groupedBirthdays).map(([dateString, birthdays]: [string, UpcomingBirthday[]]) => (
                  <div key={dateString}>
                    <h4 className="text-sm font-bold text-[var(--color-accent-text)] mb-2 px-1">
                      {getBirthdayLabel(dateString)}
                    </h4>
                    <ul className="space-y-2">
                      {birthdays.map(({ schueler, lerngruppeName, wirdAlter }: UpcomingBirthday) => (
                        <li key={schueler.id} className="flex items-center space-x-3 p-1 rounded-md">
                          <div className="w-9 h-9 bg-gradient-to-br from-[var(--color-accent-primary-hover)] to-[var(--color-accent-primary)] text-[var(--color-accent-text-inverted)] rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                                {getInitials(schueler.firstName, schueler.lastName)}
                            </div>
                          <div className="flex-grow min-w-0">
                                <p className="font-semibold text-[var(--color-text-primary)] truncate">
                                    {schueler.lastName}, {schueler.firstName}
                                    <span className="text-sm font-normal text-[var(--color-text-tertiary)] ml-2">(wird {wirdAlter})</span>
                                </p>
                                <p className="text-sm text-[var(--color-text-tertiary)] truncate">{lerngruppeName}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-base text-[var(--color-text-tertiary)]">
                In den nächsten 7 Tagen hat niemand Geburtstag.
              </p>
            )}
          </DashboardCard>
        </div>

        {/* Pos 4 */}
        <DashboardCard
            icon={<ExclamationCircleIcon className="w-7 h-7" />}
            title="Checklisten"
        >
            {fehlendeAbgabenInfo.totalCount === 0 ? (
                <p className="text-base text-[var(--color-text-tertiary)]">
                    Alle fälligen Abgaben sind erledigt. Super!
                </p>
            ) : fehlendeAbgabenInfo.details.length > 3 ? (
                 <button onClick={() => onShowTool('checklisten')} className="text-left w-full h-full">
                    <p className="text-base text-[var(--color-text-secondary)]">
                        Es gibt <strong className="text-[var(--color-warning-text)] font-bold">{fehlendeAbgabenInfo.totalCount}</strong> offene Einträge in <strong className="text-[var(--color-warning-text)] font-bold">{fehlendeAbgabenInfo.lerngruppenCount}</strong> Lerngruppe{fehlendeAbgabenInfo.lerngruppenCount !== 1 ? 'n' : ''}.
                    </p>
                    <p className="text-sm text-[var(--color-accent-text)] mt-2 font-semibold">Details anzeigen →</p>
                </button>
            ) : (
                <div className="overflow-y-auto -m-2 pr-2">
                    <div className="space-y-2 p-2">
                        {fehlendeAbgabenInfo.details.map((item: DetailInfo) => (
                            <button 
                                key={item.eintragId} 
                                onClick={() => onShowTool('checklisten', item.lerngruppeId, item.checklisteId)}
                                className="text-left w-full p-2 rounded-lg hover:bg-[var(--color-ui-secondary)] transition-colors"
                            >
                                <p className="text-base text-[var(--color-text-secondary)]">
                                    <strong className="text-[var(--color-warning-text)] font-bold">{item.count} offen</strong> bei <strong className="text-[var(--color-text-primary)]">{item.eintragName}</strong>
                                </p>
                                <p className="text-sm text-[var(--color-text-tertiary)]">{item.lerngruppeName}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </DashboardCard>

        {/* Pos 5 & 8 - Termine (WIDGET) */}
        <div className="lg:row-span-2 flex">
            <DashboardCard
                icon={<BellIcon className="w-7 h-7" />}
                title="Anstehende Termine"
                onClick={() => handleNavigate('termine' as any)} 
            >
                {groupedTermine.length > 0 ? (
                    <div className="space-y-4 overflow-y-auto -mx-2 pr-2 h-full max-h-[calc(100%-1rem)]">
                        {groupedTermine.map(([dateString, termines]) => (
                            <div key={dateString}>
                                <h4 className="text-sm font-bold text-[var(--color-accent-text)] mb-2 px-2">
                                    {getTerminDateLabel(dateString)}
                                </h4>
                                <div className="space-y-2">
                                    {termines.map(termin => {
                                        const hasNTA = termin.kategorie === 'KLAUSUR' && termin.lerngruppeId && checkNtaForTermin(termin.lerngruppeId).length > 0;
                                        const linkedSchueler = termin.schuelerId ? allSchueler.find(s => s.id === termin.schuelerId) : null;

                                        const borderColor = {
                                            'KLAUSUR': 'border-red-500',
                                            'KONFERENZ': 'border-blue-500',
                                            'ELTERNGESPRAECH': 'border-purple-500',
                                            'SONSTIGES': 'border-gray-400',
                                        }[termin.kategorie];

                                        return (
                                            <div key={termin.id} className={`flex flex-col p-2 pl-3 border-l-4 ${borderColor} transition-colors hover:bg-[var(--color-ui-secondary)]/30 rounded-r-md`}>
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <h4 className="font-bold text-[var(--color-text-primary)] truncate text-sm">
                                                        {termin.title} 
                                                        {linkedSchueler && (
                                                            <span className="font-normal text-[var(--color-accent-text)] ml-1">
                                                                ({linkedSchueler.firstName} {linkedSchueler.lastName})
                                                            </span>
                                                        )}
                                                    </h4>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <p className="text-xs text-[var(--color-text-tertiary)]">
                                                        {termin.startTime} {termin.endTime ? `- ${termin.endTime}` : ''} Uhr
                                                    </p>
                                                    {hasNTA && (
                                                        <div className="flex items-center text-[var(--color-warning-text)] text-xs font-medium">
                                                            <WarningTriangleIcon className="w-3 h-3 mr-1" />
                                                            <span>NTA</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-base text-[var(--color-text-tertiary)]">
                        Keine Termine in den nächsten 14 Tagen.
                    </p>
                )}
            </DashboardCard>
        </div>

        {/* Pos 7 */}
        <BackupStatusCard />

        {/* Pos 9 */}
        <FerienCountdownCard />

      </div>
    </div>
  );
};

export default DashboardView;