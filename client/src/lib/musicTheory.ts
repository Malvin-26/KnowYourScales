export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type NoteName = (typeof NOTE_NAMES)[number];

export const INTERVALS = [
  { name: 'Unison', semitones: 0, abbr: 'P1' },
  { name: 'Minor 2nd', semitones: 1, abbr: 'm2' },
  { name: 'Major 2nd', semitones: 2, abbr: 'M2' },
  { name: 'Minor 3rd', semitones: 3, abbr: 'm3' },
  { name: 'Major 3rd', semitones: 4, abbr: 'M3' },
  { name: 'Perfect 4th', semitones: 5, abbr: 'P4' },
  { name: 'Tritone', semitones: 6, abbr: 'TT' },
  { name: 'Perfect 5th', semitones: 7, abbr: 'P5' },
  { name: 'Minor 6th', semitones: 8, abbr: 'm6' },
  { name: 'Major 6th', semitones: 9, abbr: 'M6' },
  { name: 'Minor 7th', semitones: 10, abbr: 'm7' },
  { name: 'Major 7th', semitones: 11, abbr: 'M7' },
  { name: 'Octave', semitones: 12, abbr: 'P8' },
];

export const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
export const MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

export const CIRCLE_OF_FIFTHS = [
  { key: 'C', type: 'major' as const },
  { key: 'G', type: 'major' as const },
  { key: 'D', type: 'major' as const },
  { key: 'A', type: 'major' as const },
  { key: 'E', type: 'major' as const },
  { key: 'B', type: 'major' as const },
  { key: 'F#', type: 'major' as const },
  { key: 'Db', type: 'major' as const },
  { key: 'Ab', type: 'major' as const },
  { key: 'Eb', type: 'major' as const },
  { key: 'Bb', type: 'major' as const },
  { key: 'F', type: 'major' as const },
];

const ENHARMONIC: Record<string, string> = {
  Db: 'C#', 'C#': 'C#', Eb: 'D#', 'D#': 'D#', Gb: 'F#', 'F#': 'F#',
  Ab: 'G#', 'G#': 'G#', Bb: 'A#', 'A#': 'A#', Cb: 'B', 'B#': 'C', Fb: 'E', 'E#': 'F',
};

export function normalizeNote(note: string): string {
  return ENHARMONIC[note] ?? note;
}

export function getScaleNotes(root: string, type: 'major' | 'minor'): string[] {
  const intervals = type === 'major' ? MAJOR_INTERVALS : MINOR_INTERVALS;
  const rootIdx = NOTE_NAMES.indexOf(normalizeNote(root) as NoteName);
  if (rootIdx === -1) return [];
  return intervals.map((s) => NOTE_NAMES[(rootIdx + s) % 12]);
}

export function noteToMidi(note: string, octave = 4): number {
  const n = normalizeNote(note);
  const idx = NOTE_NAMES.indexOf(n as NoteName);
  if (idx === -1) return 60;
  return (octave + 1) * 12 + idx;
}

export function midiToNoteName(midi: number): string {
  return NOTE_NAMES[midi % 12];
}

export function getIntervalName(semitones: number): string {
  const found = INTERVALS.find((i) => i.semitones === semitones % 12);
  return found?.name ?? `${semitones} semitones`;
}

export function randomNote(): NoteName {
  return NOTE_NAMES[Math.floor(Math.random() * 12)];
}

export function noteIndex(note: string): number {
  return NOTE_NAMES.indexOf(normalizeNote(note) as NoteName);
}

export function randomInterval(maxSemitones = 12): (typeof INTERVALS)[number] {
  const filtered = INTERVALS.filter((i) => i.semitones > 0 && i.semitones <= maxSemitones);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export const CHORD_TYPES = [
  { name: 'Major', intervals: [0, 4, 7] },
  { name: 'Minor', intervals: [0, 3, 7] },
  { name: 'Diminished', intervals: [0, 3, 6] },
  { name: 'Augmented', intervals: [0, 4, 8] },
  { name: 'Major 7th', intervals: [0, 4, 7, 11] },
  { name: 'Minor 7th', intervals: [0, 3, 7, 10] },
  { name: 'Dominant 7th', intervals: [0, 4, 7, 10] },
];

export function getChordNotes(root: string, chordType: (typeof CHORD_TYPES)[number]): string[] {
  const rootIdx = NOTE_NAMES.indexOf(normalizeNote(root) as NoteName);
  return chordType.intervals.map((s) => NOTE_NAMES[(rootIdx + s) % 12]);
}
