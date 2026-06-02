import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Headphones, Volume2 } from 'lucide-react';
import {
  randomNote, randomInterval, CHORD_TYPES, getChordNotes, NOTE_NAMES, noteIndex,
} from '../lib/musicTheory';
import { initAudio, playNote, playChord } from '../lib/audio';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AudioVisualizer } from '../components/music/AudioVisualizer';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';

type Exercise = 'note' | 'interval' | 'chord';
type Difficulty = 'easy' | 'medium' | 'hard';

export function EarTrainingPage() {
  const [exercise, setExercise] = useState<Exercise>('note');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [active, setActive] = useState(false);
  const [qNum, setQNum] = useState(0);
  const [score, setScore] = useState(0);
  const [total] = useState(10);
  const [options, setOptions] = useState<string[]>([]);
  const [correct, setCorrect] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const replayRef = useRef<(() => Promise<void>) | null>(null);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const maxInterval = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 8 : 12;

  const nextQuestion = useCallback(async () => {
    setFeedback(null);
    if (exercise === 'note') {
      const note = randomNote();
      setCorrect(note);
      setOptions(
        shuffleUnique([note, ...pickRandom(NOTE_NAMES.filter((n) => n !== note), 3)])
      );
      const play = async () => {
        await initAudio();
        playNote(note, 4);
      };
      replayRef.current = play;
      await play();
    } else if (exercise === 'interval') {
      const root = randomNote();
      const interval = randomInterval(maxInterval);
      const rootIdx = noteIndex(root);
      const second = NOTE_NAMES[(rootIdx + interval.semitones) % 12];
      setCorrect(interval.name);
      const names = [
        'Minor 2nd', 'Major 2nd', 'Minor 3rd', 'Major 3rd', 'Perfect 4th',
        'Perfect 5th', 'Minor 6th', 'Major 6th', 'Minor 7th', 'Major 7th', 'Octave',
      ];
      setOptions(shuffleUnique([interval.name, ...pickRandom(names.filter((n) => n !== interval.name), 3)]));
      const play = async () => {
        await initAudio();
        playNote(root, 4);
        setTimeout(() => playNote(second, 4), 700);
      };
      replayRef.current = play;
      await play();
    } else {
      const root = randomNote();
      const chordType = CHORD_TYPES[Math.floor(Math.random() * (difficulty === 'easy' ? 2 : CHORD_TYPES.length))];
      const notes = getChordNotes(root, chordType);
      setCorrect(chordType.name);
      setOptions(
        shuffleUnique([
          chordType.name,
          ...pickRandom(
            CHORD_TYPES.filter((c) => c.name !== chordType.name).map((c) => c.name),
            3
          ),
        ])
      );
      const play = async () => {
        await initAudio();
        playChord(notes, 3);
      };
      replayRef.current = play;
      await play();
    }
  }, [exercise, maxInterval, difficulty]);

  const start = () => {
    setActive(true);
    setQNum(0);
    setScore(0);
    setDone(false);
    void nextQuestion();
  };

  const submit = (opt: string) => {
    if (feedback) return;
    const isCorrect = opt === correct;
    setFeedback(isCorrect ? 'Correct!' : `Wrong — ${correct}`);
    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(newScore);

    setTimeout(async () => {
      const next = qNum + 1;
      if (next >= total) {
        setActive(false);
        setDone(true);
        if (isAuthenticated) {
          try {
            await api.submitEar({
              exerciseType: exercise,
              difficulty,
              score: newScore,
              totalQuestions: total,
            });
            toast('Ear training complete! XP earned.', 'success');
          } catch {
            /* guest mode */
          }
        }
      } else {
        setQNum(next);
        void nextQuestion();
      }
    }, 1000);
  };

  const replay = async () => {
    setPlaying(true);
    await replayRef.current?.();
    setPlaying(false);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Headphones className="w-8 h-8 text-brand-400" />
          Ear Training
        </h1>
        <p className="text-slate-400">Identify notes, intervals, and chords by ear</p>
      </div>

      {!active && !done && (
        <Card className="space-y-6">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Exercise</label>
            <div className="grid grid-cols-3 gap-2">
              {(['note', 'interval', 'chord'] as Exercise[]).map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setExercise(e)}
                  className={`py-2 rounded-xl capitalize ${exercise === e ? 'bg-brand-600' : 'glass'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Difficulty</label>
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
          <Button className="w-full" size="lg" onClick={start}>
            Start session ({total} questions)
          </Button>
        </Card>
      )}

      {active && (
        <Card>
          <div className="flex justify-between mb-4 text-sm text-slate-400">
            <span>Question {qNum + 1}/{total}</span>
            <span>Score: {score}</span>
          </div>
          <AudioVisualizer active={playing} />
          <p className="text-center text-lg font-medium my-4 capitalize">
            What {exercise} do you hear?
          </p>
          <div className="flex justify-center mb-4">
            <Button variant="secondary" onClick={() => void replay()}>
              <Volume2 className="w-4 h-4" /> Replay
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => submit(opt)}
                disabled={!!feedback}
                className={`p-4 rounded-xl glass hover:bg-white/10 ${
                  feedback && opt === correct ? 'ring-2 ring-emerald-500' : ''
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {feedback && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-center mt-4 ${feedback.startsWith('Correct') ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {feedback}
            </motion.p>
          )}
        </Card>
      )}

      {done && (
        <Card className="text-center">
          <h2 className="text-xl font-bold">Session complete</h2>
          <p className="text-3xl text-brand-400 font-bold my-4">{score}/{total}</p>
          <Button onClick={start}>Practice again</Button>
        </Card>
      )}
    </div>
  );
}

function pickRandom<T>(arr: T[], count: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, count);
}

function shuffleUnique<T>(arr: T[]): T[] {
  return [...new Set(arr)].sort(() => Math.random() - 0.5);
}
