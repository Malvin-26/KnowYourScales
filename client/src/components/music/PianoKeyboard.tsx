import { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { initAudio, playMidi } from '../../lib/audio';
import { NOTE_NAMES, normalizeNote } from '../../lib/musicTheory';

const KEY_PATTERN: { note: string; isBlack: boolean }[] = [
  { note: 'C', isBlack: false },
  { note: 'C#', isBlack: true },
  { note: 'D', isBlack: false },
  { note: 'D#', isBlack: true },
  { note: 'E', isBlack: false },
  { note: 'F', isBlack: false },
  { note: 'F#', isBlack: true },
  { note: 'G', isBlack: false },
  { note: 'G#', isBlack: true },
  { note: 'A', isBlack: false },
  { note: 'A#', isBlack: true },
  { note: 'B', isBlack: false },
];

interface PianoKeyboardProps {
  startOctave?: number;
  octaves?: number;
  highlightedNotes?: string[];
  rootNote?: string;
  onNotePlay?: (note: string, octave: number) => void;
  className?: string;
}

export function PianoKeyboard({
  startOctave = 3,
  octaves = 2,
  highlightedNotes = [],
  rootNote,
  onNotePlay,
  className = '',
}: PianoKeyboardProps) {
  const highlightSet = useMemo(
    () => new Set(highlightedNotes.map(normalizeNote)),
    [highlightedNotes]
  );
  const rootNorm = rootNote ? normalizeNote(rootNote) : null;

  const keys = useMemo(() => {
    const result: { note: string; octave: number; isBlack: boolean; id: string }[] = [];
    for (let o = 0; o < octaves; o++) {
      const octave = startOctave + o;
      KEY_PATTERN.forEach(({ note, isBlack }) => {
        result.push({ note, octave, isBlack, id: `${note}-${octave}` });
      });
    }
    return result;
  }, [startOctave, octaves]);

  const whiteKeys = keys.filter((k) => !k.isBlack);

  const handlePlay = useCallback(
    async (note: string, octave: number) => {
      await initAudio();
      const idx = NOTE_NAMES.indexOf(normalizeNote(note) as (typeof NOTE_NAMES)[number]);
      if (idx >= 0) playMidi((octave + 1) * 12 + idx);
      onNotePlay?.(note, octave);
    },
    [onNotePlay]
  );

  const getStyle = (norm: string) => {
    const isRoot = rootNorm === norm;
    const inScale = highlightSet.has(norm);
    if (isRoot) return 'bg-brand-500/50 border-brand-400 ring-1 ring-brand-400';
    if (inScale) return 'bg-brand-600/30 border-brand-500/50';
    return '';
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      <div className="flex">
        {whiteKeys.map((k) => {
          const norm = normalizeNote(k.note);
          return (
            <motion.button
              key={k.id}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => handlePlay(k.note, k.octave)}
              className={`w-10 sm:w-12 h-32 sm:h-40 border border-slate-600/40 rounded-b-md bg-slate-100 hover:bg-white mx-px transition-colors ${getStyle(norm)}`}
            >
              <span className="text-[9px] text-slate-500 font-mono block mt-auto pt-28 sm:pt-36">
                {k.note}
                <sub>{k.octave}</sub>
              </span>
            </motion.button>
          );
        })}
      </div>
      <div className="absolute top-0 left-0 w-full h-24 pointer-events-none">
        {keys
          .filter((k) => k.isBlack)
          .map((k) => {
            const whitesBefore = keys.filter(
              (x) =>
                !x.isBlack &&
                (x.octave < k.octave ||
                  (x.octave === k.octave &&
                    KEY_PATTERN.findIndex((p) => p.note === x.note) <
                      KEY_PATTERN.findIndex((p) => p.note === k.note)))
            ).length;
            const leftPct = ((whitesBefore - 0.35) / whiteKeys.length) * 100;
            const norm = normalizeNote(k.note);
            return (
              <motion.button
                key={k.id}
                type="button"
                style={{ left: `calc(${leftPct}% - 14px)` }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePlay(k.note, k.octave)}
                className={`absolute w-7 sm:w-8 h-20 sm:h-24 rounded-b-md pointer-events-auto z-10 border border-slate-700 bg-slate-900 hover:bg-slate-800 transition-colors ${getStyle(norm)}`}
              />
            );
          })}
      </div>
    </div>
  );
}
