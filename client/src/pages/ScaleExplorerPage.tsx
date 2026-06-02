import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Volume2 } from 'lucide-react';
import { api, type ScaleData } from '../lib/api';
import { INTERVALS, MAJOR_INTERVALS, MINOR_INTERVALS } from '../lib/musicTheory';
import { initAudio, playScale } from '../lib/audio';
import { PianoKeyboard } from '../components/music/PianoKeyboard';
import { CircleOfFifths } from '../components/music/CircleOfFifths';
import { PageLoader } from '../components/ui/Loading';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useMidiInput } from '../components/music/AudioVisualizer';

export function ScaleExplorerPage() {
  const [scales, setScales] = useState<ScaleData[]>([]);
  const [selected, setSelected] = useState<ScaleData | null>(null);
  const [filter, setFilter] = useState<'all' | 'major' | 'minor'>('all');
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  useMidiInput(true);

  useEffect(() => {
    api.getScales().then((data) => {
      setScales(data);
      const cMajor = data.find((s) => s.id === 'C-major');
      setSelected(cMajor ?? data[0] ?? null);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected || !isAuthenticated) return;
    api
      .logActivity({
        activityType: 'scale_explore',
        metadata: { scaleId: selected.id },
        xpEarned: 5,
      })
      .catch(() => {});
  }, [selected?.id, isAuthenticated]);

  const filtered = scales.filter((s) => filter === 'all' || s.type === filter);

  const handleCircleSelect = (root: string, type: 'major' | 'minor') => {
    const enharmonic: Record<string, string> = {
      Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#',
    };
    const normalizedRoot = enharmonic[root] ?? root;
    const scale = scales.find(
      (s) => s.id === `${normalizedRoot}-${type}` || (s.root === normalizedRoot && s.type === type)
    );
    if (scale) setSelected(scale);
  };

  const playFullScale = async () => {
    if (!selected) return;
    await initAudio();
    playScale(selected.notes, 4);
  };

  if (loading) return <PageLoader />;

  const intervals = selected?.type === 'major' ? MAJOR_INTERVALS : MINOR_INTERVALS;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Scale Explorer</h1>
          <p className="text-slate-400 mt-1">Explore major and minor scales interactively</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'major', 'minor'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm capitalize ${
                filter === f ? 'bg-brand-600 text-white' : 'glass text-slate-400'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {filtered.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelected(s)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                selected?.id === s.id ? 'bg-brand-600/30 border border-brand-500/50' : 'glass hover:bg-white/5'
              }`}
            >
              <span className="font-medium">{s.root}</span>{' '}
              <span className="text-slate-400 capitalize">{s.type}</span>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-strong rounded-2xl p-6 space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {selected.root} {selected.type}
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Formula: <span className="font-mono text-brand-300">{selected.formula}</span>
                    {' · '}
                    Relative: {selected.relativeKey}
                  </p>
                </div>
                <Button onClick={playFullScale}>
                  <Play className="w-4 h-4" /> Play scale
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {selected.notes.map((note, i) => (
                  <span
                    key={`${note}-${i}`}
                    className="px-3 py-1.5 rounded-lg bg-brand-600/20 text-brand-200 font-mono text-sm"
                  >
                    {note}
                    <span className="text-slate-500 ml-1 text-xs">
                      {INTERVALS.find((int) => int.semitones === intervals[i])?.abbr}
                    </span>
                  </span>
                ))}
              </div>

              <div className="overflow-x-auto pb-4">
                <PianoKeyboard
                  highlightedNotes={selected.notes}
                  rootNote={selected.root}
                  startOctave={3}
                  octaves={2}
                />
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> Click keys to play · MIDI keyboard supported
              </p>
            </motion.div>
          )}

          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold mb-4 text-center">Circle of Fifths</h3>
            <CircleOfFifths
              selectedRoot={selected?.root}
              selectedType={selected?.type as 'major' | 'minor'}
              onSelect={handleCircleSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
