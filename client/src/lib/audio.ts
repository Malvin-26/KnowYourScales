import * as Tone from 'tone';

let initialized = false;

export async function initAudio(): Promise<void> {
  if (initialized) return;
  await Tone.start();
  initialized = true;
}

const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: 'triangle' },
  envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.8 },
}).toDestination();

const chordSynth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: 'sine' },
  envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 1 },
}).toDestination();

chordSynth.volume.value = -6;

export function playNote(note: string, octave = 4, duration = '8n'): void {
  const freq = `${note}${octave}`;
  synth.triggerAttackRelease(freq, duration);
}

export function playMidi(midi: number, duration = '8n'): void {
  const freq = Tone.Frequency(midi, 'midi').toNote();
  synth.triggerAttackRelease(freq, duration);
}

export function playNotes(notes: string[], octave = 4, stagger = 0.12): void {
  notes.forEach((note, i) => {
    Tone.getTransport().scheduleOnce(() => {
      playNote(note, octave);
    }, `+${i * stagger}`);
  });
}

export function playChord(notes: string[], octave = 3, duration = '2n'): void {
  const freqs = notes.map((n) => `${n}${octave}`);
  chordSynth.triggerAttackRelease(freqs, duration);
}

export function playScale(notes: string[], octave = 4, noteDuration = 0.35): void {
  notes.forEach((note, i) => {
    setTimeout(() => playNote(note, octave), i * noteDuration * 1000);
  });
}

let metronomeId: number | null = null;
let metronomeSynth: Tone.MembraneSynth | null = null;
let metronomeLoop: Tone.Loop | null = null;

export async function startMetronome(bpm: number): Promise<void> {
  await initAudio();
  stopMetronome();
  metronomeSynth = new Tone.MembraneSynth().toDestination();
  metronomeSynth.volume.value = -12;
  Tone.getTransport().bpm.value = bpm;
  metronomeLoop = new Tone.Loop((time) => {
    metronomeSynth?.triggerAttackRelease('C2', '16n', time);
  }, '4n');
  metronomeLoop.start(0);
  Tone.getTransport().start();
  metronomeId = 1;
}

export function stopMetronome(): void {
  metronomeLoop?.stop();
  metronomeLoop?.dispose();
  metronomeLoop = null;
  Tone.getTransport().stop();
  Tone.getTransport().cancel();
  metronomeSynth?.dispose();
  metronomeSynth = null;
  metronomeId = null;
}

export function isMetronomeRunning(): boolean {
  return metronomeId !== null;
}

export function getAnalyser(): Tone.Analyser {
  return Tone.getContext().createAnalyser() as unknown as Tone.Analyser;
}

export { Tone };
