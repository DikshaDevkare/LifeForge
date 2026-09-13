# LifeForge AI

LifeForge is a gamified life-management app built with React, TypeScript, Tailwind, and Supabase.

## Included systems

- Existing authentication, character classes, attributes, XP, coins, streaks, levels, and titles
- Quest CRUD with ownership-scoped access
- Quest lifecycle: ready → started → focused → completed/abandoned
- Focus mode with an in-app timer
- Transactional server-side reward calculation
- XP, coins, category-mapped attribute rewards, streaks, history, titles, and achievements
- Server-confirmed XP, coin, attribute, streak, achievement, and level-up feedback
- Atomic coin shop with trusted prices, purchase history, inventory, and equipment slots
- Persistent cosmetic loadout shown on the character sheet
- Reduced-motion support, responsive navigation, loading/empty/error states, and accessible focus treatment
- Supabase RLS and column/function privileges
- Idempotent completion protection for refreshes, double-clicks, replayed requests, and concurrent requests
- Completion confirmation with a server-calculated reward preview
- Animated reward journey with character movement, XP/gold/attribute collection, and skippable reduced-motion-friendly scenes
- Persistent Daily Relic (`FORGE`) fragments and idempotent mystery chests
- Legendary `Forge Mark` inventory reward after the relic is completed

## Run locally

1. Copy `.env.example` to `.env`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Apply the migrations in `supabase/migrations/` to the Supabase project.
4. Run `npm install`.
5. Run `npm run dev`.

Useful checks:

```bash
npm run typecheck
npm run build
npm run lint
```

The browser only calls the server-side completion wrapper with `p_quest_id`. It does not submit XP, coins, attributes, streaks, or achievement values.
Shop purchases use `purchase_shop_item(p_item_id)` and never accept a client-supplied price.

The completion journey calls `complete_quest_with_extras(p_quest_id)`. That wrapper invokes the existing
authoritative `complete_quest` transaction, then creates an idempotent reward chest and advances the
persistent relic. `open_reward_chest(p_chest_id)` marks the chest opened and grants the final inventory
reward exactly once. Apply `20260912110000_add_relics_and_reward_journey.sql` after the existing migrations.