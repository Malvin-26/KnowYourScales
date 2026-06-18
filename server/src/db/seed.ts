import sql, { initDatabase } from './database.js';
import { fileURLToPath } from 'url';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_EQUIV: Record<string, string> = {
  'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb',
};

const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

function getScaleNotes(root: string, intervals: number[]): string[] {
  const rootIdx = NOTE_NAMES.indexOf(root);
  if (rootIdx === -1) return [];
  return intervals.map((semi) => NOTE_NAMES[(rootIdx + semi) % 12]);
}

function relativeMinor(majorRoot: string): string {
  const idx = NOTE_NAMES.indexOf(majorRoot);
  return NOTE_NAMES[(idx + 9) % 12];
}

function relativeMajor(minorRoot: string): string {
  const idx = NOTE_NAMES.indexOf(minorRoot);
  return NOTE_NAMES[(idx + 3) % 12];
}

export async function seedIfEmpty(): Promise<void> {
  const countRes = await sql`SELECT COUNT(*) as count FROM achievements`;
  if (Number(countRes[0].count) > 0) {
    console.log('Database already seeded.');
    return;
  }

  console.log('Seeding scales...');
  for (const root of NOTE_NAMES) {
    const majorNotes = getScaleNotes(root, MAJOR_INTERVALS);
    const relMin = relativeMinor(root);
    await sql`
      INSERT INTO scales (id, root, type, notes, formula, relative_key)
      VALUES (${root + '-major'}, ${root}, 'major', ${JSON.stringify(majorNotes)}, 'W-W-H-W-W-W-H', ${relMin + ' minor'})
      ON CONFLICT (id) DO NOTHING
    `;

    const minorNotes = getScaleNotes(root, MINOR_INTERVALS);
    const relMaj = relativeMajor(root);
    await sql`
      INSERT INTO scales (id, root, type, notes, formula, relative_key)
      VALUES (${root + '-minor'}, ${root}, 'minor', ${JSON.stringify(minorNotes)}, 'W-H-W-W-H-W-W', ${relMaj + ' major'})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  const progressions = [
    {
      id: 'pop-1-4-5-1',
      name: 'I–IV–V–I',
      genre: 'Pop / Rock',
      key_example: 'C major',
      numerals: 'I–IV–V–I',
      chords: JSON.stringify(['C', 'F', 'G', 'C']),
      description: 'Classic pop and rock cadence',
    },
    {
      id: 'jazz-2-5-1',
      name: 'ii–V–I',
      genre: 'Jazz',
      key_example: 'C major',
      numerals: 'ii–V–I',
      chords: JSON.stringify(['Dm', 'G7', 'Cmaj7']),
      description: 'Essential jazz turnaround',
    },
    {
      id: 'pop-1-5-6-4',
      name: 'I–V–vi–IV',
      genre: 'Pop',
      key_example: 'C major',
      numerals: 'I–V–vi–IV',
      chords: JSON.stringify(['C', 'G', 'Am', 'F']),
      description: 'Axis of Awesome progression',
    },
    {
      id: 'blues-12-bar',
      name: '12-Bar Blues',
      genre: 'Blues',
      key_example: 'C major',
      numerals: 'I–I–I–I–IV–IV–I–I–V–IV–I–V',
      chords: JSON.stringify(['C7', 'C7', 'C7', 'C7', 'F7', 'F7', 'C7', 'C7', 'G7', 'F7', 'C7', 'G7']),
      description: 'Standard 12-bar blues in C',
    },
    {
      id: 'folk-1-6-4-5',
      name: 'I–vi–IV–V',
      genre: 'Folk',
      key_example: 'C major',
      numerals: 'I–vi–IV–V',
      chords: JSON.stringify(['C', 'Am', 'F', 'G']),
      description: '50s doo-wop and folk staple',
    },
    {
      id: 'jazz-2-5-1-minor',
      name: 'ii–V–i (minor)',
      genre: 'Jazz',
      key_example: 'A minor',
      numerals: 'iiø–V7–i',
      chords: JSON.stringify(['Bm7b5', 'E7', 'Am']),
      description: 'Minor key jazz cadence',
    },
  ];

  console.log('Seeding chord progressions...');
  for (const p of progressions) {
    await sql`
      INSERT INTO chord_progressions (id, name, genre, key_example, numerals, chords, description)
      VALUES (${p.id}, ${p.name}, ${p.genre}, ${p.key_example}, ${p.numerals}, ${p.chords}, ${p.description})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  const songs = [
    {
      id: 'ode-to-joy',
      title: 'Ode to Joy',
      artist: 'Beethoven',
      scale_key: 'D major',
      difficulty: 'beginner',
      tempo: 100,
      progression: 'I–IV–V–I',
      chords: JSON.stringify(['D', 'G', 'A', 'D']),
      category: 'classical',
    },
    {
      id: 'twinkle',
      title: 'Twinkle Twinkle Little Star',
      artist: 'Traditional',
      scale_key: 'C major',
      difficulty: 'beginner',
      tempo: 90,
      progression: 'I–I–IV–I',
      chords: JSON.stringify(['C', 'C', 'F', 'C']),
      category: 'nursery',
    },
    {
      id: 'amazing-grace',
      title: 'Amazing Grace',
      artist: 'Traditional',
      scale_key: 'G major',
      difficulty: 'beginner',
      tempo: 72,
      progression: 'I–V–I',
      chords: JSON.stringify(['G', 'D', 'G']),
      category: 'hymn',
    },
    {
      id: 'greensleeves',
      title: 'Greensleeves',
      artist: 'Traditional',
      scale_key: 'A minor',
      difficulty: 'intermediate',
      tempo: 80,
      progression: 'i–VII–VI–V',
      chords: JSON.stringify(['Am', 'G', 'F', 'E']),
      category: 'folk',
    },
    {
      id: 'house-rising-sun',
      title: 'House of the Rising Sun',
      artist: 'Traditional',
      scale_key: 'A minor',
      difficulty: 'intermediate',
      tempo: 110,
      progression: 'i–III–IV–VI',
      chords: JSON.stringify(['Am', 'C', 'D', 'F']),
      category: 'folk',
    },
    {
      id: 'let-it-be',
      title: 'Let It Be (simplified)',
      artist: 'The Beatles',
      scale_key: 'C major',
      difficulty: 'beginner',
      tempo: 74,
      progression: 'I–V–vi–IV',
      chords: JSON.stringify(['C', 'G', 'Am', 'F']),
      category: 'pop',
    },
  ];

  console.log('Seeding songs...');
  for (const s of songs) {
    await sql`
      INSERT INTO songs (id, title, artist, scale_key, difficulty, tempo, progression, chords, category)
      VALUES (${s.id}, ${s.title}, ${s.artist}, ${s.scale_key}, ${s.difficulty}, ${s.tempo}, ${s.progression}, ${s.chords}, ${s.category})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  const achievements = [
    { id: 'first-scale', name: 'First Steps', description: 'Explore your first scale', icon: '🎹', xp_reward: 25, category: 'explorer' },
    { id: 'scale-master', name: 'Scale Master', description: 'Explore 12 different scales', icon: '🏆', xp_reward: 100, category: 'explorer' },
    { id: 'quiz-rookie', name: 'Quiz Rookie', description: 'Complete your first quiz', icon: '📝', xp_reward: 30, category: 'quiz' },
    { id: 'perfect-quiz', name: 'Perfect Score', description: 'Score 100% on any quiz', icon: '💯', xp_reward: 75, category: 'quiz' },
    { id: 'ear-beginner', name: 'Golden Ear', description: 'Complete 5 ear training sessions', icon: '👂', xp_reward: 60, category: 'ear' },
    { id: 'streak-3', name: 'On Fire', description: 'Maintain a 3-day practice streak', icon: '🔥', xp_reward: 50, category: 'practice' },
    { id: 'streak-7', name: 'Week Warrior', description: 'Maintain a 7-day practice streak', icon: '⚡', xp_reward: 150, category: 'practice' },
    { id: 'level-5', name: 'Rising Star', description: 'Reach level 5', icon: '⭐', xp_reward: 100, category: 'level' },
    { id: 'level-10', name: 'Theory Pro', description: 'Reach level 10', icon: '🎓', xp_reward: 200, category: 'level' },
    { id: 'chord-explorer', name: 'Chord Explorer', description: 'Practice 5 chord progressions', icon: '🎸', xp_reward: 40, category: 'chords' },
  ];

  console.log('Seeding achievements...');
  for (const a of achievements) {
    await sql`
      INSERT INTO achievements (id, name, description, icon, xp_reward, category)
      VALUES (${a.id}, ${a.name}, ${a.description}, ${a.icon}, ${a.xp_reward}, ${a.category})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  console.log('Seed complete!');
}

const currentFile = fileURLToPath(import.meta.url);
const isMain = process.argv[1] && (
  process.argv[1] === currentFile ||
  process.argv[1].endsWith('seed.ts') ||
  process.argv[1].endsWith('seed.js')
);

if (isMain) {
  try {
    await initDatabase();
    console.log('Seed ran successfully as a main process.');
    await sql.end();
  } catch (error) {
    console.error('Error during seed execution:', error);
    process.exit(1);
  }
}
