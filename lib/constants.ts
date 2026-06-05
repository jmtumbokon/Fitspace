import type { BodyType, Season, StylePersona } from '@/types'

export const STYLE_PERSONAS: StylePersona[] = [
  'streetwear', 'minimalist', 'cottagecore', 'dark academia',
  'preppy', 'Y2K', 'vintage', 'athleisure', 'boho', 'old money',
  'grunge', 'techwear', 'business casual', 'maximalist', 'coastal',
]

export const BODY_TYPES: BodyType[] = [
  'petite', 'tall', 'plus size', 'athletic', 'curvy', 'straight',
]

export const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter']

export const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/

export const OUTFIT_PHOTOS_BUCKET = 'outfit-photos'

export const MAX_POST_IMAGES = 4
