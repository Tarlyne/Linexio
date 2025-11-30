import React, { useState, useEffect, useMemo } from 'react';
import { useTermineContext } from '../../context/TermineContext';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { useUIContext } from '../../context/UIContext';
import { Termin, TerminKategorie, Schueler } from '../../context/types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import { PlusIcon, ClipboardDocumentCheckIcon, UserGroupIcon, ChatBubbleLeftRightIcon, SparklesIcon, ClockIcon, WarningTriangleIcon, CalendarIcon } from '../icons';
import { useToastContext } from '../../context/ToastContext';
import ConfirmDeleteTerminModal from '../modals/ConfirmDeleteTerminModal';
import { getFeiertage } from '../../utils/feiertage';

// --- Helper Components ---

const CategoryBadge: React.FC<{ category: TerminKategorie }> = ({ category }) => {
    const config = {
        'KLAUSUR': { label: 'Klausur', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', border: 'border-red-200 dark:border-red-800', icon: <ClipboardDocumentCheckIcon className="w-4 h-4" /> },
        'KONFERENZ': { label: 'Konferenz', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-200 dark:border-blue-800', icon: <UserGroupIcon className="w-4 h-4" /> },
        'ELTERNGESPRAECH': { label: 'Elterngespräch', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-200', border: 'border-purple-200 dark:border-purple-800', icon: <ChatBubbleLeftRightIcon className="w-4 h-4" /> },
        'SONSTIGES': { label: 'Sonstiges', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-200', border: 'border-gray-200 dark:border-gray-700', icon: <SparklesIcon className="w-4 h-4" /> },
    }[category];

    return (
        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
            {config.icon}
            <span>{config.label}</span>
        </span>
    );
};

const TerminItem: React.FC<{ termin: Termin, onEdit: (t: Termin) => void, checkNta: (id: string) => any[], allSchueler: Schueler[] }> = ({ termin, onEdit, checkNta, allSchueler }) => {
    const date = new Date(termin.date);
    const day = date.getDate();
    const month = date.toLocaleDateString('de-DE', { month: 'short' });
    const weekday = date.toLocaleDateString('de-DE', { weekday: 'short' });

    if (termin.isFeiertag) {
        return (
             <div className="w-full flex items-stretch bg-[var(--color-ui-secondary)]/50 border border-[var(--color-border)] rounded-lg overflow-hidden mb-3 opacity-80">
                {/* Date Column */}
                <div className="flex flex-col items-center justify-center w-16 bg-[var(--color-ui-secondary)] border-r border-[var(--color-border)] p-2 flex-shrink-0">
                    <span className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase">{weekday}</span>
                    <span className="text-xl font-bold text-[var(--color-text-secondary)] leading-none my-1">{day}</span>
                    <span className="text-xs font-medium text-[var(--color-text-tertiary)]">{month}</span>
                </div>
                {/* Content Column */}
                <div className="flex-grow p-3 flex flex-col justify-center min-w-0">
                     <div className="flex justify-between items-start">
                        <h4 className="font-bold text-[var(--color-text-secondary)] truncate flex items-center">
                            <SparklesIcon className="w-4 h-4 mr-2 text-[var(--color-accent-text)]" />
                            {termin.title}
                        </h4>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-[var(--color-border)] text-[var(--color-text-tertiary)]">Feiertag</span>
                     </div>
                </div>
            </div>
        );
    }

    const ntaSchueler = termin.lerngruppeId ? checkNta(termin.lerngruppeId) : [];
    const showNtaWarning = termin.kategorie === 'KLAUSUR' && ntaSchueler.length > 0;

    const linkedSchueler = termin.schuelerId ? allSchueler.find(s => s.id === termin.schuelerId) : null;

    return (
        <button onClick={() => onEdit(termin)} className="w-full flex items-stretch bg-[var(--color-ui-primary)] border border-[var(--color-border)] rounded-lg overflow-hidden hover:border-[var(--color-accent-border-focus)] transition-all group text-left mb-3 shadow-sm hover:shadow-md">
            {/* Date Column */}
            <div className="flex flex-col items-center justify-center w-16 bg-[var(--color-ui-secondary)] border-r border-[var(--color-border)] p-2 flex-shrink-0">
                <span className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase">{weekday}</span>
                <span className="text-xl font-bold text-[var(--color-text-primary)] leading-none my-1">{day}</span>
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">{month}</span>
            </div>

            {/* Content Column */}
            <div className="flex-grow p-3 flex flex-col justify-center min-w-0">
                <div className="flex justify-between items-start mb-1">
                    <div className="flex flex-col min-w-0 pr-2">
                        <h4 className="font-bold text-[var(--color-text-primary)] truncate">{termin.title}</h4>
                        {linkedSchueler && (
                            <span className="text-sm text-[var(--color-text-secondary)] truncate">
                                {linkedSchueler.firstName} {linkedSchueler.lastName}
                            </span>
                        )}
                    </div>
                    <CategoryBadge category={termin.kategorie} />
                </div>
                
                <div className="flex items-center text-xs text-[var(--color-text-tertiary)] space-x-3">
                     <div className="flex items-center">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        {termin.startTime} {termin.endTime ? `- ${termin.endTime}` : ''} Uhr
                    </div>
                    {showNtaWarning && (
                        <div className="flex items-center text-[var(--color-warning-text)] font-medium">
                            <WarningTriangleIcon className="w-3 h-3 mr-1" />
                            {ntaSchueler.length}x NTA
                        </div>
                    )}
                </div>
            </div>
        </button>
    );
};


const TermineView: React.FC = () => {
    const { termine, onAddTermin, onUpdateTermin, onDeleteTermin, checkNtaForTermin } = useTermineContext();
    const { setHeaderConfig, currentSchoolYear, bundesland } = useUIContext();
    const { lerngruppen, allSchueler } = useLerngruppenContext();
    const { showToast } = useToastContext();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [terminToEdit, setTerminToEdit] = useState<Termin | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    // Form State
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [kategorie, setKategorie] = useState<TerminKategorie>('SONSTIGES');
    const [lerngruppeId, setLerngruppeId] = useState('');
    const [schuelerId, setSchuelerId] = useState('');
    const [notiz, setNotiz] = useState('');
    
    const [showNtaInfo, setShowNtaInfo] = useState(false);

    useEffect(() => {
        setHeaderConfig({
            title: 'Termine',
            subtitle: <p className="text-sm text-[var(--color-accent-text)]">Meine Agenda</p>,
        });
    }, [setHeaderConfig]);

    // Group termine by month + Mix in Feiertage
    const groupedTermineList = useMemo(() => {
        const list: { month: string, termines: Termin[] }[] = [];
        let currentMonth = '';
        let currentGroup: Termin[] = [];
        
        const today = new Date();
        const limitDate = new Date(today);
        limitDate.setFullYear(today.getFullYear() + 1);

        const todayString = [
            today.getFullYear(),
            (today.getMonth() + 1).toString().padStart(2, '0'),
            today.getDate().toString().padStart(2, '0')
        ].join('-');
        
        const limitString = [
            limitDate.getFullYear(),
            (limitDate.getMonth() + 1).toString().padStart(2, '0'),
            limitDate.getDate().toString().padStart(2, '0')
        ].join('-');

        // 1. Generate Feiertage for current and next year (covering the 1-year window)
        const years = new Set<number>();
        years.add(today.getFullYear());
        years.add(limitDate.getFullYear());
        
        let allFeiertage: Termin[] = [];
        years.forEach(year => {
            allFeiertage = [...allFeiertage, ...getFeiertage(year, bundesland)];
        });

        // Filter holidays: from today up to exactly 1 year in the future
        const relevantFeiertage = allFeiertage.filter(t => t.date >= todayString && t.date <= limitString);

        // 2. Merge and Sort
        const allItems = [...termine, ...relevantFeiertage].sort((a, b) => {
             const dateA = new Date(a.date);
             const dateB = new Date(b.date);
             if (dateA.getTime() !== dateB.getTime()) return dateA.getTime() - dateB.getTime();
             return a.startTime.localeCompare(b.startTime);
        });
        
        allItems.forEach(t => {
            const dateObj = new Date(t.date);
            const monthStr = dateObj.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
            
            if (monthStr !== currentMonth) {
                if (currentMonth) {
                    list.push({ month: currentMonth, termines: currentGroup });
                }
                currentMonth = monthStr;
                currentGroup = [];
            }
            currentGroup.push(t);
        });
        if (currentMonth) {
            list.push({ month: currentMonth, termines: currentGroup });
        }
        return list;
    }, [termine, bundesland]);


    const openAddModal = () => {
        setTerminToEdit(null);
        // Reset form
        setTitle('');
        setDate(new Date().toISOString().split('T')[0]);
        setStartTime('08:00');
        setEndTime('');
        setKategorie('SONSTIGES');
        setLerngruppeId('');
        setSchuelerId('');
        setNotiz('');
        setShowNtaInfo(false);
        setIsModalOpen(true);
    };

    const openEditModal = (t: Termin) => {
        if (t.isFeiertag) return; // Prevent editing holidays
        setTerminToEdit(t);
        setTitle(t.title);
        setDate(t.date);
        setStartTime(t.startTime);
        setEndTime(t.endTime || '');
        setKategorie(t.kategorie);
        setLerngruppeId(t.lerngruppeId || '');
        setSchuelerId(t.schuelerId || '');
        setNotiz(t.notiz || '');
        setShowNtaInfo(false);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const terminData = {
            title,
            date,
            startTime,
            endTime: endTime || undefined,
            kategorie,
            lerngruppeId: lerngruppeId || undefined,
            schuelerId: schuelerId || undefined,
            notiz: notiz || undefined,
            schuljahr: currentSchoolYear
        };

        if (terminToEdit) {
            await onUpdateTermin(terminToEdit.id, terminData);
            showToast('Termin aktualisiert', 'success');
        } else {
            await onAddTermin(terminData);
            showToast('Termin erstellt', 'success');
        }
        setIsModalOpen(false);
    };
    
    const handleDeleteRequest = () => {
        setIsModalOpen(false);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (terminToEdit) {
            await onDeleteTermin(terminToEdit.id);
            showToast('Termin gelöscht', 'success');
            setIsDeleteModalOpen(false);
            setTerminToEdit(null);
        }
    };

    const handleCancelDelete = () => {
        setIsDeleteModalOpen(false);
        setIsModalOpen(true);
    };

    const currentNtaSchueler = useMemo(() => {
        if (!lerngruppeId) return [];
        return checkNtaForTermin(lerngruppeId);
    }, [lerngruppeId, checkNtaForTermin]);
    
    const currentLerngruppen = useMemo(() => 
        lerngruppen.filter(lg => lg.schuljahr === currentSchoolYear),
    [lerngruppen, currentSchoolYear]);

    const availableStudentsForSelection = useMemo(() => {
        if (!lerngruppeId) return [];
        const group = lerngruppen.find(lg => lg.id === lerngruppeId);
        if (!group) return [];
        return allSchueler
            .filter(s => group.schuelerIds.includes(s.id))
            .sort((a, b) => a.lastName.localeCompare(b.lastName));
    }, [lerngruppeId, lerngruppen, allSchueler]);

    return (
        <>
            <div className="flex justify-end mb-6">
                <Button onClick={openAddModal}>
                    <PlusIcon className="w-5 h-5" />
                    <span>Neuer Termin</span>
                </Button>
            </div>

            <div className="max-w-3xl mx-auto space-y-8 pb-20">
                {groupedTermineList.length > 0 ? (
                    groupedTermineList.map((group) => (
                        <div key={group.month}>
                            <h3 className="text-lg font-bold text-[var(--color-accent-text)] pt-4 pb-2 mb-2">
                                {group.month}
                            </h3>
                            <div className="space-y-2">
                                {group.termines.map(t => (
                                    <TerminItem key={t.id} termin={t} onEdit={openEditModal} checkNta={checkNtaForTermin} allSchueler={allSchueler} />
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center p-12 bg-[var(--color-ui-primary)] rounded-lg border border-[var(--color-border)]">
                        <CalendarIcon className="w-16 h-16 mx-auto text-[var(--color-text-tertiary)] mb-4" />
                        <h3 className="text-xl font-semibold text-[var(--color-text-secondary)]">Keine Termine</h3>
                        <p className="text-[var(--color-text-tertiary)] mt-2">Erstellen Sie Ihren ersten Termin, um Ihre Agenda zu füllen.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={terminToEdit ? 'Termin bearbeiten' : 'Neuer Termin'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    <Select
                        label="Kategorie"
                        id="termin-kategorie"
                        value={kategorie}
                        onChange={e => setKategorie(e.target.value as TerminKategorie)}
                        options={[
                            { value: 'KLAUSUR', label: 'Klausur / Arbeit' },
                            { value: 'KONFERENZ', label: 'Konferenz / Dienstbesprechung' },
                            { value: 'ELTERNGESPRAECH', label: 'Elterngespräch' },
                            { value: 'SONSTIGES', label: 'Sonstiges' },
                        ]}
                        required
                    />
                    
                    {(kategorie === 'KLAUSUR' || kategorie === 'ELTERNGESPRAECH') && (
                        <div className="space-y-2">
                            <Select
                                label="Verknüpfte Lerngruppe (Optional)"
                                id="termin-lerngruppe"
                                value={lerngruppeId}
                                onChange={e => {
                                    setLerngruppeId(e.target.value);
                                    setSchuelerId(''); // Reset student selection when group changes
                                }}
                                options={[
                                    { value: '', label: 'Keine Auswahl' },
                                    ...currentLerngruppen.map(lg => ({ value: lg.id, label: lg.name }))
                                ]}
                            />
                            
                            {kategorie === 'ELTERNGESPRAECH' && lerngruppeId && (
                                <Select
                                    label="SchülerIn (Optional)"
                                    id="termin-schueler"
                                    value={schuelerId}
                                    onChange={e => setSchuelerId(e.target.value)}
                                    options={[
                                        { value: '', label: 'Keine Auswahl' },
                                        ...availableStudentsForSelection.map(s => ({ value: s.id, label: `${s.lastName}, ${s.firstName}` }))
                                    ]}
                                />
                            )}
                            
                            {lerngruppeId && currentNtaSchueler.length > 0 && kategorie === 'KLAUSUR' && (
                                <div className="bg-[var(--color-warning-secondary-transparent)] border border-[var(--color-warning-text)]/30 rounded-lg p-3 mt-2">
                                    <button 
                                        type="button"
                                        onClick={() => setShowNtaInfo(!showNtaInfo)}
                                        className="flex items-center justify-between w-full text-left"
                                    >
                                        <div className="flex items-center text-[var(--color-warning-text)] font-bold">
                                            <WarningTriangleIcon className="w-5 h-5 mr-2" />
                                            <span>{currentNtaSchueler.length} Schüler mit Nachteilsausgleich</span>
                                        </div>
                                        <span className="text-xs underline">{showNtaInfo ? 'Ausblenden' : 'Details'}</span>
                                    </button>
                                    
                                    {showNtaInfo && (
                                        <ul className="mt-3 space-y-2 pl-1">
                                            {currentNtaSchueler.map(s => (
                                                <li key={s.id} className="text-sm text-[var(--color-text-primary)]">
                                                    <span className="font-semibold">{s.firstName} {s.lastName}:</span> 
                                                    <span className="text-[var(--color-text-secondary)] block text-xs mt-0.5 bg-[var(--color-ui-secondary)]/50 p-1 rounded">
                                                        {s.nachteilsausgleichDetails || 'Keine Details hinterlegt.'}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <Input
                        label="Titel"
                        id="termin-title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="z.B. Klausur Mathe 9b"
                        required
                    />
                    
                    {/* Flat Grid for Date/Time to fix WebKit layout issues */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-2 min-w-0">
                            <Input
                                label="Datum"
                                id="termin-date"
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                onClear={() => setDate('')}
                                required
                            />
                        </div>
                        <div className="col-span-1 min-w-0">
                            <Input
                                label="Von"
                                id="termin-start"
                                type="time"
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                                onClear={() => setStartTime('')}
                                required
                            />
                        </div>
                        <div className="col-span-1 min-w-0">
                            <Input
                                label="Bis"
                                id="termin-end"
                                type="time"
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                                onClear={() => setEndTime('')}
                            />
                        </div>
                    </div>

                    <Textarea
                        label="Notiz"
                        id="termin-notiz"
                        value={notiz}
                        onChange={e => setNotiz(e.target.value)}
                        rows={3}
                    />

                    <div className="flex justify-between items-center pt-4 border-t border-[var(--color-border)]">
                         {terminToEdit ? (
                            <Button type="button" variant="danger" onClick={handleDeleteRequest}>
                                Löschen
                            </Button>
                         ) : <div></div>}
                         
                         <div className="flex space-x-3">
                            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                                Abbrechen
                            </Button>
                            <Button type="submit" disabled={!title || !date || !startTime}>
                                Speichern
                            </Button>
                         </div>
                    </div>
                </form>
            </Modal>

            <ConfirmDeleteTerminModal
                isOpen={isDeleteModalOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                termin={terminToEdit}
            />
        </>
    );
};

export default TermineView;