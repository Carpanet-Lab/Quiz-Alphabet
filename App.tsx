
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, AnswerState } from './types';
import type { ExampleWord } from './types';
import { ALPHABET_FR, ALPHABET_PRONUNCIATIONS } from './constants';
import { getExampleWord } from './services/geminiService';
import { SpeakerIcon, CheckIcon, XIcon } from './components/icons';

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [shuffledAlphabet, setShuffledAlphabet] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userGuess, setUserGuess] = useState('');
  const [answerState, setAnswerState] = useState<AnswerState>(AnswerState.UNANSWERED);
  const [exampleWord, setExampleWord] = useState<ExampleWord | null>(null);
  const [isLoadingExample, setIsLoadingExample] = useState(false);

  const currentLetter = useMemo(() => shuffledAlphabet[currentIndex], [shuffledAlphabet, currentIndex]);

  const handleStartQuiz = useCallback(() => {
    const newShuffledAlphabet = shuffleArray(ALPHABET_FR);
    setShuffledAlphabet(newShuffledAlphabet);
    setCurrentIndex(0);
    setScore(0);
    setGameState(GameState.PLAYING);
    setUserGuess('');
    setAnswerState(AnswerState.UNANSWERED);
    setExampleWord(null);
  }, []);

  const handleNextLetter = useCallback(() => {
    if (currentIndex < ALPHABET_FR.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserGuess('');
      setAnswerState(AnswerState.UNANSWERED);
      setExampleWord(null);
    } else {
      setGameState(GameState.FINISHED);
    }
  }, [currentIndex]);
  
  const handleCheckAnswer = useCallback(async () => {
    if (!userGuess.trim()) return;

    if (userGuess.trim().toLowerCase() === currentLetter.toLowerCase()) {
      setScore(prev => prev + 1);
      setAnswerState(AnswerState.CORRECT);
      setIsLoadingExample(true);
      const example = await getExampleWord(currentLetter);
      setExampleWord(example);
      setIsLoadingExample(false);
    } else {
      setAnswerState(AnswerState.INCORRECT);
    }
  }, [userGuess, currentLetter]);

  const handlePronounce = useCallback(() => {
    if (!currentLetter) return;
    const pronunciation = ALPHABET_PRONUNCIATIONS[currentLetter];
    if (pronunciation) {
      const utterance = new SpeechSynthesisUtterance(pronunciation);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, [currentLetter]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
            if (gameState === GameState.PLAYING) {
                if(answerState === AnswerState.UNANSWERED) {
                    handleCheckAnswer();
                } else {
                    handleNextLetter();
                }
            } else if (gameState === GameState.FINISHED || gameState === GameState.START) {
                handleStartQuiz();
            }
        }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
        window.removeEventListener('keydown', handleKeyPress);
    };
}, [gameState, answerState, handleCheckAnswer, handleNextLetter, handleStartQuiz]);


  const renderContent = () => {
    switch (gameState) {
      case GameState.START:
        return (
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-sky-300">Bienvenue au Quiz de l'Alphabet Français!</h1>
            <p className="mb-8 text-slate-400">Testez vos connaissances et apprenez la prononciation.</p>
            <button
              onClick={handleStartQuiz}
              className="bg-sky-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-sky-600 transition-colors shadow-lg"
            >
              Commencer le Quiz
            </button>
          </div>
        );
      case GameState.FINISHED:
        const percentage = Math.round((score / ALPHABET_FR.length) * 100);
        return (
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-sky-300">Quiz Terminé!</h1>
            <p className="text-2xl mb-2">Votre score final est de</p>
            <p className="text-6xl font-bold my-4">{score} / {ALPHABET_FR.length} ({percentage}%)</p>
            <button
              onClick={handleStartQuiz}
              className="bg-sky-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-sky-600 transition-colors mt-6 shadow-lg"
            >
              Rejouer
            </button>
          </div>
        );
      case GameState.PLAYING:
        const progress = ((currentIndex + 1) / ALPHABET_FR.length) * 100;
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
                <div className="text-xl font-bold text-sky-400">Score: {score}</div>
                <div className="text-lg text-slate-400">{currentIndex + 1} / {ALPHABET_FR.length}</div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5 mb-8">
                <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            
            <div className="bg-slate-900/50 rounded-xl p-8 mb-6 flex flex-col items-center justify-center min-h-[200px]">
                <div className="text-9xl font-bold text-white tracking-wider">{currentLetter}</div>
            </div>

            <button
              onClick={handlePronounce}
              className="w-full flex items-center justify-center gap-2 bg-slate-700 text-slate-300 font-semibold py-3 px-6 rounded-lg hover:bg-slate-600 transition-colors mb-6"
            >
              <SpeakerIcon />
              Écouter la prononciation
            </button>

            {answerState === AnswerState.UNANSWERED ? (
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={userGuess}
                        onChange={(e) => setUserGuess(e.target.value)}
                        maxLength={1}
                        className="flex-grow bg-slate-700 border-2 border-slate-600 text-white text-lg rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-3.5 text-center"
                        placeholder="Quelle est cette lettre ?"
                        autoFocus
                    />
                    <button
                        onClick={handleCheckAnswer}
                        className="bg-sky-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-sky-600 transition-colors"
                    >
                        Vérifier
                    </button>
                </div>
            ) : (
                <div className="text-center">
                    {answerState === AnswerState.CORRECT && (
                        <div className="bg-green-900/50 border border-green-500 text-green-300 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-center gap-2 font-bold text-xl mb-4">
                                <CheckIcon /> Correct !
                            </div>
                            {isLoadingExample ? (
                                <div className="animate-pulse">Chargement de l'exemple...</div>
                            ) : exampleWord ? (
                                <div>
                                    <p className="text-lg"><strong className="font-semibold text-white">{exampleWord.mot}</strong></p>
                                    <p className="text-slate-300 italic">"{exampleWord.phrase}"</p>
                                </div>
                            ) : (
                                <p className="text-slate-400">Impossible de charger un exemple.</p>
                            )}
                        </div>
                    )}
                    {answerState === AnswerState.INCORRECT && (
                         <div className="bg-red-900/50 border border-red-500 text-red-300 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-center gap-2 font-bold text-xl">
                                <XIcon /> Incorrect. La bonne réponse était <strong className="font-bold text-white">{currentLetter}</strong>.
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleNextLetter}
                        className="w-full bg-slate-700 text-white font-bold py-3 px-8 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                        Suivant →
                    </button>
                </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-10 border border-slate-700">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;
