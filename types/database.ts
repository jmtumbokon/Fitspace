// FitSpace — Supabase Database types
// Hand-maintained to match schema.sql. Update this file whenever the schema changes.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          style_personas: string[]
          body_type: string | null
          size_top: string | null
          size_bottom: string | null
          size_shoes: string | null
          followers_count: number
          following_count: number
          posts_count: number
          onboarded: boolean
          created_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          style_personas?: string[]
          body_type?: string | null
          size_top?: string | null
          size_bottom?: string | null
          size_shoes?: string | null
          followers_count?: number
          following_count?: number
          posts_count?: number
          onboarded?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          style_personas?: string[]
          body_type?: string | null
          size_top?: string | null
          size_bottom?: string | null
          size_shoes?: string | null
          followers_count?: number
          following_count?: number
          posts_count?: number
          onboarded?: boolean
          created_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          user_id: string
          caption: string | null
          image_url: string
          image_urls: string[]
          event_tags: string[]
          style_tags: string[]
          aesthetic_tags: string[]
          challenge_tag: string | null
          season: string | null
          total_outfit_cost: number | null
          ratings_enabled: boolean
          hidden: boolean
          likes_count: number
          comments_count: number
          saves_count: number
          rating_avg: number | null
          rating_count: number
          search_tsv: unknown // tsvector, maintained by trigger — never set from app code
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          caption?: string | null
          image_url: string
          image_urls?: string[]
          event_tags?: string[]
          style_tags?: string[]
          aesthetic_tags?: string[]
          challenge_tag?: string | null
          season?: string | null
          total_outfit_cost?: number | null
          ratings_enabled?: boolean
          hidden?: boolean
          likes_count?: number
          comments_count?: number
          saves_count?: number
          rating_avg?: number | null
          rating_count?: number
          search_tsv?: unknown
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          caption?: string | null
          image_url?: string
          image_urls?: string[]
          event_tags?: string[]
          style_tags?: string[]
          aesthetic_tags?: string[]
          challenge_tag?: string | null
          season?: string | null
          total_outfit_cost?: number | null
          ratings_enabled?: boolean
          hidden?: boolean
          likes_count?: number
          comments_count?: number
          saves_count?: number
          rating_avg?: number | null
          rating_count?: number
          search_tsv?: unknown
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'posts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      outfit_items: {
        Row: {
          id: string
          post_id: string
          label: string | null
          brand: string | null
          item_name: string | null
          price: number | null
          currency: string
          purchase_url: string | null
          affiliate_url: string | null
          position_x: number | null
          position_y: number | null
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          label?: string | null
          brand?: string | null
          item_name?: string | null
          price?: number | null
          currency?: string
          purchase_url?: string | null
          affiliate_url?: string | null
          position_x?: number | null
          position_y?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          label?: string | null
          brand?: string | null
          item_name?: string | null
          price?: number | null
          currency?: string
          purchase_url?: string | null
          affiliate_url?: string | null
          position_x?: number | null
          position_y?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'outfit_items_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
          }
        ]
      }
      wardrobe_items: {
        Row: {
          id: string
          user_id: string
          label: string | null
          brand: string | null
          item_name: string | null
          purchase_price: number | null
          date_purchased: string | null
          image_url: string | null
          category: string | null
          color_tags: string[]
          times_worn: number
          last_worn_at: string | null
          is_wishlist: boolean
          wishlist_url: string | null
          wishlist_price: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label?: string | null
          brand?: string | null
          item_name?: string | null
          purchase_price?: number | null
          date_purchased?: string | null
          image_url?: string | null
          category?: string | null
          color_tags?: string[]
          times_worn?: number
          last_worn_at?: string | null
          is_wishlist?: boolean
          wishlist_url?: string | null
          wishlist_price?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string | null
          brand?: string | null
          item_name?: string | null
          purchase_price?: number | null
          date_purchased?: string | null
          image_url?: string | null
          category?: string | null
          color_tags?: string[]
          times_worn?: number
          last_worn_at?: string | null
          is_wishlist?: boolean
          wishlist_url?: string | null
          wishlist_price?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'wardrobe_items_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      outfit_logs: {
        Row: {
          id: string
          user_id: string
          date_worn: string
          wardrobe_item_ids: string[]
          post_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date_worn: string
          wardrobe_item_ids?: string[]
          post_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date_worn?: string
          wardrobe_item_ids?: string[]
          post_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'outfit_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'outfit_logs_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
          }
        ]
      }
      follows: {
        Row: {
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'follows_follower_id_fkey'
            columns: ['follower_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'follows_following_id_fkey'
            columns: ['following_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      likes: {
        Row: {
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          post_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          post_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'likes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'likes_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
          }
        ]
      }
      comments: {
        Row: {
          id: string
          user_id: string
          post_id: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          body?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'comments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
          }
        ]
      }
      saves: {
        Row: {
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          post_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          post_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'saves_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'saves_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
          }
        ]
      }
      collections: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_public: boolean
          post_ids: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_public?: boolean
          post_ids?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          is_public?: boolean
          post_ids?: string[]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'collections_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      challenges: {
        Row: {
          id: string
          title: string
          description: string | null
          tag: string
          start_date: string | null
          end_date: string | null
          submission_count: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          tag: string
          start_date?: string | null
          end_date?: string | null
          submission_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          tag?: string
          start_date?: string | null
          end_date?: string | null
          submission_count?: number
          created_at?: string
        }
        Relationships: []
      }
      post_challenges: {
        Row: {
          post_id: string
          challenge_id: string
          created_at: string
        }
        Insert: {
          post_id: string
          challenge_id: string
          created_at?: string
        }
        Update: {
          post_id?: string
          challenge_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'post_challenges_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'post_challenges_challenge_id_fkey'
            columns: ['challenge_id']
            isOneToOne: false
            referencedRelation: 'challenges'
            referencedColumns: ['id']
          }
        ]
      }
      style_battles: {
        Row: {
          id: string
          post_id_a: string
          post_id_b: string
          theme: string | null
          votes_a: number
          votes_b: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          post_id_a: string
          post_id_b: string
          theme?: string | null
          votes_a?: number
          votes_b?: number
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          post_id_a?: string
          post_id_b?: string
          theme?: string | null
          votes_a?: number
          votes_b?: number
          active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'style_battles_post_id_a_fkey'
            columns: ['post_id_a']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'style_battles_post_id_b_fkey'
            columns: ['post_id_b']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
          }
        ]
      }
      battle_votes: {
        Row: {
          user_id: string
          battle_id: string
          voted_for: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          battle_id: string
          voted_for?: string | null
          created_at?: string
        }
        Update: {
          user_id?: string
          battle_id?: string
          voted_for?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'battle_votes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'battle_votes_battle_id_fkey'
            columns: ['battle_id']
            isOneToOne: false
            referencedRelation: 'style_battles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'battle_votes_voted_for_fkey'
            columns: ['voted_for']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
          }
        ]
      }
      ratings: {
        Row: {
          user_id: string
          post_id: string
          creativity: number
          wearability: number
          overall: number
          created_at: string
        }
        Insert: {
          user_id: string
          post_id: string
          creativity: number
          wearability: number
          overall: number
          created_at?: string
        }
        Update: {
          user_id?: string
          post_id?: string
          creativity?: number
          wearability?: number
          overall?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ratings_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ratings_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          actor_id: string
          type: 'like' | 'comment' | 'follow'
          post_id: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          actor_id: string
          type: 'like' | 'comment' | 'follow'
          post_id?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          actor_id?: string
          type?: 'like' | 'comment' | 'follow'
          post_id?: string | null
          read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_actor_id_fkey'
            columns: ['actor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
          }
        ]
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          post_id: string | null
          comment_id: string | null
          reason: string
          resolved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          post_id?: string | null
          comment_id?: string | null
          reason: string
          resolved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          post_id?: string | null
          comment_id?: string | null
          reason?: string
          resolved?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reports_reporter_id_fkey'
            columns: ['reporter_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reports_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reports_comment_id_fkey'
            columns: ['comment_id']
            isOneToOne: false
            referencedRelation: 'comments'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
