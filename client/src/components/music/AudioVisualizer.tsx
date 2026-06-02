import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface AudioVisualizerProps {
  active?: boolean;
  barCount?: number;
}

export function AudioVisualizer({ active = false, barCount = 24 }: AudioVisualizerProps) {
  const bars = Array.from({ length: barCount }, (_, i) => i);

  return (
    <div className="flex items-end justify-center gap-0.5 h-16">
      {bars.map((i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-gradient-to-t from-brand-600 to-brand-400"
          animate={
            active
              ? {
                  height: [8, 12 + Math.random() * 40, 8],
                }
              : { height: 8 }
          }
          transition={{
            duration: 0.4 + Math.random() * 0.3,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: i * 0.03,
          }}
          style={{ height: 8 }}
        />
      ))}
    </div>
  );
}

export function MetronomeControl({
  bpm,
  onBpmChange,
  running,
  onToggle,
}: {
  bpm: number;
  onBpmChange: (bpm: number) => void;
  running: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-4">
      <span className="text-sm text-slate-400 font-medium">Metronome</span>
      <input
        type="range"
        min={40}
        max={208}
        value={bpm}
        onChange={(e) => onBpmChange(Number(e.target.value))}
        className="flex-1 min-w-[120px] accent-brand-500"
      />
      <span className="font-mono text-brand-400 w-12">{bpm} BPM</span>
      <button
        type="button"
        onClick={onToggle}
        className={`px-4 py-2 rounded-lg text-sm font-medium ${
          running ? 'bg-red-600/80 text-white' : 'bg-brand-600 text-white'
        }`}
      >
        {running ? 'Stop' : 'Start'}
      </button>
    </div>
  );
}

export function useMidiInput(enabled: boolean) {
  const accessRef = useRef<MIDIAccess | null>(null);

  useEffect(() => {
    if (!enabled || !navigator.requestMIDIAccess) return;

    navigator.requestMIDIAccess().then((access) => {
      accessRef.current = access;
      for (const input of access.inputs.values()) {
        input.onmidimessage = (msg) => {
          const data = msg.data;
          if (!data || data.length < 3) return;
          const status = data[0];
          const note = data[1];
          const velocity = data[2];
          if ((status & 0xf0) === 0x90 && velocity > 0) {
            window.dispatchEvent(
              new CustomEvent('kys-midi-note', { detail: { note, velocity } })
            );
          }
        };
      }
    }).catch(() => {});

    return () => {
      accessRef.current?.inputs.forEach((input) => {
        input.onmidimessage = null;
      });
    };
  }, [enabled]);
}
