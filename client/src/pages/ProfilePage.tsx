import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Award, Settings } from 'lucide-react';
import { api, type EarnedAchievement, type Achievement } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/ui/Loading';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

export function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [earned, setEarned] = useState<EarnedAchievement[]>([]);
  const [all, setAll] = useState<Achievement[]>([]);
  const [dailyGoal, setDailyGoal] = useState(15);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    Promise.all([api.getMyAchievements(), api.getProgress()])
      .then(([ach, progress]) => {
        setEarned(ach.earned);
        setAll(ach.all);
        setDailyGoal(progress.progress.daily_goal_minutes);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const saveGoal = async () => {
    try {
      await api.updateDailyGoal(dailyGoal);
      toast('Daily goal updated', 'success');
    } catch {
      toast('Failed to update goal', 'error');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16">
        <User className="w-16 h-16 mx-auto text-slate-600 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your Profile</h1>
        <p className="text-slate-400">Sign in to view achievements and settings.</p>
      </div>
    );
  }

  if (loading) return <PageLoader />;

  const earnedIds = new Set(earned.map((a) => a.id));

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <Card className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-brand-600/30 flex items-center justify-center">
          <User className="w-10 h-10 text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {user?.displayName || user?.display_name || user?.username}
          </h1>
          <p className="text-slate-400">@{user?.username}</p>
          <p className="text-sm text-slate-500">{user?.email}</p>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5" /> Daily practice goal
        </h2>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={5}
            max={120}
            step={5}
            value={dailyGoal}
            onChange={(e) => setDailyGoal(Number(e.target.value))}
            className="flex-1 accent-brand-500"
          />
          <span className="font-mono w-20">{dailyGoal} min</span>
          <Button size="sm" onClick={saveGoal}>Save</Button>
        </div>
      </Card>

      <div>
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-brand-400" />
          Achievements ({earned.length}/{all.length})
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {all.map((a) => {
            const has = earnedIds.has(a.id);
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`glass rounded-xl p-4 flex gap-3 ${has ? '' : 'opacity-40'}`}
              >
                <span className="text-2xl">{a.icon}</span>
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-xs text-slate-500">{a.description}</p>
                  <p className="text-xs text-brand-400 mt-1">+{a.xp_reward} XP</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Button variant="ghost" onClick={logout} className="text-red-400">
        Log out
      </Button>
    </div>
  );
}
