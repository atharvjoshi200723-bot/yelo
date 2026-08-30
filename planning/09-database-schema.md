# Database Schema Design

## Overview
PostgreSQL with PostGIS extension for geospatial queries. UUID primary keys, timestamps, soft deletes where appropriate.

## Enumerations

### user_status
`active` | `suspended` | `banned`

### listing_status
`active` | `rented` | `paused` | `removed`

### request_status
`pending` | `accepted` | `rejected` | `cancelled`

### rental_status
`pending` | `active` | `completed` | `cancelled` | `disputed`

### buddy_status
`active` | `paused` | `removed`

### buddy_request_status
`pending` | `accepted` | `rejected` | `cancelled` | `completed`

### conversation_type
`rental` | `buddy` | `general`

### post_category
`general` | `rent` | `buddy` | `college` | `event` | `question` | `discussion`

### report_type
`user` | `listing` | `post` | `forum_post` | `buddy_profile` | `message`

### report_status
`pending` | `reviewing` | `resolved` | `dismissed`

### notification_type
`rental_request` | `rental_accepted` | `rental_completed` | `buddy_request` | `buddy_accepted` | `buddy_completed` | `message` | `forum_reply` | `post_comment` | `review` | `system`

### transaction_status
`pending` | `confirmed` | `completed` | `refunded` | `cancelled`

### commission_type
`percentage` | `fixed`

---

## Tables

### users
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| email | varchar(255) unique | |
| password_hash | varchar(255) | bcrypt |
| phone | varchar(20) | nullable |
| phone_verified | boolean | default false |
| email_verified | boolean | default false |
| status | user_status | default active |
| role | varchar(20) | 'user' or 'admin' |
| date_of_birth | date | |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | |
| deleted_at | timestamptz | soft delete |

### profiles
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK→users | unique |
| name | varchar(100) | |
| avatar_url | text | |
| bio | text | |
| gender | varchar(20) | 'male','female','other','prefer_not_to_say' |
| city | varchar(100) | default 'Dehradun' |
| college | varchar(200) | nullable |
| college_verified | boolean | default false |
| date_of_birth | date | |
| interests | text[] | |
| location_lat | decimal(9,6) | |
| location_lng | decimal(9,6) | |
| location_name | varchar(255) | "Rajpur Road area" etc |
| location_point | geometry(Point, 4326) | PostGIS |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Index:** GIST on location_point for spatial queries

### colleges
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | varchar(200) | |
| slug | varchar(200) unique | |
| city | varchar(100) | default 'Dehradun' |
| description | text | |
| created_at | timestamptz | |

### forum_categories
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| college_id | uuid FK→colleges | |
| name | varchar(100) | |
| slug | varchar(100) | |
| description | text | |
| sort_order | integer | default 0 |
| created_at | timestamptz | |

### forum_posts
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| category_id | uuid FK→forum_categories | |
| user_id | uuid FK→users | |
| title | varchar(300) | |
| content | text | |
| is_anonymous | boolean | default false |
| upvotes | integer | default 0 |
| comment_count | integer | default 0 |
| is_pinned | boolean | default false |
| status | varchar(20) | 'active','hidden','removed' |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### forum_comments
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| post_id | uuid FK→forum_posts | |
| user_id | uuid FK→users | |
| content | text | |
| is_anonymous | boolean | default false |
| parent_id | uuid FK→forum_comments | nullable, for threading |
| created_at | timestamptz | |

### forum_upvotes
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| post_id | uuid FK→forum_posts | |
| user_id | uuid FK→users | |
| created_at | timestamptz | |

### social_posts
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK→users | |
| category | post_category | |
| title | varchar(300) | nullable |
| content | text | |
| image_urls | text[] | |
| location_lat | decimal(9,6) | |
| location_lng | decimal(9,6) | |
| location_name | varchar(255) | |
| likes_count | integer | default 0 |
| comments_count | integer | default 0 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### social_comments
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| post_id | uuid FK→social_posts | |
| user_id | uuid FK→users | |
| content | text | |
| created_at | timestamptz | |

### social_likes
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| post_id | uuid FK→social_posts | |
| user_id | uuid FK→users | |
| created_at | timestamptz | |

### social_saves
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| post_id | uuid FK→social_posts | |
| user_id | uuid FK→users | |
| created_at | timestamptz | |

### rental_categories
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| parent_id | uuid FK→rental_categories | nullable |
| name | varchar(100) | |
| slug | varchar(100) unique | |
| icon | varchar(50) | |
| sort_order | integer | default 0 |

### rental_listings
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| owner_id | uuid FK→users | |
| category_id | uuid FK→rental_categories | |
| title | varchar(200) | |
| description | text | |
| price_per_day | decimal(10,2) | |
| price_per_week | decimal(10,2) | nullable |
| price_per_month | decimal(10,2) | nullable |
| deposit | decimal(10,2) | nullable |
| negotiable | boolean | default true |
| condition | varchar(50) | 'new','like_new','good','fair' |
| image_urls | text[] | |
| location_lat | decimal(9,6) | |
| location_lng | decimal(9,6) | |
| location_point | geometry(Point, 4326) | PostGIS |
| location_name | varchar(255) | "Near Graphic Era" |
| available_from | date | |
| available_until | date | nullable |
| status | listing_status | default active |
| views | integer | default 0 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Indexes:** GIST on location_point, B-tree on owner_id, category_id, status

### rental_requests
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| listing_id | uuid FK→rental_listings | |
| requester_id | uuid FK→users | |
| owner_id | uuid FK→users | |
| message | text | |
| start_date | date | |
| end_date | date | |
| status | request_status | default pending |
| agreed_price | decimal(10,2) | nullable, set on agreement |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### rentals
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| request_id | uuid FK→rental_requests | |
| listing_id | uuid FK→rental_listings | |
| renter_id | uuid FK→users | |
| owner_id | uuid FK→users | |
| agreed_price | decimal(10,2) | |
| status | rental_status | |
| start_date | date | |
| end_date | date | |
| completed_at | timestamptz | nullable |
| created_at | timestamptz | |

### buddy_profiles
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK→users unique | |
| title | varchar(200) | "Coffee & Movies Companion" |
| description | text | |
| activities | text[] | ['coffee','movies','walking'] |
| price_per_hour | decimal(10,2) | |
| negotiable | boolean | default true |
| availability_days | text[] | ['monday','saturday'] |
| availability_times | varchar(50) | 'morning','afternoon','evening','night' |
| location_lat | decimal(9,6) | |
| location_lng | decimal(9,6) | |
| location_point | geometry(Point, 4326) | |
| location_name | varchar(255) | |
| gender | varchar(20) | |
| min_age_preference | integer | default 18 |
| max_age_preference | integer | nullable |
| image_urls | text[] | |
| avg_rating | decimal(3,2) | default 0 |
| total_reviews | integer | default 0 |
| total_sessions | integer | default 0 |
| status | buddy_status | default active |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### buddy_requests
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| buddy_profile_id | uuid FK→buddy_profiles | |
| requester_id | uuid FK→users | |
| provider_id | uuid FK→users | |
| activity | varchar(100) | |
| message | text | |
| proposed_date | date | |
| proposed_time | time | |
| proposed_duration_hours | decimal(4,1) | |
| proposed_location | varchar(255) | |
| status | request_status | |
| agreed_price | decimal(10,2) | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### buddy_sessions
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| request_id | uuid FK→buddy_requests | |
| buddy_profile_id | uuid FK→buddy_profiles | |
| requester_id | uuid FK→users | |
| provider_id | uuid FK→users | |
| activity | varchar(100) | |
| scheduled_date | date | |
| scheduled_time | time | |
| duration_hours | decimal(4,1) | |
| agreed_price | decimal(10,2) | |
| status | buddy_request_status | |
| completed_at | timestamptz | nullable |
| created_at | timestamptz | |

### conversations
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| type | conversation_type | |
| title | varchar(200) | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### conversation_members
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| conversation_id | uuid FK→conversations | |
| user_id | uuid FK→users | |
| last_read_at | timestamptz | |

### messages
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| conversation_id | uuid FK→conversations | |
| sender_id | uuid FK→users | |
| content | text | |
| is_read | boolean | default false |
| created_at | timestamptz | |

### reviews
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| reviewer_id | uuid FK→users | |
| reviewee_id | uuid FK→users | |
| rental_id | uuid FK→rentals | nullable |
| buddy_session_id | uuid FK→buddy_sessions | nullable |
| rating | integer | 1-5 |
| comment | text | |
| created_at | timestamptz | |

### reports
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| reporter_id | uuid FK→users | |
| report_type | report_type | |
| target_id | uuid | polymorphic reference |
| reason | varchar(50) | |
| description | text | |
| status | report_status | default pending |
| admin_notes | text | |
| created_at | timestamptz | |
| resolved_at | timestamptz | nullable |

### blocks
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| blocker_id | uuid FK→users | |
| blocked_id | uuid FK→users | |
| created_at | timestamptz | |

### notifications
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK→users | |
| type | notification_type | |
| title | varchar(255) | |
| message | text | |
| data | jsonb | nullable, extra context |
| is_read | boolean | default false |
| created_at | timestamptz | |

### transactions
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| rental_id | uuid FK→rentals | nullable |
| buddy_session_id | uuid FK→buddy_sessions | nullable |
| payer_id | uuid FK→users | |
| payee_id | uuid FK→users | |
| amount | decimal(10,2) | |
| commission_amount | decimal(10,2) | |
| platform_fee | decimal(10,2) | |
| status | transaction_status | |
| created_at | timestamptz | |

### commission_config
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| type | commission_type | percentage or fixed |
| value | decimal(10,2) | e.g. 10 for 10% or ₹10 |
| min_amount | decimal(10,2) | nullable |
| max_amount | decimal(10,2) | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## Spatial Indexes
- profiles: GIST on location_point
- rental_listings: GIST on location_point
- buddy_profiles: GIST on location_point

## Query Patterns
- Find listings within radius: `ST_DWithin(location_point, ST_MakePoint(:lng, :lat)::geography, :radius_meters)`
- Find buddies within radius: same
- Feed ranking: order by created_at DESC with category and college weighting

## Seed Data
- Colleges: Graphic Era Hill, Graphic Era Deemed, UPES, DIT University, DAV
- Rental categories: Electronics, Cameras, Bikes, Books, Sports, Musical Instruments, Furniture, Clothing, Gaming, Event Equipment, Other
- Commission config: 10% percentage type
