export interface Lesson {
  id: string;
  title: string;
  order: number;
  youtubeId: string;
  summary: string;
  sections: Array<{ heading: string; body: string }>;
  furtherReading: { label: string; url: string };
}

export const LESSON_SECTION = 'Introduction to Scales';

export const LESSONS: Lesson[] = [
  {
    id: 'scales-notes-and-keys',
    title: 'Scales, Notes and Key',
    order: 1,
    youtubeId: 'Zs7617DJKKg',
    summary:
      'Learn how pitch names, scales, and key signatures work together as the foundation of Western music theory.',
    sections: [
      {
        heading: 'What is a note?',
        body:
          'A note is a specific musical pitch. In Western music we use twelve pitch classes (C, C♯, D, and so on) that repeat in higher and lower octaves. The distance between two adjacent pitch classes is a semitone.',
      },
      {
        heading: 'What is a scale?',
        body:
          'A scale is an ordered set of notes built from a starting pitch (the tonic). Major and minor scales are the most common in popular and classical music. Each scale type follows a fixed pattern of tones and semitones.',
      },
      {
        heading: 'What is a key?',
        body:
          'A key tells you which scale—and therefore which group of notes and chords—feels like “home” in a piece. The key signature at the start of a score shows which notes are consistently sharpened or flattened.',
      },
      {
        heading: 'Why this matters',
        body:
          'Understanding notes, scales, and keys helps you read music faster, transpose songs, improvise melodies, and communicate with other musicians using shared vocabulary.',
      },
    ],
    furtherReading: {
      label: 'Hello Music Theory — home',
      url: 'https://hellomusictheory.com/',
    },
  },
  {
    id: 'circle-of-fifths',
    title: 'The Circle of Fifths',
    order: 2,
    youtubeId: 'd1n44x1GVMw',
    summary:
      'The circle of fifths maps keys by perfect fifths so you can see relationships, key signatures, and chord progressions at a glance.',
    sections: [
      {
        heading: 'Reading the circle',
        body:
          'Moving clockwise adds one sharp to the key signature (or removes a flat). Moving counter-clockwise adds one flat. Each step is a perfect fifth apart.',
      },
      {
        heading: 'Relative major and minor',
        body:
          'Major and minor keys that share the same key signature sit next to each other on the circle. C major and A minor are relatives—no sharps or flats in either.',
      },
      {
        heading: 'Practical uses',
        body:
          'Use the circle to find closely related keys for modulations, to build diatonic chord progressions, and to memorize key signatures quickly.',
      },
    ],
    furtherReading: {
      label: 'The Circle Of Fifths: A Complete Guide',
      url: 'https://hellomusictheory.com/learn-music-theory/circle-of-fifths/',
    },
  },
  {
    id: 'scale-degree-names',
    title: 'Scale Degree Names',
    order: 3,
    youtubeId: 'pYbVFomY6e8',
    summary:
      'Each note in a scale has a number and a name (tonic, supertonic, mediant, and so on). These names describe function, not just pitch.',
    sections: [
      {
        heading: 'Numbered degrees',
        body:
          'Scale degrees are numbered 1 through 7 (and sometimes 8 for the octave). In C major: C is 1, D is 2, E is 3, and so on.',
      },
      {
        heading: 'Solfège and names',
        body:
          'In movable-do solfège: do, re, mi, fa, sol, la, ti. Functional names include tonic (1), dominant (5), and leading tone (7 in major).',
      },
      {
        heading: 'Why names matter',
        body:
          'Roman numeral analysis and chord charts refer to scale degrees. Knowing them helps you transpose progressions and understand harmony in any key.',
      },
    ],
    furtherReading: {
      label: 'What Are The Scale Degree Names?',
      url: 'https://hellomusictheory.com/learn-music-theory/scale-degree-names/',
    },
  },
  {
    id: 'music-intervals',
    title: 'Music Intervals',
    order: 4,
    youtubeId: '4H2X3bq3J4s',
    summary:
      'An interval is the distance between two pitches, measured in semitones and named by quality (major, minor, perfect, and so on).',
    sections: [
      {
        heading: 'Melodic vs harmonic',
        body:
          'Melodic intervals are played one note after another; harmonic intervals are played together as part of a chord.',
      },
      {
        heading: 'Naming intervals',
        body:
          'From the lower note, count letter names to the upper note, then determine quality by semitone count. A major third is four semitones above the root.',
      },
      {
        heading: 'Building scales and chords',
        body:
          'Scales are stacks of intervals from the tonic; triads combine a root, third, and fifth. Ear training often starts with recognizing common interval sounds.',
      },
    ],
    furtherReading: {
      label: 'A Guide To Music Intervals',
      url: 'https://hellomusictheory.com/learn-music-theory/intervals/',
    },
  },
  {
    id: 'major-vs-minor',
    title: 'Major vs Minor Scales',
    order: 5,
    youtubeId: 'h_aaBrYJm8Q',
    summary:
      'Major scales sound bright and stable; minor scales often feel darker or more emotional. Both follow predictable interval patterns.',
    sections: [
      {
        heading: 'Major pattern',
        body:
          'Major scales use the pattern: whole, whole, half, whole, whole, whole, half (W-W-H-W-W-W-H). C major has no sharps or flats.',
      },
      {
        heading: 'Natural minor pattern',
        body:
          'Natural minor follows: W-H-W-W-H-W-W. A natural minor shares the same key signature as C major but starts on A.',
      },
      {
        heading: 'Harmonic and melodic minor',
        body:
          'Harmonic minor raises the 7th degree for a stronger pull to the tonic. Melodic minor raises 6 and 7 ascending, often reverting descending in classical style.',
      },
    ],
    furtherReading: {
      label: 'Hello Music Theory lessons',
      url: 'https://hellomusictheory.com/learn/',
    },
  },
];

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}
