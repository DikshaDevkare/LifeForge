export type QuestType = 'daily' | 'weekly' | 'one_time' | 'habit';
export type Difficulty = 'trivial' | 'easy' | 'normal' | 'hard' | 'epic';
export type QuestStatus = 'active' | 'started' | 'focused' | 'completed' | 'abandoned';
export type CharacterClass = 'warrior' | 'mage' | 'rogue' | 'ranger' | 'cleric';
export type AttributeKey =
  | 'strength'
  | 'intelligence'
  | 'vitality'
  | 'dexterity'
  | 'charisma'
  | 'wisdom';

export interface Profile {
  id: string;
  username: string;
  level: number;
  xp: number;
  xp_to_next_level: number;
  total_xp: number;
  coins: number;
  character_class: CharacterClass;
  title: string | null;
  titles: string[];
  attribute_points: number;
  strength: number;
  intelligence: number;
  vitality: number;
  dexterity: number;
  charisma: number;
  wisdom: number;
  quests_completed: number;
  streak_days: number;
  last_completion_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string | null;
  type: QuestType;
  difficulty: Difficulty;
  xp_reward: number;
  category: string;
  estimated_duration_minutes: number;
  status: QuestStatus;
  completed_at: string | null;
  started_at: string | null;
  focused_at: string | null;
  due_date: string | null;
  tags: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface QuestLog {
  id: string;
  quest_id: string | null;
  quest_title: string;
  xp_earned: number;
  difficulty: Difficulty;
  user_id: string;
  completed_at: string;
}

export interface AchievementDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  requirement_type: 'quests' | 'streak' | 'level' | 'xp';
  threshold: number;
}

export interface UserAchievement {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: AchievementDefinition;
}

export type ShopCategory = 'accessory' | 'outfit' | 'effect' | 'character';
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ShopItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ShopCategory;
  rarity: ItemRarity;
  price: number;
  equippable: boolean;
  slot: 'accessory' | 'outfit' | 'effect' | null;
  appearance_key: string | null;
  is_purchasable: boolean;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  purchased_at: string;
  equipped_at: string | null;
  item?: ShopItem;
}

export interface CoinTransaction {
  id: string;
  user_id: string;
  item_id: string | null;
  transaction_type: 'purchase' | 'reward' | 'adjustment';
  amount: number;
  balance_after: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface CompleteQuestResult {
  quest_id?: string;
  xp_gained: number;
  coins_gained: number;
  attribute?: AttributeKey;
  attribute_gained?: number;
  attribute_value?: number;
  attribute_previous_value?: number;
  level_before?: number;
  streak_before?: number;
  coins_balance?: number;
  new_level: number;
  leveled_up: boolean;
  titles_unlocked: string[];
  achievements_unlocked?: { code: string; name: string; description: string }[];
  streak: number;
  quests_completed: number;
  xp_after?: number;
  xp_to_next_level_after?: number;
  total_xp_after?: number;
  level_after?: number;
  extras_error?: string;
  chest_id?: string;
  chest_opened?: boolean;
  reward_kind?: 'fragment' | 'complete' | 'spark';
  fragment?: string | null;
  fragment_index?: number;
  word?: string;
  fragments_unlocked?: number;
  word_complete?: boolean;
  final_reward_claimed?: boolean;
  error?: string;
}

export interface RewardPreview {
  xp_gained: number;
  coins_gained: number;
  attribute: AttributeKey;
  attribute_gained: number;
  error?: string;
}

export interface ChestOpenResult {
  chest_id: string;
  chest_opened: boolean;
  reward_kind: 'fragment' | 'complete' | 'spark';
  fragment: string | null;
  fragment_index: number;
  word: string;
  fragments_unlocked: number;
  word_complete: boolean;
  final_reward_claimed: boolean;
  final_reward?: {
    name: string;
    rarity: ItemRarity;
    description: string;
    appearance_key: string | null;
  } | null;
  error?: string;
}

export interface RelicProgress {
  user_id: string;
  relic_id: string;
  fragments_unlocked: number;
  final_reward_claimed: boolean;
  relic?: {
    word: string;
    name: string;
    description: string;
  };
}

export interface RewardChest {
  id: string;
  user_id: string;
  quest_id: string;
  relic_id: string | null;
  fragment_index: number;
  reward_kind: 'fragment' | 'complete' | 'spark';
  reward_payload: { fragment?: string | null; position?: number; word?: string };
  opened_at: string | null;
  created_at: string;
}

export interface SpendAttributeResult {
  attribute: string;
  new_value: number;
  attribute_points_remaining: number;
  error?: string;
}

export const DIFFICULTY_XP: Record<Difficulty, number> = {
  trivial: 5,
  easy: 10,
  normal: 25,
  hard: 50,
  epic: 100,
};

export const DIFFICULTY_META: Record<Difficulty, { label: string; color: string; icon: string }> = {
  trivial: { label: 'Trivial', color: 'text-neutral-400', icon: '○' },
  easy: { label: 'Easy', color: 'text-success-400', icon: '◇' },
  normal: { label: 'Normal', color: 'text-primary-400', icon: '◆' },
  hard: { label: 'Hard', color: 'text-warning-400', icon: '★' },
  epic: { label: 'Epic', color: 'text-error-400', icon: '✦' },
};

export const QUEST_TYPE_META: Record<QuestType, { label: string; icon: string }> = {
  daily: { label: 'Daily', icon: 'D' },
  weekly: { label: 'Weekly', icon: 'W' },
  one_time: { label: 'One-time', icon: '1' },
  habit: { label: 'Habit', icon: 'H' },
};

export const ATTRIBUTE_META: Record<
  AttributeKey,
  { label: string; short: string; icon: string; description: string }
> = {
  strength: { label: 'Strength', short: 'STR', icon: 'sword', description: 'Physical power and endurance' },
  intelligence: { label: 'Intelligence', short: 'INT', icon: 'brain', description: 'Mental acuity and reasoning' },
  vitality: { label: 'Vitality', short: 'VIT', icon: 'heart', description: 'Health and resilience' },
  dexterity: { label: 'Dexterity', short: 'DEX', icon: 'wind', description: 'Agility and coordination' },
  charisma: { label: 'Charisma', short: 'CHA', icon: 'sparkles', description: 'Social influence and leadership' },
  wisdom: { label: 'Wisdom', short: 'WIS', icon: 'eye', description: 'Insight and judgment' },
};

export const ATTRIBUTE_KEYS: AttributeKey[] = [
  'strength',
  'intelligence',
  'vitality',
  'dexterity',
  'charisma',
  'wisdom',
];

export const CHARACTER_CLASS_META: Record<
  CharacterClass,
  { label: string; description: string; primaryAttribute: AttributeKey; icon: string }
> = {
  warrior: { label: 'Warrior', description: 'A mighty fighter who thrives on physical challenges', primaryAttribute: 'strength', icon: 'shield' },
  mage: { label: 'Mage', description: 'A wise spellcaster who values knowledge and intellect', primaryAttribute: 'intelligence', icon: 'wand' },
  rogue: { label: 'Rogue', description: 'A cunning operative who relies on agility and wit', primaryAttribute: 'dexterity', icon: 'dagger' },
  ranger: { label: 'Ranger', description: 'A nature-bound explorer who values vitality and awareness', primaryAttribute: 'vitality', icon: 'compass' },
  cleric: { label: 'Cleric', description: 'A devoted healer who draws power from wisdom and faith', primaryAttribute: 'wisdom', icon: 'chalice' },
};

export const ALL_TITLES: { title: string; requirement: string; type: 'level' | 'quests'; threshold: number }[] = [
  { title: 'Novice Adventurer', requirement: 'Reach Level 1', type: 'level', threshold: 1 },
  { title: 'Seasoned Explorer', requirement: 'Reach Level 5', type: 'level', threshold: 5 },
  { title: 'Veteran Hero', requirement: 'Reach Level 10', type: 'level', threshold: 10 },
  { title: 'Legendary Champion', requirement: 'Reach Level 20', type: 'level', threshold: 20 },
  { title: 'Mythic Legend', requirement: 'Reach Level 30', type: 'level', threshold: 30 },
  { title: 'Eternal Paragon', requirement: 'Reach Level 50', type: 'level', threshold: 50 },
  { title: 'Quest Conqueror', requirement: 'Complete 100 quests', type: 'quests', threshold: 100 },
  { title: 'Relentless', requirement: 'Complete 500 quests', type: 'quests', threshold: 500 },
  { title: 'Unstoppable Force', requirement: 'Complete 1000 quests', type: 'quests', threshold: 1000 },
];
