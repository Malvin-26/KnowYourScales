import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Piano, Headphones, Trophy, Zap, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AudioVisualizer } from '../components/music/AudioVisualizer';

const features = [
  { icon: Piano, title: 'Scale Explorer', desc: 'Interactive piano, circle of fifths, and interval formulas' },
  { icon: Headphones, title: 'Ear Training', desc: 'Notes, intervals, and chord recognition exercises' },
  { icon: Trophy, title: 'Quizzes & XP', desc: 'Timed challenges, streaks, and achievement badges' },
  { icon: Zap, title: 'Chord Progressions', desc: 'I–IV–V–I, ii–V–I, and genre-based practice' },
];

export function LandingPage() {
  return (
    <div className="-mx-4 sm:-mx-6">
      <section className="relative overflow-hidden px-4 sm:px-6 pt-16 pb-24 sm:pt-24 sm:pb-32">
        <div className="absolute inset-0 gradient-mesh pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-3 py-1 rounded-full glass text-xs text-brand-300 mb-6">
              Interactive Music Theory Platform
            </span>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
              Master scales.{' '}
              <span className="text-gradient">Train your ears.</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
              Know Your Scales helps you learn major and minor scales, understand note relationships,
              practice chord progressions, and build real musicianship through play.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register">
                <Button size="lg">
                  Get started free <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/scales">
                <Button variant="secondary" size="lg">
                  Explore scales
                </Button>
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12"
          >
            <AudioVisualizer active />
          </motion.div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-center mb-10">Everything you need to grow</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-brand-400" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-slate-400">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
