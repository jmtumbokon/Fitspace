export type StylePersona =
  | 'streetwear' | 'minimalist' | 'cottagecore' | 'dark academia'
  | 'preppy' | 'Y2K' | 'vintage' | 'athleisure' | 'boho' | 'old money'
  | 'grunge' | 'techwear' | 'business casual' | 'maximalist' | 'coastal'

export type BodyType = 'petite' | 'tall' | 'plus size' | 'athletic' | 'curvy' | 'straight'

export type Season = 'spring' | 'summer' | 'fall' | 'winter'

export type WardrobeCategory =
  | 'tops' | 'bottoms' | 'shoes' | 'outerwear' | 'accessories' | 'dresses' | 'activewear'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  style_personas: StylePersona[]
  body_type: BodyType | null
  size_top: string | null
  size_bottom: string | null
  size_shoes: string | null
  followers_count: number
  following_count: number
  posts_count: number
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  caption: string | null
  image_url: string
  image_urls: string[]
  event_tags: string[]
  style_tags: string[]
  aesthetic_tags: string[]
  season: Season | null
  total_outfit_cost: number | null
  likes_count: number
  comments_count: number
  saves_count: number
  rating_avg: number | null
  rating_count: number
  created_at: string
  // Joined fields
  profile?: Profile
  outfit_items?: OutfitItem[]
  is_liked?: boolean
  is_saved?: boolean
}

export interface OutfitItem {
  id: string
  post_id: string
  label: string | null
  brand: string | null
  item_name: string | null
  price: number | null
  currency: string
  purchase_url: string | null
  position_x: number | null
  position_y: number | null
  created_at: string
}

export interface WardrobeItem {
  id: string
  user_id: string
  label: string | null
  brand: string | null
  item_name: string | null
  purchase_price: number | null
  date_purchased: string | null
  image_url: string | null
  category: WardrobeCategory | null
  color_tags: string[]
  times_worn: number
  last_worn_at: string | null
  is_wishlist: boolean
  wishlist_url: string | null
  wishlist_price: number | null
  created_at: string
  // Computed
  cost_per_wear?: number | null
}

export interface OutfitLog {
  id: string
  user_id: string
  date_worn: string
  wardrobe_item_ids: string[]
  post_id: string | null
  notes: string | null
  created_at: string
  // Joined
  wardrobe_items?: WardrobeItem[]
  post?: Post | null
}

export interface Follow {
  follower_id: string
  following_id: string
  created_at: string
}

export interface Like {
  user_id: string
  post_id: string
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  post_id: string
  body: string
  created_at: string
  // Joined
  profile?: Profile
}

export interface Collection {
  id: string
  user_id: string
  name: string
  description: string | null
  is_public: boolean
  post_ids: string[]
  created_at: string
  // Joined
  posts?: Post[]
}

export interface Challenge {
  id: string
  title: string
  description: string | null
  tag: string
  start_date: string | null
  end_date: string | null
  submission_count: number
  created_at: string
}

export interface StyleBattle {
  id: string
  post_id_a: string
  post_id_b: string
  theme: string | null
  votes_a: number
  votes_b: number
  active: boolean
  created_at: string
  // Joined
  post_a?: Post
  post_b?: Post
  user_vote?: string | null
}

export interface Rating {
  user_id: string
  post_id: string
  creativity: number
  wearability: number
  overall: number
  created_at: string
}

// ─────────────────────────────────────────
// AI Feature Types
// ─────────────────────────────────────────

export interface StylePairing {
  item_type: string
  description: string
  reasoning: string
  search_terms: string[]
}

export interface StyleMeResponse {
  pairings: StylePairing[]
  styling_tip: string
}

export interface DupeSuggestion {
  name: string
  brand: string
  estimated_price: number
  why_its_a_dupe: string
  search_terms: string[]
}

export interface OutfitBuilderPiece {
  category: WardrobeCategory
  description: string
  estimated_price: number
  reasoning: string
}

export interface OutfitBuilderResponse {
  pieces: OutfitBuilderPiece[]
  total_cost: number
  styling_note: string
}

export interface GapAnalysisResult {
  gap_category: WardrobeCategory
  title: string
  explanation: string
  what_to_look_for: string
  search_terms: string[]
}
