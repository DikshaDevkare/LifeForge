import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, Lock, User, Flame, Sparkles } from 'lucide-react';

type Mode = 'signin' | 'signup';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'signup' && username.trim().length < 2) {
      setError('Username must be at least 2 characters.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    const result =
      mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password, username.trim());

    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel — branding */}
      <div className="lg:w-1/2 relative overflow-hidden bg-neutral-950 flex items-center justify-center p-8 lg:p-16">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/20 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-600/30">
              <Flame className="w-7 h-7 text-white" />
            </div>
            <span className="font-display text-2xl font-bold text-white">LifeForge</span>
          </div>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
            Forge your <span className="gradient-text">best self</span>
          </h1>
          <p className="text-neutral-400 text-lg leading-relaxed mb-8">
            Turn your daily habits, goals, and tasks into epic quests. Earn XP, level up your
            character, and build a life you're proud of.
          </p>
          <div className="space-y-3">
            {[
              { icon: '⚔️', text: 'Complete quests to earn XP' },
              { icon: '📈', text: 'Track streaks and build momentum' },
              { icon: '🏆', text: 'Level up and unlock achievements' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-neutral-300">
                <span className="text-xl">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-neutral-900/30">
        <div className="w-full max-w-md">
          <div className="glass-card p-8">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-secondary-400" />
              <h2 className="font-display text-xl font-semibold text-white">
                {mode === 'signin' ? 'Welcome back, hero' : 'Begin your journey'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <Input
                  label="Username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="QuestMaster"
                  icon={<User className="w-4 h-4" />}
                  required
                />
              )}
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hero@lifeforge.app"
                icon={<Mail className="w-4 h-4" />}
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                required
              />

              {error && (
                <div className="bg-error-500/10 border border-error-500/20 rounded-xl px-4 py-3 text-sm text-error-300">
                  {error}
                </div>
              )}

              <Button type="submit" fullWidth size="lg" loading={loading}>
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setError(null);
                }}
                className="text-sm text-neutral-400 hover:text-primary-400 transition-colors"
              >
                {mode === 'signin'
                  ? "Don't have an account? Sign up"
                  : 'Already a hero? Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
