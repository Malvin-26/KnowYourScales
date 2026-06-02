import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Target, TrendingUp, Award, ChevronRight } from 'lucide-react';
import { api, type ProgressResponse, type Recommendation } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/ui/Loading';
import { Card } from '../components/ui/Card';

export function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<ProgressResponse | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    Promise.all([api.getProgress(), api.getRecommendations()])
      .then(([progress, { recommendations }]) => {
        setData(progress);
        setRecs(recommendations);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-4">Your Dashboard</h1>
        <p className="text-slate-400 mb-6">Sign in to track progress, streaks, and XP.</p>
        <Link to="/login" className="text-brand-400 hover:underline">Sign in →</Link>
      </div>
    );
  }

  if (loading) return <PageLoader />;
  const p = data?.progress;

  const xpPct = p ? (p.xpInCurrentLevel / 500) * 100 : 0;
  const dailyPct = p ? Math.min(100, (p.daily_minutes_today / p.daily_goal_minutes) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-slate-400">Track your daily practice and growth</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: 'Level', value: p?.level ?? 1, sub: `${p?.xp ?? 0} XP` },
          { icon: Flame, label: 'Streak', value: `${p?.practice_streak ?? 0} days`, sub: `Best: ${p?.longest_streak ?? 0}` },
          { icon: Target, label: 'Daily goal', value: `${p?.daily_minutes_today ?? 0}/${p?.daily_goal_minutes ?? 15} min` },
          { icon: Award, label: 'Achievements', value: data?.achievements?.length ?? 0 },
        ].map(({ icon: Icon, label, value, sub }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <Icon className="w-5 h-5 text-brand-400 mb-2" />
              <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
              {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-semibold mb-4">Level progress</h2>
          <div className="h-3 rounded-full bg-surface-700 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
            />
          </div>
          <p className="text-sm text-slate-500 mt-2">
            {p?.xpInCurrentLevel ?? 0} / 500 XP to level {(p?.level ?? 1) + 1}
          </p>
        </Card>
        <Card>
          <h2 className="font-semibold mb-4">Today&apos;s practice</h2>
          <div className="h-3 rounded-full bg-surface-700 overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500/80 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${dailyPct}%` }}
            />
          </div>
          <p className="text-sm text-slate-500 mt-2">{Math.round(dailyPct)}% of daily goal</p>
        </Card>
      </div>

      <div>
        <h2 className="font-semibold mb-4">AI Recommendations</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {recs.map((r) => (
            <Link key={r.path} to={r.path}>
              <Card hover className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm text-slate-400">{r.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <h2 className="font-semibold mb-4">Statistics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
          {[
            ['Scales', p?.scales_explored],
            ['Quizzes', p?.quizzes_completed],
            ['Ear training', p?.ear_sessions_completed],
            ['Chords', p?.chords_practiced],
            ['Songs', p?.songs_practiced],
          ].map(([label, val]) => (
            <div key={label as string}>
              <p className="text-2xl font-bold text-brand-400">{val ?? 0}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
