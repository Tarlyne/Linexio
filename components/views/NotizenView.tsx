import React, { useState, useEffect, useMemo } from 'react';
import { useUIContext } from '../../context/UIContext';
import { useToolsContext } from '../../context/ToolsContext';
import { Notiz, NotizKategorie } from '../../context/types';
import Button from '../ui/Button';
import { PlusIcon, PencilIcon } from '../icons';
import AddEditNotizKategorieModal from '../modals/AddEditNotizKategorieModal';
import AddEditNotizModal from '../modals/AddEditNotizModal';

const NotizenView: React.FC = () => {
    const { setHeaderConfig } = useUIContext();
    const { notizKategorien, notizen } = useToolsContext();

    const [selectedKategorieId, setSelectedKategorieId] = useState<string | null>(null);
    
    // Modal states
    const [isKategorieModalOpen, setIsKategorieModalOpen] = useState(false);
    const [kategorieToEdit, setKategorieToEdit] = useState<NotizKategorie | null>(null);
    const [isNotizModalOpen, setIsNotizModalOpen] = useState(false);
    const [notizToEdit, setNotizToEdit] = useState<Notiz | null>(null);

    useEffect(() => {
        setHeaderConfig({
            title: 'Notizen',
            subtitle: <p className="text-sm text-[var(--color-accent-text)]">Persönliche Vermerke & Protokolle</p>,
        });
    }, [setHeaderConfig]);
    
    const sortedKategorien = useMemo(() => 
        [...notizKategorien].sort((a, b) => a.order - b.order), 
    [notizKategorien]);
    
    const sortedNotizen = useMemo(() => 
        notizen.filter(n => n.kategorieId === selectedKategorieId)
               .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [notizen, selectedKategorieId]);

    useEffect(() => {
        const isSelectedIdValid = selectedKategorieId && sortedKategorien.some(k => k.id === selectedKategorieId);

        // If the selected ID is no longer valid (e.g., deleted), or if no ID is selected yet
        if (!isSelectedIdValid) {
            if (sortedKategorien.length > 0) {
                // Select the first available category
                setSelectedKategorieId(sortedKategorien[0].id);
            } else {
                // No categories left
                setSelectedKategorieId(null);
            }
        }
    }, [sortedKategorien, selectedKategorieId]);
    
    const openAddKategorieModal = () => {
        setKategorieToEdit(null);
        setIsKategorieModalOpen(true);
    };

    const openEditKategorieModal = (kategorie: NotizKategorie) => {
        setKategorieToEdit(kategorie);
        setIsKategorieModalOpen(true);
    };

    const openAddNotizModal = () => {
        setNotizToEdit(null);
        setIsNotizModalOpen(true);
    };

    const openEditNotizModal = (notiz: Notiz) => {
        setNotizToEdit(notiz);
        setIsNotizModalOpen(true);
    };
    
    return (
        <>
            <div className="flex h-full gap-6">
                {/* Left Column: Categories */}
                <div className="w-1/3 max-w-xs flex-shrink-0 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Kategorien</h2>
                        <Button variant="primary" className="!p-2" onClick={openAddKategorieModal} aria-label="Neue Kategorie">
                            <PlusIcon />
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-[var(--color-ui-primary)] rounded-lg border border-[var(--color-border)] p-2 space-y-1">
                        {sortedKategorien.map((kategorie: NotizKategorie) => (
                             <div key={kategorie.id} className="relative">
                                <button
                                    onClick={() => setSelectedKategorieId(kategorie.id)}
                                    className={`w-full flex items-center justify-start p-3 rounded-md text-left transition-colors ${selectedKategorieId === kategorie.id ? 'bg-[var(--color-accent-secondary-transparent-50)]' : 'hover:bg-[var(--color-ui-secondary)]'}`}
                                >
                                    <span className="text-xl mr-3">{kategorie.icon}</span>
                                    <span className={`font-semibold ${selectedKategorieId === kategorie.id ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>{kategorie.name}</span>
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); openEditKategorieModal(kategorie); }} 
                                    className="absolute top-1/2 right-2 -translate-y-1/2 p-2 rounded-full text-[var(--color-text-tertiary)] hover:bg-[var(--color-ui-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                                    aria-label={`Kategorie ${kategorie.name} bearbeiten`}
                                >
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {sortedKategorien.length === 0 && (
                            <div className="h-full flex items-center justify-center text-center p-4">
                                <p className="text-sm text-[var(--color-text-tertiary)]">Erstellen Sie Ihre erste Kategorie, um Notizen zu organisieren.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Notes */}
                <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Notizen</h2>
                        <Button onClick={openAddNotizModal} disabled={!selectedKategorieId}>
                            <PlusIcon />
                            <span>Neue Notiz</span>
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-[var(--color-ui-primary)] rounded-lg border border-[var(--color-border)] p-2">
                        {selectedKategorieId ? (
                            sortedNotizen.length > 0 ? (
                                <div className="space-y-2">
                                    {sortedNotizen.map((notiz: Notiz) => (
                                        <button 
                                            key={notiz.id}
                                            onClick={() => openEditNotizModal(notiz)}
                                            className="w-full text-left p-4 rounded-lg hover:bg-[var(--color-ui-secondary)] transition-colors"
                                        >
                                            <h3 className="font-bold text-[var(--color-accent-text)] truncate">{notiz.title}</h3>
                                            <p className="text-sm text-[var(--color-text-tertiary)] line-clamp-2 mt-1 whitespace-pre-line">{notiz.content}</p>
                                            <p className="text-xs text-[var(--color-text-tertiary)]/70 mt-2">{new Date(notiz.updatedAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-center p-4">
                                    <p className="text-sm text-[var(--color-text-tertiary)]">Diese Kategorie hat noch keine Notizen.</p>
                                </div>
                            )
                        ) : (
                             <div className="h-full flex items-center justify-center text-center p-4">
                                <p className="text-sm text-[var(--color-text-tertiary)]">Bitte wählen oder erstellen Sie eine Kategorie.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <AddEditNotizKategorieModal
                isOpen={isKategorieModalOpen}
                onClose={() => setIsKategorieModalOpen(false)}
                kategorieToEdit={kategorieToEdit}
            />

            {selectedKategorieId && (
                <AddEditNotizModal
                    isOpen={isNotizModalOpen}
                    onClose={() => setIsNotizModalOpen(false)}
                    notizToEdit={notizToEdit}
                    kategorieId={selectedKategorieId}
                />
            )}
        </>
    );
};

export default NotizenView;