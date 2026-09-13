import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AttributeBar } from './AttributeBar';
import { ATTRIBUTE_KEYS, CHARACTER_CLASS_META, type AttributeKey } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { Coins, Zap, Flame, Target, Award, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { InventoryItem } from '@/types/database';

export function CharacterSheet() {
  const { profile, refreshProfile } = useAuth();
  const [allocating, setAllocating] = useState<string | null>(null);
  const [equippedItems, setEquippedItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('inventory_items')
      .select('*, item:shop_items(*)')
      .eq('user_id', profile.id)
      .not('equipped_at', 'is', null)
      .then(({ data }) => setEquippedItems((data ?? []) as InventoryItem[]));
  }, [profile]);

  if (!profile) return null;

  const classMeta = CHARACTER_CLASS_META[profile.character_class];

  const handleAllocate = async (attribute: AttributeKey) => {
    setAllocating(attribute);
    const { error } = await supabase.rpc('spend_attribute_point', { p_attribute: attribute });
    if (!error) {
      await refreshProfile();
    }
    setAllocating(null);
  };

  return (
    <div className="space-y-4">
      {/* Character identity card */}
      <Card className="bg-gradient-to-br from-neutral-900/80 to-neutral-950/80 border-neutral-700">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-700/20 border border-primary-500/30 flex items-center justify-center flex-shrink-0">
            <span className="font-display text-2xl font-bold text-primary-300">
              {profile.level}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-bold text-white truncate">{profile.username}</h3>
            <p className="text-sm text-primary-400 capitalize">{classMeta.label}</p>
            {profile.title && (
              <p className="text-xs text-secondary-400 mt-0.5">{profile.title}</p>
            )}
            {equippedItems.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {equippedItems.map((entry) => (
                  <span key={entry.id} className="rounded-full border border-secondary-500/20 bg-secondary-500/10 px-2 py-0.5 text-[10px] text-secondary-300">
                    {entry.item?.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500">Level</p>
            <p className="font-display text-xl font-bold text-white">{profile.level}</p>
          </div>
        </div>

        {/* XP bar */}
        <div className="mt-4">
          <ProgressBar
            value={profile.xp}
            max={profile.xp_to_next_level}
            color="secondary"
            size="md"
            showValue
          />
          <p className="mt-2 text-xs text-neutral-500">
            {(profile.xp_to_next_level - profile.xp).toLocaleString()} XP to level {profile.level + 1}
          </p>
        </div>
      </Card>

      {/* Currency row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary-500/15 flex items-center justify-center">
              <Coins className="w-4 h-4 text-secondary-400" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm">{profile.coins.toLocaleString()}</p>
              <p className="text-[10px] text-neutral-500">Coins</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-400" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm">{profile.total_xp.toLocaleString()}</p>
              <p className="text-[10px] text-neutral-500">Total XP</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-warning-500/15 flex items-center justify-center">
              <Flame className="w-4 h-4 text-warning-400" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm">{profile.streak_days}</p>
              <p className="text-[10px] text-neutral-500">Streak</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Attributes */}
      <Card>
        <CardHeader
          title="Attributes"
          subtitle={
            profile.attribute_points > 0
              ? `${profile.attribute_points} points to spend`
              : 'Earn points by leveling up'
          }
          icon={<TrendingUp className="w-5 h-5" />}
          action={
            profile.attribute_points > 0 ? (
              <span className="px-2.5 py-1 rounded-full bg-primary-500/15 border border-primary-500/20 text-xs font-medium text-primary-300">
                {profile.attribute_points} available
              </span>
            ) : undefined
          }
        />
        <div className="space-y-3">
          {ATTRIBUTE_KEYS.map((key) => (
            <AttributeBar
              key={key}
              attribute={key}
              value={profile[key]}
              canAllocate={profile.attribute_points > 0 && allocating !== key}
              onAllocate={handleAllocate}
            />
          ))}
        </div>
      </Card>

      {/* Lifetime stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-accent-400" />
            <div>
              <p className="font-display font-bold text-white">{profile.quests_completed}</p>
              <p className="text-xs text-neutral-500">Quests Completed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-primary-400" />
            <div>
              <p className="font-display font-bold text-white">{profile.titles.length}</p>
              <p className="text-xs text-neutral-500">Titles Unlocked</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
