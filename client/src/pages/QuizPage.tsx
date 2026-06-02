import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { api, type ScaleData } from '../lib/api';
import { randomNote, NOTE_NAMES, noteIndex } from '../lib/musicTheory';
import { initAudio, playNote } from '../lib/audio';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type QuizMode = 'scale' | 'interval';
type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_CONFIG: Record<Difficulty, { questions: number; time: number }> = {
  easy: { questions: 5, time: 120 },
  medium: { questions: 10, time: 90 },
  hard: { questions: 15, time: 60 },
};

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

type Question = {
  question: string;
  correct: string;
  options: string[];
  playNotes: () => Promise<void>;
};

export function QuizPage() {
  const [scales, setScales] = useState<ScaleData[]>([]);
  const [mode, setMode] = useState<QuizMode>('scale');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [active, setActive] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);
  const scoreRef = useRef(0);
  const timeLeftRef = useRef(0);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const config = DIFFICULTY_CONFIG[difficulty];

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    api.getScales().then(setScales).catch(() => {});
  }, []);

  const generateQuestion = useCallback((): Question | null => {
    if (mode === 'scale') {
      const majorScales = scales.filter((s) => s.type === 'major');
      const scale = majorScales[Math.floor(Math.random() * majorScales.length)] || scales[0];
      if (!scale) return null;
      const correct = `${scale.root} ${scale.type}`;
      const wrongRoots = shuffle([...NOTE_NAMES].filter((n) => n !== scale.root)).slice(0, 3);
      const options = shuffle([correct, ...wrongRoots.map((r) => `${r} ${scale.type}`)]);
      return {
        question: 'What scale are these notes from?',
        correct,
        options,
        playNotes: async () => {
          await initAudio();
          scale.notes.forEach((n, i) => setTimeout(() => playNote(n, 4), i * 300));
        },
      };
    }
    const root = randomNote();
    const semitones = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11][Math.floor(Math.random() * 10)];
    const rootIdx = noteIndex(root);
    const second = NOTE_NAMES[(rootIdx + semitones) % 12];
    const intervalNames: Record<number, string> = {
      1: 'Minor 2nd', 2: 'Major 2nd', 3: 'Minor 3rd', 4: 'Major 3rd', 5: 'Perfect 4th',
      7: 'Perfect 5th', 8: 'Minor 6th', 9: 'Major 6th', 10: 'Minor 7th', 11: 'Major 7th',
    };
    const correct = intervalNames[semitones] || `${semitones} semitones`;
    const allIntervals = Object.values(intervalNames);
    const options = shuffle([
      correct,
      ...shuffle(allIntervals.filter((i) => i !== correct)).slice(0, 3),
    ]);
    return {
      question: 'What interval do you hear?',
      correct,
      options,
      playNotes: async () => {
        await initAudio();
        playNote(root, 4);
        setTimeout(() => playNote(second, 4), 600);
      },
    };
  }, [mode, scales]);

  const endQuiz = useCallback(
    async (finalScore: number) => {
      setActive(false);
      setFinished(true);
      if (isAuthenticated) {
        try {
          await api.submitQuiz({
            quizType: mode,
            difficulty,
            score: finalScore,
            totalQuestions: config.questions,
            timeSeconds: config.time - timeLeftRef.current,
          });
          toast(`+${Math.round((finalScore / config.questions) * 50)} XP earned!`, 'success');
        } catch {
          toast('Score saved locally only', 'info');
        }
      }
    },
    [isAuthenticated, mode, difficulty, config, toast]
  );

  useEffect(() => {
    if (!active || finished) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          void endQuiz(scoreRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [active, finished, endQuiz]);

  const startQuiz = () => {
    const q = generateQuestion();
    if (!q) {
      toast('Scales are still loading. Please try again.', 'error');
      return;
    }
    setActive(true);
    setQIndex(0);
    setScore(0);
    scoreRef.current = 0;
    setFinished(false);
    setTimeLeft(config.time);
    timeLeftRef.current = config.time;
    setCurrentQ(q);
  };

  const answer = (option: string) => {
    if (!currentQ || feedback) return;
    const isCorrect = option === currentQ.correct;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) {
      setScore(newScore);
      scoreRef.current = newScore;
    }

    setTimeout(() => {
      setFeedback(null);
      const next = qIndex + 1;
      if (next >= config.questions) {
        void endQuiz(newScore);
      } else {
        const q = generateQuestion();
        if (q) {
          setQIndex(next);
          setCurrentQ(q);
        }
      }
    }, 800);
  };

  useEffect(() => {
    if (currentQ) void currentQ.playNotes();
  }, [currentQ]);

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Quiz Center</h1>
        <p className="text-slate-400">Test your scale and interval knowledge</p>
      </div>

      {!active && !finished && (
        <Card className="space-y-6">
          <div>
            <label className="text-sm text-slate-400 block mb-2">Quiz type</label>
            <div className="flex gap-2">
              {(['scale', 'interval'] as QuizMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 rounded-xl capitalize ${mode === m ? 'bg-brand-600' : 'glass'}`}
                >
                  {m === 'scale' ? 'Scale ID' : 'Intervals'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-2">Difficulty</label>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2 rounded-xl capitalize ${difficulty === d ? 'bg-brand-600' : 'glass'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm text-slate-500">
            {config.questions} questions · {config.time}s time limit
          </p>
          <Button className="w-full" size="lg" onClick={startQuiz}>
            Start quiz
          </Button>
        </Card>
      )}

      {active && currentQ && (
        <Card>
          <div className="flex justify-between text-sm text-slate-400 mb-4">
            <span>Question {qIndex + 1}/{config.questions}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> {timeLeft}s
            </span>
          </div>
          <h2 className="text-xl font-semibold mb-6">{currentQ.question}</h2>
          <Button variant="secondary" className="mb-4" onClick={() => void currentQ.playNotes()}>
            Play again
          </Button>
          <div className="grid gap-2">
            <AnimatePresence>
              {currentQ.options.map((opt) => (
                <motion.button
                  key={opt}
                  type="button"
                  onClick={() => answer(opt)}
                  disabled={!!feedback}
                  className={`p-4 rounded-xl text-left transition-colors ${
                    feedback && opt === currentQ.correct
                      ? 'bg-emerald-600/30 border border-emerald-500'
                      : feedback && opt !== currentQ.correct
                        ? 'opacity-50'
                        : 'glass hover:bg-white/10'
                  }`}
                >
                  {opt}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
          {feedback && (
            <div className={`mt-4 flex items-center gap-2 ${feedback === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>
              {feedback === 'correct' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              {feedback === 'correct' ? 'Correct!' : `Wrong — it was ${currentQ.correct}`}
            </div>
          )}
        </Card>
      )}

      {finished && (
        <Card className="text-center">
          <h2 className="text-2xl font-bold mb-2">Quiz complete!</h2>
          <p className="text-4xl font-bold text-brand-400 my-4">
            {score}/{config.questions}
          </p>
          <Button onClick={() => { setFinished(false); startQuiz(); }}>Try again</Button>
        </Card>
      )}
    </div>
  );
}
