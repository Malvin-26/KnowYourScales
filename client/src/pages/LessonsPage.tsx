import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, Lock } from 'lucide-react';
import { LESSONS, LESSON_SECTION } from '../data/lessons';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export function LessonsPage() {
  const { isAuthenticated } = useAuth();
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) return;
    api.getLessonProgress().then(({ completed: ids }) => setCompleted(new Set(ids))).catch(() => {});
  }, [isAuthenticated]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-brand-400" />
          Lessons
        </h1>
        <p className="text-slate-400 mt-1">Structured theory guides with video and reading</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-brand-300 mb-4">{LESSON_SECTION}</h2>
        <div className="grid gap-3">
          {LESSONS.map((lesson, i) => {
            const done = completed.has(lesson.id);
            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/lessons/${lesson.id}`}
                  className="glass rounded-xl p-5 flex items-center gap-4 hover:border-brand-500/40 transition-colors block"
                >
                  <span className="w-10 h-10 rounded-lg bg-brand-600/30 flex items-center justify-center font-bold text-brand-300">
                    {lesson.order}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{lesson.title}</h3>
                    <p className="text-sm text-slate-400 truncate">{lesson.summary}</p>
                  </div>
                  {done ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-sm shrink-0">
                      <CheckCircle className="w-4 h-4" /> +30 XP
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 shrink-0">+30 credits</span>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {!isAuthenticated && (
        <p className="text-sm text-slate-500 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          <Link to="/login" className="text-brand-400 hover:underline">Sign in</Link> to earn credits when you complete lessons.
        </p>
      )}
    </div>
  );
}
