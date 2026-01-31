
import React, { useState, useEffect, useMemo } from 'react';
import { useUIContext } from '../../context/UIContext';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { Schueler, Lerngruppe } from '../../context/types';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { AcademicCapIcon, CheckIcon, RefreshIcon, XIcon, BookIcon, ChevronLeftIcon } from '../icons';

// --- Types ---
type GameMode = 'imageToNameChoice' | 'imageToNameInput' | 'imageToFullNameInput' | 'nameToImageChoice';
type GameState = 'MENU' | 'SETUP' | 'PLAYING' | 'SUMMARY' | 'LEARNING_SETUP' | 'LEARNING';

interface Question {
  targetSchueler: Schueler;
  distractors: Schueler[]; // For choice modes
  type: GameMode;
}

interface Feedback {
  isCorrect: boolean;
  correctAnswer: string; // Name of the correct student
  clickedId?: string; // ID of the clicked button (if any)
}

const NamenstrainingView: React.FC = () => {
  const { setHeaderConfig, currentSchoolYear } = useUIContext();
  const { lerngruppen, allSchueler } = useLerngruppenContext();

  // --- State ---
  const [gameState, setGameState] = useState<GameState>('MENU');
  
  // Setup State
  const [selectedLerngruppeId, setSelectedLerngruppeId] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<GameMode>('imageToNameChoice');
  
  // Game State (Quiz)
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [textInput, setTextInput] = useState('');
  const [shuffledOptions, setShuffledOptions] = useState<Schueler[]>([]); // To keep order stable during feedback
  
  // Summary State
  const [mistakes, setMistakes] = useState<{ question: Question, correct: boolean }[]>([]);

  // Learning Mode State (Flashcards)
  const [learningCards, setLearningCards] = useState<Schueler[]>([]);
  const [learningIndex, setLearningIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // --- Data Preparation ---
  const currentLerngruppen = useMemo(() => 
    lerngruppen.filter((lg: Lerngruppe) => lg.schuljahr === currentSchoolYear), 
    [lerngruppen, currentSchoolYear]
  );

  useEffect(() => {
    setHeaderConfig({
      title: 'Namenstraining',
      subtitle: <p className="text-sm text-[var(--color-accent-text)]">Spielerisch Namen lernen</p>,
    });
  }, [setHeaderConfig]);

  useEffect(() => {
      if (currentLerngruppen.length > 0 && !selectedLerngruppeId) {
          setSelectedLerngruppeId(currentLerngruppen[0].id);
      }
  }, [currentLerngruppen, selectedLerngruppeId]);


  // --- Logic: Quiz ---

  const startGame = () => {
    if (!selectedLerngruppeId) return;
    
    const lerngruppe = lerngruppen.find(lg => lg.id === selectedLerngruppeId);
    if (!lerngruppe) return;

    // Use all students in the group
    let eligibleSchueler = allSchueler.filter(s => lerngruppe.schuelerIds.includes(s.id));
    
    if (eligibleSchueler.length < 2) {
        alert("Zu wenige Schüler in der Lerngruppe (mind. 2 erforderlich).");
        return;
    }
    
    // Shuffle and pick max 10
    const shuffled = [...eligibleSchueler].sort(() => 0.5 - Math.random());
    const selection = shuffled.slice(0, 10);
    
    const newQuestions: Question[] = selection.map(target => {
        let distractors: Schueler[] = [];
        
        if (selectedMode === 'imageToNameChoice' || selectedMode === 'nameToImageChoice') {
            // Try to find same gender distractors
            const sameGender = eligibleSchueler.filter(s => s.id !== target.id && s.gender === target.gender);
            const otherGender = eligibleSchueler.filter(s => s.id !== target.id && s.gender !== target.gender);
            
            let potentialDistractors = [...sameGender.sort(() => 0.5 - Math.random())];
            
            // Fill up with other gender if needed
            if (potentialDistractors.length < 3) {
                potentialDistractors = [...potentialDistractors, ...otherGender.sort(() => 0.5 - Math.random())];
            }
            
            distractors = potentialDistractors.slice(0, 3);
        }
        
        return {
            targetSchueler: target,
            distractors,
            type: selectedMode
        };
    });

    setQuestions(newQuestions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setMistakes([]);
    setFeedback(null);
    setTextInput('');
    prepareQuestionOptions(newQuestions[0]);
    setGameState('PLAYING');
  };

  const prepareQuestionOptions = (question: Question) => {
      if (question.type === 'imageToNameChoice' || question.type === 'nameToImageChoice') {
          const opts = [...question.distractors, question.targetSchueler].sort(() => 0.5 - Math.random());
          setShuffledOptions(opts);
      } else {
          setShuffledOptions([]);
      }
  };

  const handleAnswerChoice = (selectedSchueler: Schueler) => {
      if (feedback) return; // Block double clicks

      const currentQ = questions[currentQuestionIndex];
      const isCorrect = selectedSchueler.id === currentQ.targetSchueler.id;
      
      processAnswer(isCorrect, selectedSchueler.id);
  };

  const handleAnswerInput = (e: React.FormEvent) => {
      e.preventDefault();
      if (feedback) return;

      const currentQ = questions[currentQuestionIndex];
      const target = currentQ.targetSchueler;
      const input = textInput.trim().toLowerCase();
      
      let isCorrect = false;
      if (selectedMode === 'imageToNameInput') {
          // Only Firstname check (loose)
          isCorrect = input === target.firstName.toLowerCase();
      } else if (selectedMode === 'imageToFullNameInput') {
          // Full name check (loose)
          const fullName = `${target.firstName} ${target.lastName}`.toLowerCase();
          const reverseName = `${target.lastName} ${target.firstName}`.toLowerCase();
          isCorrect = input === fullName || input === reverseName;
      }
      
      processAnswer(isCorrect);
  };

  const processAnswer = (isCorrect: boolean, clickedId?: string) => {
      const currentQ = questions[currentQuestionIndex];
      
      if (isCorrect) {
          setScore(s => s + 1);
      } else {
          setMistakes(prev => [...prev, { question: currentQ, correct: false }]);
      }

      setFeedback({
          isCorrect,
          correctAnswer: `${currentQ.targetSchueler.firstName} ${currentQ.targetSchueler.lastName}`,
          clickedId
      });

      // Dynamic Delay: Short for correct (2000ms), Long for wrong (3500ms)
      const delay = isCorrect ? 2000 : 3500;

      setTimeout(() => {
          nextQuestion();
      }, delay);
  };

  const nextQuestion = () => {
      if (currentQuestionIndex < questions.length - 1) {
          const nextIdx = currentQuestionIndex + 1;
          setCurrentQuestionIndex(nextIdx);
          setFeedback(null);
          setTextInput('');
          prepareQuestionOptions(questions[nextIdx]);
      } else {
          setGameState('SUMMARY');
      }
  };

  // --- Logic: Learning Mode ---

  const startLearning = () => {
      if (!selectedLerngruppeId) return;
      const lerngruppe = lerngruppen.find(lg => lg.id === selectedLerngruppeId);
      if (!lerngruppe) return;
      
      const students = allSchueler.filter(s => lerngruppe.schuelerIds.includes(s.id));
      if (students.length === 0) {
          alert("Diese Lerngruppe hat keine Schüler.");
          return;
      }

      setLearningCards(students); // Default order: alphabetical usually from context, or as is.
      setLearningIndex(0);
      setIsFlipped(false);
      setGameState('LEARNING');
  };

  const handleLearningNext = () => {
      setIsFlipped(false);
      setTimeout(() => {
          setLearningIndex(prev => prev + 1);
      }, 300); // Wait for flip back
  };

  const handleLearningShuffle = () => {
      setIsFlipped(false);
      setTimeout(() => {
          setLearningCards(prev => [...prev].sort(() => 0.5 - Math.random()));
          setLearningIndex(0);
      }, 300);
  };

  const handleLearningRestart = () => {
      setLearningIndex(0);
      setIsFlipped(false);
  };


  // --- Render Helpers ---

  const getInitials = (s: Schueler) => `${s.firstName[0]}${s.lastName[0]}`.toUpperCase();

  const renderAvatar = (s: Schueler, sizeClass: string = "w-32 h-32", textClass: string = "text-4xl") => {
      if (s.profilePicture) {
          return <img src={`data:image/jpeg;base64,${s.profilePicture}`} alt="Student" className={`${sizeClass} rounded-full object-cover border-4 border-[var(--color-ui-secondary)] shadow-lg`} />;
      }
      return (
          <div className={`${sizeClass} rounded-full bg-gradient-to-br from-[var(--color-accent-primary-hover)] to-[var(--color-accent-primary)] text-[var(--color-accent-text-inverted)] flex items-center justify-center border-4 border-[var(--color-ui-secondary)] shadow-lg`}>
              <span className={`${textClass} font-bold`}>{getInitials(s)}</span>
          </div>
      );
  };

  // --- View Renderers ---

  const renderMenu = () => (
      <div className="max-w-4xl mx-auto w-full animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                  onClick={() => setGameState('LEARNING_SETUP')}
                  className="bg-[var(--color-ui-primary)] p-8 rounded-2xl border border-[var(--color-border)] shadow-lg hover:border-[var(--color-accent-border-focus)] hover:shadow-2xl transition-all group text-left flex flex-col h-64"
              >
                  <div className="mb-6 p-4 bg-[var(--color-ui-secondary)] rounded-full w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BookIcon className="w-8 h-8 text-[var(--color-accent-text)]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Lernmodus</h3>
                  <p className="text-[var(--color-text-secondary)]">
                      Nutzen Sie digitale Karteikarten, um sich Gesichter und Namen einzuprägen, bevor Sie sich abfragen lassen.
                  </p>
              </button>

              <button 
                  onClick={() => setGameState('SETUP')}
                  className="bg-[var(--color-ui-primary)] p-8 rounded-2xl border border-[var(--color-border)] shadow-lg hover:border-[var(--color-accent-border-focus)] hover:shadow-2xl transition-all group text-left flex flex-col h-64"
              >
                  <div className="mb-6 p-4 bg-[var(--color-ui-secondary)] rounded-full w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <AcademicCapIcon className="w-8 h-8 text-[var(--color-accent-text)]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Training</h3>
                  <p className="text-[var(--color-text-secondary)]">
                      Testen Sie Ihr Wissen in verschiedenen Quiz-Modi. Von Multiple-Choice bis zur Texteingabe.
                  </p>
              </button>
          </div>
      </div>
  );

  const renderSetup = () => (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in p-6 bg-[var(--color-ui-primary)] rounded-xl border border-[var(--color-border)] shadow-xl w-full">
        <div className="flex items-center mb-4">
             <button onClick={() => setGameState('MENU')} className="mr-4 p-2 -ml-2 rounded-full hover:bg-[var(--color-ui-secondary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                <ChevronLeftIcon className="w-6 h-6" />
             </button>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Trainings-Einstellungen</h2>
        </div>
        <div className="space-y-4">
            <Select
                label="Lerngruppe wählen"
                id="lg-select"
                value={selectedLerngruppeId}
                onChange={e => setSelectedLerngruppeId(e.target.value)}
                options={currentLerngruppen.map(lg => ({ value: lg.id, label: lg.name }))}
            />
            
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Spielmodus</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                        { id: 'imageToNameChoice', label: 'Namen wählen', desc: 'Bild zeigen, 4 Namen zur Wahl' },
                        { id: 'nameToImageChoice', label: 'Gesichter-Memory', desc: 'Name zeigen, 4 Bilder zur Wahl' },
                        { id: 'imageToNameInput', label: 'Namen eintippen', desc: 'Bild zeigen, Vorname eingeben' },
                        { id: 'imageToFullNameInput', label: 'Königsdisziplin', desc: 'Bild zeigen, Vor- & Nachname' },
                    ].map(mode => (
                        <button
                            key={mode.id}
                            onClick={() => setSelectedMode(mode.id as GameMode)}
                            className={`p-4 rounded-lg border-2 text-left transition-all ${selectedMode === mode.id 
                                ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-secondary-transparent-50)]' 
                                : 'border-[var(--color-border)] bg-[var(--color-ui-secondary)] hover:border-[var(--color-ui-tertiary)]'}`}
                        >
                            <div className="font-bold text-[var(--color-text-primary)]">{mode.label}</div>
                            <div className="text-xs text-[var(--color-text-tertiary)]">{mode.desc}</div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
        <div className="flex justify-center pt-4">
            <Button onClick={startGame} disabled={!selectedLerngruppeId} className="w-full md:w-auto !px-12 !py-3 text-lg">
                Training starten
            </Button>
        </div>
    </div>
  );

  const renderLearningSetup = () => (
    <div className="max-w-xl mx-auto space-y-8 animate-fade-in p-6 bg-[var(--color-ui-primary)] rounded-xl border border-[var(--color-border)] shadow-xl w-full">
        <div className="flex items-center mb-4">
             <button onClick={() => setGameState('MENU')} className="mr-4 p-2 -ml-2 rounded-full hover:bg-[var(--color-ui-secondary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                <ChevronLeftIcon className="w-6 h-6" />
             </button>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Lernmodus</h2>
        </div>
        <div className="space-y-4">
            <p className="text-[var(--color-text-secondary)]">Wählen Sie eine Lerngruppe, um mit den Karteikarten zu beginnen.</p>
            <Select
                label="Lerngruppe wählen"
                id="lg-select-learning"
                value={selectedLerngruppeId}
                onChange={e => setSelectedLerngruppeId(e.target.value)}
                options={currentLerngruppen.map(lg => ({ value: lg.id, label: lg.name }))}
            />
        </div>
        <div className="flex justify-center pt-4">
            <Button onClick={startLearning} disabled={!selectedLerngruppeId} className="w-full !py-3 text-lg">
                Lernen starten
            </Button>
        </div>
    </div>
  );

  const renderLearning = () => {
      if (learningIndex >= learningCards.length) {
          // End of stack
          return (
            <div className="max-w-md w-full mx-auto text-center animate-fade-in p-8 bg-[var(--color-ui-primary)] rounded-xl border border-[var(--color-border)] shadow-xl">
                <CheckIcon className="w-20 h-20 mx-auto text-[var(--color-success-text)] mb-6" />
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Alle Karten gelernt!</h2>
                <p className="text-[var(--color-text-secondary)] mb-8">
                    Sie sind den kompletten Stapel einmal durchgegangen.
                </p>
                <div className="space-y-3">
                    <Button onClick={handleLearningShuffle} className="w-full justify-center">
                        <RefreshIcon className="w-5 h-5 mr-2"/> Neu mischen & Neustart
                    </Button>
                    <Button onClick={handleLearningRestart} variant="secondary" className="w-full justify-center">
                        Stapel erneut durchgehen
                    </Button>
                    <Button variant="secondary" onClick={() => setGameState('MENU')} className="w-full justify-center">
                        Zurück zum Menü
                    </Button>
                </div>
            </div>
          );
      }

      const currentCard = learningCards[learningIndex];

      return (
          <div className="max-w-md w-full mx-auto flex flex-col h-full animate-fade-in justify-center">
              {/* Header */}
              <div className="flex justify-between items-center mb-2 px-2">
                  <div className="text-sm font-bold text-[var(--color-text-secondary)]">
                      Karte {learningIndex + 1} von {learningCards.length}
                  </div>
                  <button onClick={() => setGameState('MENU')} className="p-2 rounded-full hover:bg-[var(--color-ui-secondary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
                      <XIcon className="w-6 h-6" />
                  </button>
              </div>

              {/* Flashcard Container */}
              <div className="flex items-center justify-center perspective-[1000px]">
                  <div 
                      className={`relative w-full h-96 cursor-pointer transition-transform duration-500 preserve-3d shadow-2xl rounded-2xl`}
                      style={{ 
                          transformStyle: 'preserve-3d',
                          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
                      }}
                      onClick={() => setIsFlipped(!isFlipped)}
                  >
                      {/* Front (Image) */}
                      <div 
                        className="absolute inset-0 bg-[var(--color-ui-primary)] rounded-2xl border border-[var(--color-border)] flex flex-col items-center justify-center p-6 [backface-visibility:hidden] [transform:rotateX(0deg)]"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                          {renderAvatar(currentCard, "w-48 h-48", "text-7xl")}
                          <p className="absolute bottom-6 left-0 right-0 text-center text-[var(--color-accent-text)] text-sm font-medium animate-pulse">Tippen zum Umdrehen</p>
                      </div>

                      {/* Back (Name) */}
                      <div 
                        className="absolute inset-0 bg-[var(--color-ui-primary)] rounded-2xl border-2 border-[var(--color-accent-primary)] flex flex-col items-center justify-center p-6 [backface-visibility:hidden] [transform:rotateX(0deg)]"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                      >
                          <h2 className="text-4xl font-bold text-[var(--color-text-primary)] text-center">{currentCard.firstName}</h2>
                          <h3 className="text-2xl text-[var(--color-text-secondary)] mt-2 text-center">{currentCard.lastName}</h3>
                          <p className="absolute bottom-6 left-0 right-0 text-center text-[var(--color-accent-text)] text-sm font-medium animate-pulse">Tippen zum Umdrehen</p>
                      </div>
                  </div>
              </div>

              {/* Controls */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                  <Button variant="secondary" onClick={handleLearningShuffle} className="justify-center">
                      <RefreshIcon className="w-5 h-5 mr-2" /> Mischen
                  </Button>
                  <Button onClick={handleLearningNext} className="justify-center">
                      Nächster
                  </Button>
              </div>
          </div>
      );
  };

  const renderPlaying = () => {
      const currentQ = questions[currentQuestionIndex];
      if (!currentQ) return null;

      const target = currentQ.targetSchueler;
      const isChoiceMode = currentQ.type === 'imageToNameChoice' || currentQ.type === 'nameToImageChoice';
      const isImageInputMode = currentQ.type === 'imageToNameInput' || currentQ.type === 'imageToFullNameInput';

      return (
          <div className="max-w-2xl w-full mx-auto flex flex-col items-center h-full justify-center animate-fade-in">
              <div className="bg-[var(--color-ui-primary)] p-8 rounded-2xl shadow-2xl border border-[var(--color-border)] w-full flex flex-col items-center relative overflow-hidden justify-center max-w-2xl">
                  <button 
                      onClick={() => setGameState('MENU')} // Go back to Menu instead of Setup
                      className="absolute top-4 right-4 p-2 rounded-full text-[var(--color-text-tertiary)] hover:bg-[var(--color-ui-secondary)] hover:text-[var(--color-text-primary)] transition-colors z-20"
                      aria-label="Training abbrechen"
                  >
                      <XIcon className="w-6 h-6" />
                  </button>

                  <div className="mb-6">
                      {currentQ.type === 'nameToImageChoice' ? (
                          <div className="text-center p-8 bg-[var(--color-ui-secondary)] rounded-xl">
                              <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">{target.firstName}</h2>
                              <p className="text-xl text-[var(--color-text-tertiary)]">{target.lastName}</p>
                          </div>
                      ) : (
                          renderAvatar(target, "w-40 h-40", "text-6xl")
                      )}
                  </div>
                  
                  <div className="h-8 mb-4 flex items-center justify-center w-full">
                        {feedback && (
                            <div className={`text-xl font-bold animate-fade-in flex items-center gap-2 ${feedback.isCorrect ? 'text-[var(--color-success-text)]' : 'text-[var(--color-danger-text)]'}`}>
                                {feedback.isCorrect ? <span>Richtig!</span> : <span>Leider falsch.</span>}
                            </div>
                        )}
                  </div>

                  <div className="w-full">
                      {isChoiceMode && (
                          <div className="grid grid-cols-2 gap-4">
                              {shuffledOptions.map(opt => {
                                  const isTarget = opt.id === target.id;
                                  const isClicked = feedback?.clickedId === opt.id;
                                  
                                  let btnClass = "p-4 rounded-xl border-2 font-semibold text-lg transition-all duration-300 relative overflow-hidden ";
                                  if (feedback) {
                                      if (isTarget) {
                                          btnClass += "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:text-green-100 dark:border-green-500 ";
                                          if (!feedback.isCorrect) btnClass += "animate-pulse ";
                                      } else if (isClicked && !feedback.isCorrect) {
                                          btnClass += "bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:text-red-100 dark:border-red-500 ";
                                      } else {
                                          btnClass += "bg-[var(--color-ui-secondary)] text-[var(--color-text-tertiary)] border-transparent opacity-20 grayscale ";
                                      }
                                  } else {
                                      btnClass += "bg-[var(--color-ui-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)] desktop-hover-accent active:scale-[0.98] ";
                                  }

                                  return (
                                      <button
                                          key={`${opt.id}-${currentQuestionIndex}`}
                                          onClick={() => handleAnswerChoice(opt)}
                                          disabled={!!feedback}
                                          className={btnClass}
                                      >
                                          <div className="flex justify-center items-center w-full h-full">
                                            {currentQ.type === 'nameToImageChoice' ? (
                                                renderAvatar(opt, "w-20 h-20", "text-2xl")
                                            ) : (
                                                <span>{opt.firstName} {opt.lastName}</span>
                                            )}
                                          </div>
                                          {feedback && isTarget && (
                                              <div className="absolute top-2 right-2 text-green-600 dark:text-green-400">
                                                  <CheckIcon className="w-6 h-6" />
                                              </div>
                                          )}
                                      </button>
                                  );
                              })}
                          </div>
                      )}

                      {isImageInputMode && (
                          <form onSubmit={handleAnswerInput} className="flex flex-col gap-4">
                              <input 
                                  type="text"
                                  value={textInput}
                                  onChange={e => setTextInput(e.target.value)}
                                  placeholder={currentQ.type === 'imageToNameInput' ? "Vorname..." : "Vor- und Nachname..."}
                                  className={`w-full p-4 text-center text-xl bg-[var(--color-ui-secondary)] border-2 rounded-xl focus:outline-none text-[var(--color-text-primary)] transition-colors ${
                                      feedback 
                                        ? feedback.isCorrect 
                                            ? 'border-green-500 bg-green-100 dark:bg-green-900/20' 
                                            : 'border-red-500 bg-red-100 dark:bg-red-900/20'
                                        : 'border-[var(--color-border)] focus:border-[var(--color-accent-primary)]'
                                  }`}
                                  autoFocus
                                  disabled={!!feedback}
                              />
                              {!feedback && (
                                  <Button type="submit" disabled={!textInput.trim()} className="w-full !py-4 !text-lg">
                                      Überprüfen
                                  </Button>
                              )}
                              {feedback && !feedback.isCorrect && (
                                  <div className="text-center animate-fade-in">
                                      <p className="text-[var(--color-text-tertiary)] text-sm">Lösung:</p>
                                      <p className="text-xl font-bold text-[var(--color-text-primary)]">{feedback.correctAnswer}</p>
                                  </div>
                              )}
                          </form>
                      )}
                  </div>
              </div>
              
              <div className="mt-6 max-w-md w-full flex flex-col gap-2 mx-auto">
                  <div className="w-full bg-[var(--color-ui-secondary)] rounded-full h-2.5 overflow-hidden shadow-inner">
                    <div 
                        className="bg-[var(--color-accent-primary)] h-2.5 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    ></div>
                </div>
                <div className="text-center text-sm text-[var(--color-text-tertiary)] font-medium">
                    Frage {currentQuestionIndex + 1} von {questions.length}
                </div>
              </div>
          </div>
      );
  };

  const renderSummary = () => {
      const percentage = Math.round((score / questions.length) * 100);
      
      return (
          <div className="max-w-2xl w-full mx-auto text-center animate-fade-in p-8 bg-[var(--color-ui-primary)] rounded-xl border border-[var(--color-border)] shadow-xl">
              <AcademicCapIcon className="w-20 h-20 mx-auto text-[var(--color-accent-text)] mb-6" />
              <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">Training abgeschlossen!</h2>
              <p className="text-xl text-[var(--color-text-secondary)] mb-8">
                  Du hast <span className="font-bold text-[var(--color-accent-text)]">{score}</span> von <span className="font-bold">{questions.length}</span> Namen richtig erkannt.
              </p>
              
              <div className="w-full bg-[var(--color-ui-secondary)] h-4 rounded-full mb-8 overflow-hidden">
                  <div className={`h-full ${percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${percentage}%` }}></div>
              </div>

              {mistakes.length > 0 && (
                  <div className="text-left bg-[var(--color-ui-secondary)] p-6 rounded-lg mb-8 max-h-60 overflow-y-auto">
                      <h3 className="font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                          <RefreshIcon className="w-5 h-5"/> Lernbedarf ({mistakes.length})
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {mistakes.map((m, idx) => (
                              <div key={idx} className="flex items-center space-x-3 p-2 bg-[var(--color-ui-primary)] rounded-md border border-[var(--color-border)]">
                                  {renderAvatar(m.question.targetSchueler, "w-10 h-10", "text-sm")}
                                  <div>
                                      <p className="font-semibold text-[var(--color-text-primary)]">{m.question.targetSchueler.firstName} {m.question.targetSchueler.lastName}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              <div className="flex justify-center gap-4">
                  <Button variant="secondary" onClick={() => setGameState('MENU')}>Zurück zum Menü</Button>
                  <Button onClick={startGame}>Nochmal spielen</Button>
              </div>
          </div>
      );
  };

  return (
    <div className="h-full flex flex-col justify-center p-4 md:p-8">
        {gameState === 'MENU' && renderMenu()}
        {gameState === 'SETUP' && renderSetup()}
        {gameState === 'LEARNING_SETUP' && renderLearningSetup()}
        {gameState === 'LEARNING' && renderLearning()}
        {gameState === 'PLAYING' && renderPlaying()}
        {gameState === 'SUMMARY' && renderSummary()}
    </div>
  );
};

export default NamenstrainingView;
