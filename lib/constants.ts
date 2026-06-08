import type { BodyType, Season, StylePersona, WardrobeCategory } from '@/types'

export const STYLE_PERSONAS: StylePersona[] = [
  'streetwear', 'minimalist', 'cottagecore', 'dark academia',
  'preppy', 'Y2K', 'vintage', 'athleisure', 'boho', 'old money',
  'grunge', 'techwear', 'business casual', 'maximalist', 'coastal',
]

export const BODY_TYPES: BodyType[] = [
  'petite', 'tall', 'plus size', 'athletic', 'curvy', 'straight',
]

export const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter']

export const WARDROBE_CATEGORIES: WardrobeCategory[] = [
  'tops', 'bottoms', 'shoes', 'outerwear', 'accessories', 'dresses', 'activewear',
]

export const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/

// Storage buckets — RLS requires upload paths shaped like {auth.uid()}/...
export const OUTFITS_BUCKET = 'outfits'
export const AVATARS_BUCKET = 'avatars'

export const MAX_POST_IMAGES = 4
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024 // 5MB
