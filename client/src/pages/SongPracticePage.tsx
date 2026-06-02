import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Music } from 'lucide-react';
import { api, type Song } from '../lib/api';
import { initAudio, playChord, startMetronome, stopMetronome, isMetronomeRunning } from '../lib/audio';
import { MetronomeControl } from '../components/music/AudioVisualizer';
import { PageLoader } from '../components/ui/Loading';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';

export function SongPracticePage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selected, setSelected] = useState<Song | null>(null);
  const [tempo, setTempo] = useState(100);
  const [practiceMode, setPracticeMode] = useState(false);
  const [chordIndex, setChordIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const { isAuthenticated } = useAuth();
  const practiceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const practiceRunRef = useRef(0);

  const clearPracticeInterval = () => {
    if (practiceIntervalRef.current !== null) {
      clearInterval(practiceIntervalRef.current);
      practiceIntervalRef.current = null;
    }
  };

  useEffect(() => {
    api.getSongs().then((data) => {
      setSongs(data);
      setSelected(data[0] ?? null);
      if (data[0]) setTempo(data[0].tempo);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selected) setTempo(selected.tempo);
  }, [selected?.id]);

  useEffect(() => {
    return () => {
      clearPracticeInterval();
      stopMetronome();
    };
  }, []);

  const filtered = filter === 'all' ? songs : songs.filter((s) => s.difficulty === filter);

  const playChordAt = async (index: number) => {
    if (!selected) return;
    const chord = selected.chords[index];
    await initAudio();
    const root = chord.match(/^[A-G][#b]?/)?.[0] || 'C';
    const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const idx = NOTE_NAMES.indexOf(root as (typeof NOTE_NAMES)[number]);
    const quality = chord.includes('m') && !chord.includes('maj') ? [0, 3, 7] : [0, 4, 7];
    if (idx >= 0) {
      const notes = quality.map((s) => NOTE_NAMES[(idx + s) % 12]);
      playChord(notes, 3);
    }
    setChordIndex(index);
  };

  const startPractice = async () => {
    if (!selected) return;
    clearPracticeInterval();
    const runId = ++practiceRunRef.current;
    setPracticeMode(true);
    setChordIndex(0);
    await startMetronome(tempo);
    let i = 0;
    const beatMs = (60 / tempo) * 1000 * 4;
    const song = selected;
    practiceIntervalRef.current = setInterval(() => {
      if (practiceRunRef.current !== runId) return;
      playChordAt(i % song.chords.length);
      i++;
      if (i >= song.chords.length * 4) {
        clearPracticeInterval();
        stopMetronome();
        setPracticeMode(false);
        if (isAuthenticated) {
          api.practiceSong(song.id, Math.round((song.chords.length * beatMs) / 1000)).catch(() => {});
        }
      }
    }, beatMs);
  };

  const stopPractice = () => {
    practiceRunRef.current += 1;
    clearPracticeInterval();
    setPracticeMode(false);
    stopMetronome();
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Music className="w-8 h-8 text-brand-400" />
          Song Practice
        </h1>
        <p className="text-slate-400">Beginner songs organized by scale and difficulty</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'beginner', 'intermediate'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl capitalize text-sm ${
              filter === f ? 'bg-brand-600' : 'glass'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filtered.map((song) => (
            <button
              key={song.id}
              type="button"
              onClick={() => setSelected(song)}
              className={`w-full text-left px-4 py-3 rounded-xl ${
                selected?.id === song.id ? 'bg-brand-600/30 border border-brand-500/50' : 'glass'
              }`}
            >
              <p className="font-medium">{song.title}</p>
              <p className="text-xs text-slate-500">{song.scaleKey} · {song.difficulty}</p>
            </button>
          ))}
        </div>

        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-2 space-y-6"
          >
            <Card>
              <h2 className="text-2xl font-bold">{selected.title}</h2>
              {selected.artist && <p className="text-slate-400">{selected.artist}</p>}
              <div className="flex flex-wrap gap-3 mt-4 text-sm">
                <span className="px-2 py-1 rounded-lg bg-brand-600/20">{selected.scaleKey}</span>
                <span className="px-2 py-1 rounded-lg glass">{selected.progression}</span>
                <span className="px-2 py-1 rounded-lg glass capitalize">{selected.category}</span>
              </div>
            </Card>

            <MetronomeControl
              bpm={tempo}
              onBpmChange={setTempo}
              running={isMetronomeRunning()}
              onToggle={() => (isMetronomeRunning() ? stopMetronome() : startMetronome(tempo))}
            />

            <div className="flex flex-wrap gap-2">
              {selected.chords.map((chord, i) => (
                <button
                  key={`${chord}-${i}`}
                  type="button"
                  onClick={() => playChordAt(i)}
                  className={`px-5 py-3 rounded-xl font-mono transition-all ${
                    chordIndex === i && practiceMode
                      ? 'bg-brand-500 text-white scale-105'
                      : 'glass hover:bg-white/10'
                  }`}
                >
                  {chord}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              {!practiceMode ? (
                <Button onClick={startPractice}>
                  <Play className="w-4 h-4" /> Practice mode
                </Button>
              ) : (
                <Button variant="danger" onClick={stopPractice}>
                  <Pause className="w-4 h-4" /> Stop
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
