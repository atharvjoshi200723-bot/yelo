export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: string;
  status: string;
  city?: string;
  college?: string;
  bio?: string;
  gender?: string;
  interests?: string[];
  location_name?: string;
  phone?: string;
  phone_verified?: boolean;
  email_verified?: boolean;
  date_of_birth?: string;
  created_at: string;
}

export interface SocialPost {
  id: string;
  user_id: string;
  author_id?: string;
  category: string;
  title?: string;
  content: string;
  image_urls?: string[];
  location_name?: string;
  likes_count: number;
  comments_count: number;
  isLiked?: boolean;
  isSaved?: boolean;
  author_name?: string;
  author_avatar?: string;
  author_city?: string;
  created_at: string;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  author_id?: string;
  content: string;
  is_anonymous?: boolean;
  author_name?: string;
  author_avatar?: string;
  created_at: string;
}

export interface RentalListing {
  id: string;
  owner_id: string;
  category_id: string;
  title: string;
  description: string;
  price_per_day: number;
  price_per_week?: number;
  price_per_month?: number;
  deposit?: number;
  negotiable: boolean;
  condition: string;
  image_urls?: string[];
  location_name?: string;
  location_lat?: number;
  location_lng?: number;
  available_from: string;
  available_until?: string;
  status: string;
  views: number;
  category_name?: string;
  category_icon?: string;
  owner_name?: string;
  owner_avatar?: string;
  owner_city?: string;
  created_at: string;
}

export interface RentalRequest {
  id: string;
  listing_id: string;
  requester_id: string;
  owner_id: string;
  message?: string;
  start_date: string;
  end_date: string;
  status: string;
  agreed_price?: number;
  listing_title?: string;
  listing_images?: string[];
  owner_name?: string;
  owner_avatar?: string;
  requester_name?: string;
  requester_avatar?: string;
  created_at: string;
}

export interface BuddyProfile {
  id: string;
  user_id: string;
  buddy_type: 'buddy';
  title: string;
  description: string;
  activities: string[];
  price_per_hour: number;
  negotiable: boolean;
  availability_days: string[];
  availability_times: string;
  location_name?: string;
  location_lat?: number;
  location_lng?: number;
  gender?: string;
  image_urls?: string[];
  avg_rating: number;
  total_reviews: number;
  total_sessions: number;
  status: 'active' | 'paused' | 'removed';
  name?: string;
  avatar_url?: string;
  city?: string;
  college?: string;
  bio?: string;
  date_of_birth?: string;
  created_at: string;
}

export interface BuddyRequest {
  id: string;
  buddy_profile_id: string;
  requester_id: string;
  provider_id: string;
  activity: string;
  message: string | null;
  proposed_date: string;
  proposed_time: string;
  proposed_duration_hours: number;
  proposed_location: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  agreed_price: number | null;
  conversation_id: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  type: string;
  title?: string;
  other_user?: { id: string; name: string; avatar_url?: string };
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  sender_name?: string;
  sender_avatar?: string;
  created_at: string;
}

export interface ForumPost {
  id: string;
  category_id: string;
  user_id: string;
  title: string;
  content: string;
  is_anonymous: boolean;
  upvotes: number;
  comment_count: number;
  is_pinned: boolean;
  author_name?: string;
  author_avatar?: string;
  category_name?: string;
  college_name?: string;
  college_slug?: string;
  isUpvoted?: boolean;
  created_at: string;
}

export interface College {
  id: string;
  name: string;
  slug: string;
  city: string;
  description?: string;
}

export interface ForumCategory {
  id: string;
  college_id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  comment?: string;
  reviewer_name?: string;
  reviewer_avatar?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  [key: string]: T[] | unknown;
}
