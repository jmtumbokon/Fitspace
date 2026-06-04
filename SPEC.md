# FitSpace — Project Specification

## Overview

FitSpace is a fashion-first social platform — an interactive Pinterest meets Beli for outfits. Users share their looks with full item breakdowns, discover what to wear for any event, get AI-powered styling suggestions, and build a personal digital wardrobe. The experience is driven by real people posting real outfits, with AI layered on top to make discovery and styling effortless.

---

## Core Concept

Every post is an outfit. Every outfit is shoppable, searchable, and styleable. The feed is not just for browsing — it actively answers questions like "what do I wear to a rooftop dinner?" or "what goes with these camo cargo shorts?"

Inspiration: Beli (community-driven ratings, taste profiles), Pinterest (visual discovery, collections), with unique utility around real-world wearability.

---

## Tech Stack (Recommended)

- **Frontend**: Next.js 14 (App Router), Tailwind CSS
- **Backend/Auth**: Supabase (PostgreSQL + Row Level Security + Auth)
- **AI Features**: Anthropic Claude API (outfit pairing, style suggestions, gap analysis)
- **Image Storage**: Supabase Storage or Cloudinary
- **Search**: Supabase full-text search (start), Algolia (scale)
- **Deployment**: Vercel

---

## Data Models

### User
```
id, username, display_name, avatar_url, bio, style_personas[], body_type,
size_top, size_bottom, size_shoes, followers_count, following_count,
created_at
```

### Post
```
id, user_id, caption, image_url, event_tags[], style_tags[], aesthetic_tags[],
likes_count, comments_count, saves_count, created_at
```

### OutfitItem
```
id, post_id, label (e.g. "Jacket"), brand, item_name, price, currency,
purchase_url, similar_items_query, position_x, position_y (for pin placement on image)
```

### WardrobeItem
```
id, user_id, label, brand, item_name, purchase_price, date_purchased,
image_url, category, color_tags[], times_worn, last_worn_at
```

### OutfitLog
```
id, user_id, date_worn, wardrobe_item_ids[], post_id (optional), notes
```

### Follow
```
follower_id, following_id, created_at
```

### Like
```
user_id, post_id, created_at
```

### Comment
```
id, user_id, post_id, body, created_at
```

### Save / Collection
```
id, user_id, name, post_ids[], created_at
```

### Challenge
```
id, title, description, tag, start_date, end_date, submission_count
```

---

## Feature Set

### 1. Outfit Posts (Core)
- Upload one or more photos of a full outfit
- Tag individual items directly on the photo (pin-style): brand, item name, price, purchase link
- Add event tags (e.g. picnic, job interview, wedding guest, gym, date night)
- Add aesthetic/style tags (e.g. streetwear, cottagecore, dark academia, minimalist, Y2K)
- Post goes to follower feeds and is indexed for search/discovery

### 2. Social Feed & Interaction
- Home feed: posts from people you follow, chronological or ranked
- Explore feed: trending posts, filtered by tag or aesthetic
- Like, comment, save posts
- Follow users to see their daily outfits
- Share posts externally

### 3. Event Search & Discovery
- Search any event (e.g. "picnic", "black tie", "first day of work") — returns posts tagged with that event
- Filter results by aesthetic, price range, body type of poster, season
- Results are always real posts from real people, not generated looks
- Trending events section on explore page

### 4. "What Goes With?" — AI Pairing
- User describes or selects a piece they own (e.g. "olive camo cargo shorts")
- Claude API returns:
  - Suggested pairings (tops, shoes, accessories) with reasoning
  - A search query that pulls real posts from the database where people wore similar items
  - Budget-friendly alternatives if a suggested item is expensive
- Inspo grid below the suggestion — real posts matching the pairing

### 5. Item Breakdown & Similar Items
- Each post has a tappable item breakdown panel
- Every item shows: brand, name, price, link to buy
- "Find similar" button — triggers AI + search to surface cheaper or different-brand alternatives
- "Dupe finder" — enter a luxury/expensive item, get budget-matching alternatives surfaced from community posts and external links

### 6. My Wardrobe (Virtual Closet)
- Catalog every item you own: photo, brand, price paid, date purchased, category
- Auto-tracks how many times you've worn each piece (via outfit logs)
- Cost-per-wear calculator: purchase price ÷ times worn, shown as a stat on each item
- Wardrobe stats dashboard: most-worn pieces, underused items, total wardrobe value
- Gap analysis: AI reviews your closet and identifies missing versatile pieces based on your style and existing items (e.g. "You have 8 tops but only 2 neutral bottoms — here are the most-worn bottoms by people with your style profile")
- Wishlist: save items you want to buy, with price tracking

### 7. Outfit Calendar
- Daily log: mark what you wore each day (link to wardrobe items)
- Optional: post directly from a calendar entry
- Visual month view showing outfit thumbnails per day
- Streak feature: how many consecutive days you've logged (drives retention)

### 8. Discovery Filters
- Body type / size filter: see outfits posted by people with similar builds
- Budget filter: filter posts where total outfit cost is within a range
- Style / aesthetic filter: filter by aesthetic tags
- Brand filter: see every post featuring a specific brand
- Season filter: spring/summer/fall/winter tagging on posts

### 9. Style Personas & Taste Profiles
- Onboarding: users select 3–5 aesthetic tags that describe their style (streetwear, preppy, minimalist, etc.)
- Profile shows their primary aesthetic
- Taste profile is used to personalize the explore feed and AI pairing suggestions
- Over time, the profile learns from what you like and save

### 10. Collections (Boards)
- Save posts into named collections (e.g. "Summer inspo", "Work fits", "Wedding guest ideas")
- Collections can be public or private
- Similar to Pinterest boards but tied to real, wearable outfits with real prices

### 11. Style Battles
- Two users (or two saved looks) go head-to-head
- Community votes on the better outfit
- Weekly featured battles on explore page
- Optional: themed battles ("best monochrome fit", "best thrifted look")

### 12. Weekly Challenges
- Platform posts a weekly theme (e.g. "Business casual Monday", "All thrifted fit", "One color outfit")
- Users post with the challenge tag
- Top submissions featured on explore page
- Drives weekly posting habit and content creation

### 13. Fit Ratings
- Community rates outfits on a simple scale (like Beli's 1–10)
- Breakdown by category: creativity, wearability, overall vibe
- Shown as aggregate scores on post cards (opt-in by poster)

### 14. AI Outfit Builder
- User inputs: occasion, weather/season, budget, items they already own
- Claude API generates a complete outfit recommendation
- Each suggested piece links to real posts from the community wearing similar items
- Option to save the generated outfit as a collection

---

## Key User Flows

### Posting a fit
1. Open app → tap "+" 
2. Upload photo(s)
3. Tap items in photo to pin tags → fill in brand/name/price/link per item
4. Add caption, event tags, aesthetic tags
5. Post → goes to feed + indexed for search

### Finding what to wear
1. Search bar → type event (e.g. "rooftop party")
2. Filter by budget / body type / aesthetic if desired
3. Browse real posts tagged with that event
4. Tap a post → see full item breakdown → buy, save, or ask "what else goes with this?"

### Using AI pairing
1. Tap "Style me" or "What goes with?" 
2. Describe or pick a piece from your wardrobe
3. AI returns pairing suggestions + reasoning
4. Below: inspo grid of real posts from people who wore similar combos
5. Tap any item → see full breakdown, find similar, add to wishlist

### Building your wardrobe
1. Wardrobe tab → "Add item"
2. Photo + details (brand, price, date bought, category)
3. Each time you wear it, log it (manual or via outfit post)
4. View cost-per-wear, total value, gap analysis over time

---

## Monetization Ideas (Future)
- Affiliate links on every tagged item (commission on purchases)
- Brand partnerships / sponsored posts (clearly labeled)
- Premium features: advanced gap analysis, unlimited collections, AI outfit builder uses
- Brand dashboards: brands can see how their items are being styled organically

---

## Phase Roadmap

| Phase | Focus | Key Features |
|-------|-------|-------------|
| 1 — MVP | Social core | Post outfit, item tags, feed, likes/comments/follow |
| 2 — Discovery | Search & AI | Event search, "what goes with?", similar items, dupe finder |
| 3 — Wardrobe | Utility | Virtual closet, outfit calendar, cost-per-wear, gap analysis |
| 4 — Engagement | Gamification | Style battles, weekly challenges, fit ratings, streaks |
| 5 — Scale | Monetization | Affiliate links, brand tools, premium tier |
