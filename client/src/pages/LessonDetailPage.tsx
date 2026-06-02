import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ExternalLink } from 'lucide-react';
import { getLesson, LESSON_SECTION } from '../data/lessons';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';

export function LessonDetailPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const lesson = lessonId ? getLesson(lessonId) : undefined;
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !lessonId) return;
    api.getLessonProgress().then(({ completed: ids }) => {
      setCompleted(ids.includes(lessonId));
    }).catch(() => {});
  }, [isAuthenticated, lessonId]);

  if (!lesson) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400 mb-4">Lesson not found.</p>
        <Link to="/lessons" className="text-brand-400 hover:underline">Back to lessons</Link>
      </div>
    );
  }

  const handleComplete = async () => {
    if (!isAuthenticated) {
      toast('Sign in to earn lesson credits', 'info');
      return;
    }
    if (completed) return;
    setCompleting(true);
    try {
      const result = await api.completeLesson(lesson.id);
      setCompleted(true);
      if (result.xpEarned > 0) {
        toast(`Lesson complete! +${result.xpEarned} credits earned`, 'success');
      } else {
        toast('You already completed this lesson', 'info');
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save progress', 'error');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <Link to="/lessons" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft className="w-4 h-4" /> Back to {LESSON_SECTION}
      </Link>

      <header>
        <p className="text-sm text-brand-400 mb-1">Lesson {lesson.order} · {LESSON_SECTION}</p>
        <h1 className="text-3xl font-bold">{lesson.title}</h1>
        <p className="text-slate-400 mt-2">{lesson.summary}</p>
      </header>

      <div className="glass-strong rounded-2xl overflow-hidden aspect-video">
        <iframe
          title={`${lesson.title} video`}
          className="w-full h-full"
          src={`https://www.youtube-nocookie.com/embed/${lesson.youtubeId}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>

      <article className="glass rounded-2xl p-6 sm:p-8 space-y-6 prose prose-invert max-w-none">
        {lesson.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">{section.heading}</h2>
            <p className="text-slate-300 leading-relaxed">{section.body}</p>
          </section>
        ))}
        <p className="text-sm text-slate-500 border-t border-white/10 pt-4">
          Further reading:{' '}
          <a
            href={lesson.furtherReading.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-400 hover:underline inline-flex items-center gap-1"
          >
            {lesson.furtherReading.label}
            <ExternalLink className="w-3 h-3" />
          </a>
          {' '}(Hello Music Theory — external resource)
        </p>
      </article>

      <div className="flex flex-wrap items-center gap-4">
        {completed ? (
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
            Completed · +30 credits earned
          </div>
        ) : (
          <Button onClick={handleComplete} loading={completing} size="lg">
            Mark lesson complete (+30 credits)
          </Button>
        )}
        {!isAuthenticated && (
          <p className="text-sm text-slate-500">
            <Link to="/login" className="text-brand-400 hover:underline">Sign in</Link> to save progress.
          </p>
        )}
      </div>
    </div>
  );
}
