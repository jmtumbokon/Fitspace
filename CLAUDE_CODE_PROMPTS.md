# FitSpace — Claude Code Prompts Guide

This file contains ready-to-use prompts for building each feature in Claude Code.
Copy and paste each prompt directly. Always start a new session by referencing SPEC.md and schema.sql.

---

## How to Start Every Session

Open Claude Code and begin with:

```
I'm building FitSpace, a fashion social platform. Read SPEC.md and schema.sql for full context.
My stack is Next.js 14 (App Router), Supabase, Tailwind CSS.
Today I want to work on: [paste the task below]
```

---

## Phase 1 — MVP

### 1.1 Project Setup
```
Set up a new Next.js 14 project with:
- Tailwind CSS
- Supabase JS client configured with env vars (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
- A /lib/supabase.ts client helper
- A basic folder structure: /app, /components, /lib, /types
- TypeScript types file at /types/index.ts that matches our schema.sql tables
```

### 1.2 Auth
```
Build auth for FitSpace:
- Sign up page at /signup: email, password, username
- Log in page at /login: email, password
- On signup, create a profile row in the profiles table
- Redirect to /feed after login
- Auth state managed via Supabase Auth helpers for Next.js
- A useUser() hook that returns the current user's profile
```

### 1.3 Feed Page
```
Build the home feed page at /feed:
- Two-column masonry grid of outfit post cards
- Each card shows: outfit photo, poster avatar + username, event tags as pills, likes count, comments count
- Fetch posts from Supabase ordered by created_at desc, paginated (20 per page)
- Infinite scroll or "load more" button
- Tapping a card opens the post detail page
```

### 1.4 Post Creation
```
Build the post creation flow at /new:
- Step 1: Upload photo (single image, preview shown)
- Step 2: Tap items on the photo to pin tags. Each pin opens a drawer to fill in: label, brand, item name, price, purchase URL
- Step 3: Add caption, select event tags (multi-select from a preset list), style tags, aesthetic tags
- Step 4: Review and publish
- On publish: insert to posts table, insert all outfit_items, redirect to the new post's page
```

### 1.5 Post Detail Page
```
Build the post detail page at /post/[id]:
- Full-width outfit photo with interactive item pins (tap to see item details)
- Item breakdown panel below photo: list of all tagged items with brand, name, price, buy link
- Poster info with follow button
- Like button (toggles, updates likes_count)
- Comments section: list of comments, add comment form
- Save to collection button
- Share button
```

### 1.6 User Profile Page
```
Build the user profile page at /profile/[username]:
- Header: avatar, display name, username, bio, style personas, follower/following counts
- Follow / Unfollow button
- Grid of their posts (same card style as feed)
- Tab for their public collections
```

---

## Phase 2 — Discovery & AI

### 2.1 Search & Event Discovery
```
Build the search/discover page at /explore:
- Search bar at top: searches post captions, event_tags, style_tags using Supabase full-text search
- Below search: "Trending events" — show top 8 most-used event_tags as clickable pills
- Results grid: same post cards as feed
- Filter sidebar/drawer: filter by aesthetic_tags, season, price range (total_outfit_cost)
- Tapping an event tag pill searches for that tag automatically
```

### 2.2 "What Goes With?" AI Feature
```
Build the AI pairing feature at /style-me:
- Text input: "Describe a piece you own" (e.g. "olive green camo cargo shorts, baggy fit")
- Optional: pick from wardrobe items if the user has them saved
- On submit, call the Claude API with a prompt that asks for:
  1. 3-5 pairing suggestions (item type, description, why it works)
  2. A list of search terms to query our posts database for real inspo
- Display the AI pairing suggestions as cards
- Below: fetch and show real posts from our database matching the search terms
- Each suggestion card has a "Find similar posts" button
The Claude API call should use this system prompt:
"You are a fashion styling assistant. Given a clothing item description, suggest complementary pieces and return a JSON object with: { pairings: [{item_type, description, reasoning, search_terms}] }"
```

### 2.3 Dupe Finder
```
Build the dupe finder feature at /dupe-finder:
- Input: item name or paste a product URL
- Claude API call: given the item description, suggest 3 budget alternatives with reasoning
- Return format: JSON array of { name, brand, estimated_price, why_its_a_dupe, search_terms }
- Show results as cards
- Below each result: fetch real posts from our DB where people tagged similar items
```

### 2.4 AI Outfit Builder
```
Build the AI outfit builder at /outfit-builder:
- Form inputs: occasion (text), season (dropdown), budget (range slider), owned items (optional multi-select from wardrobe)
- On submit: Claude API call asking for a complete outfit (top, bottom, shoes, optional accessories)
- Return format: JSON with { pieces: [{category, description, estimated_price, reasoning}], total_cost, styling_note }
- Display the generated outfit as a visual card
- Below: real post inspo from our DB for each piece
- "Save as collection" button to store the generated outfit
```

---

## Phase 3 — Wardrobe

### 3.1 Virtual Closet
```
Build the wardrobe section at /wardrobe:
- Grid view of all wardrobe items, filterable by category (tabs: All, Tops, Bottoms, Shoes, Outerwear, Accessories)
- Each item card shows: photo, brand, item name, times worn, cost-per-wear
- "Add item" button opens a form: photo upload, label, brand, item name, price, date purchased, category, color tags
- Item detail drawer: shows all info + cost-per-wear calc + wear history
- Wishlist tab: items where is_wishlist = true
- Stats card at top: total items, total value, most worn piece, average cost-per-wear
```

### 3.2 Outfit Calendar
```
Build the outfit calendar at /calendar:
- Month view grid
- Each day shows a small outfit thumbnail if an outfit_log exists for that day
- Click a day to log or edit that day's outfit:
  - Multi-select from wardrobe items
  - Optional: link to a post
  - Notes field
- When logging, increment times_worn and update last_worn_at on each selected wardrobe item
- Streak counter: show current consecutive days logged
```

### 3.3 Gap Analysis (AI)
```
Build the gap analysis feature at /wardrobe/gaps:
- Fetch the user's full wardrobe from Supabase
- Build a summary: count by category, list of colors, price range
- Send to Claude API with prompt: "Given this wardrobe summary, identify the top 3 gaps or missing versatile pieces based on common styling rules. For each gap, explain why it's missing and suggest what to look for."
- Display results as insight cards
- Below each gap: fetch real posts from our DB showing people wearing that type of piece
- "Add to wishlist" button on each suggestion
```

---

## Phase 4 — Engagement

### 4.1 Style Battles
```
Build style battles at /battles:
- Active battles list: show pairs of outfit photos side by side, vote button under each
- Voting: insert into battle_votes, increment votes_a or votes_b, disable vote after voting
- Results: show vote percentages as a bar after voting
- "Create battle" flow: pick two posts (yours or suggest a community one), add optional theme
- Weekly featured battle highlighted at top
```

### 4.2 Weekly Challenges
```
Build weekly challenges at /challenges:
- Active challenge banner on explore page and home feed
- Challenge detail page: title, description, deadline, submission count
- Participating: when creating a post, show active challenges — checking one adds the challenge tag
- Challenge feed: all posts with that challenge's tag, sorted by likes
- Past challenges archive
```

### 4.3 Fit Ratings
```
Add fit ratings to post detail pages:
- Optional for each post (poster opts in during creation)
- Rating panel: three sliders (Creativity, Wearability, Overall) each 1-10
- On submit: insert into ratings table, trigger to update rating_avg on post
- Show aggregate scores as bar charts on post cards when rating_count > 5
```

---

## Reusable Components to Build Early

### PostCard
```
Build a reusable PostCard component at /components/PostCard.tsx:
- Props: post object (with user profile joined), showRating (boolean)
- Shows: outfit photo, user avatar + name, event tag pills, likes count, rating if enabled
- Clicking navigates to /post/[id]
- Clicking the user navigates to /profile/[username]
```

### ItemBreakdownPanel
```
Build a reusable ItemBreakdownPanel at /components/ItemBreakdownPanel.tsx:
- Props: outfitItems array, postId
- Renders a list of items with brand, name, price, buy link
- "Find similar" button on each item triggers a sendPrompt to the style-me page with that item pre-filled
```

### AvatarWithFollow
```
Build a reusable AvatarWithFollow component:
- Shows user avatar, display name, username
- Follow button: if not following → follow; if following → unfollow
- Updates follows table and refreshes local state
```

---

## Environment Variables Needed

Create a .env.local file:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Note: ANTHROPIC_API_KEY must only be used server-side (API routes or Server Actions) — never expose it to the client.

---

## Useful Claude Code Tips for This Project

- When Claude Code gets stuck on a complex query, tell it: "Write the Supabase query with a join to profiles so we get the user data in one call"
- For the AI features, always route through a Next.js API route (`/app/api/...`) so the Anthropic key stays server-side
- Ask Claude Code to "add a loading skeleton" to any page that fetches data
- When building forms, ask for "optimistic UI" so the like/follow actions feel instant
- Use: "Make sure RLS policies allow this query" whenever a Supabase fetch returns empty unexpectedly
