import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, GitBranch } from 'lucide-react';
import { api, type ChordProgression } from '../lib/api';
import { initAudio, playChord } from '../lib/audio';
import { PageLoader } from '../components/ui/Loading';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function ChordProgressionsPage() {
  const [progressions, setProgressions] = useState<ChordProgression[]>([]);
  const [selected, setSelected] = useState<ChordProgression | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    api.getChords().then((data) => {
      setProgressions(data);
      setSelected(data[0] ?? null);
    }).finally(() => setLoading(false));
  }, []);

  const playProgression = async (prog: ChordProgression) => {
    setPlaying(true);
    await initAudio();
    for (let i = 0; i < prog.chords.length; i++) {
      const chord = prog.chords[i];
      const roots = chord.match(/^[A-G][#b]?/)?.[0] || 'C';
      const quality = chord.includes('m') && !chord.includes('maj') ? [0, 3, 7] : [0, 4, 7];
      const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const idx = NOTE_NAMES.indexOf(roots as (typeof NOTE_NAMES)[number]);
      if (idx >= 0) {
        const chordNotes = quality.map((s) => NOTE_NAMES[(idx + s) % 12]);
        setTimeout(() => playChord(chordNotes, 3, '2n'), i * 800);
      }
    }
    setTimeout(() => setPlaying(false), prog.chords.length * 800 + 500);

    if (isAuthenticated) {
      api.practiceChord(prog.id, prog.chords.length * 2).catch(() => {});
      toast('Progress saved!', 'success');
    }
  };

  if (loading) return <PageLoader />;

  const genres = [...new Set(progressions.map((p) => p.genre))];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <GitBranch className="w-8 h-8 text-brand-400" />
          Chord Progressions
        </h1>
        <p className="text-slate-400">Learn common progressions with Roman numeral analysis</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          {genres.map((genre) => (
            <div key={genre}>
              <h3 className="text-xs uppercase text-slate-500 mb-2">{genre}</h3>
              <div className="space-y-2">
                {progressions
                  .filter((p) => p.genre === genre)
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelected(p)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                        selected?.id === p.id ? 'bg-brand-600/30 border border-brand-500/50' : 'glass'
                      }`}
                    >
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{p.numerals}</p>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-2 glass-strong rounded-2xl p-6 space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold">{selected.name}</h2>
              <p className="text-slate-400">{selected.description}</p>
              <p className="text-sm text-brand-300 mt-2">Key: {selected.keyExample}</p>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-slate-500 text-sm">Roman numerals:</span>
              <span className="font-mono text-brand-200">{selected.numerals}</span>
            </div>

            <div className="flex flex-wrap gap-3">
              {selected.chords.map((chord, i) => (
                <motion.div
                  key={`${chord}-${i}`}
                  whileHover={{ scale: 1.05 }}
                  className="px-6 py-4 rounded-xl bg-brand-600/20 border border-brand-500/30 font-mono text-lg"
                >
                  {chord}
                </motion.div>
              ))}
            </div>

            <Button onClick={() => playProgression(selected)} disabled={playing}>
              <Play className="w-4 h-4" />
              {playing ? 'Playing...' : 'Play progression'}
            </Button>

            <Card>
              <h3 className="font-semibold mb-2">Analysis</h3>
              <p className="text-sm text-slate-400">
                This <strong>{selected.genre}</strong> progression uses the numerals{' '}
                <span className="font-mono text-brand-300">{selected.numerals}</span> in{' '}
                {selected.keyExample}. Practice transposing it to other keys once comfortable.
              </p>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
