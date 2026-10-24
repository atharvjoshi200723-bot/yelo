#!/usr/bin/env tsx
/**
 * YELO — Master QA API Test
 * Tests every backend endpoint with USER_A, USER_B, and ADMIN.
 * Must be run with the backend already running on port 3001.
 */

const BASE = 'http://localhost:3001/api';

let passed = 0;
let failed = 0;
const failures: string[] = [];

function report(name: string, ok: boolean, detail?: string) {
  if (ok) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    const msg = detail ? `${name} — ${detail}` : name;
    failures.push(msg);
    console.log(`  ❌ ${name} — ${detail || 'FAILED'}`);
  }
}

async function api(method: string, path: string, token?: string, body?: unknown) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

// Store test data
let tokenA = '', tokenB = '', tokenAdmin = '';
let userIdA = '', userIdB = '', userIdAdmin = '';
let postId = '', commentId = '';
let listingId = '', rentalRequestId = '';
let buddyProfileId = '', buddyRequestId = '';
let conversationId = '';
let forumCategoryId = '', forumPostId = '', forumCommentId = '';
let collegeSlug = '';
let reportId = '';

async function run() {
  console.log('\n🧪 YELO MASTER QA TEST\n');

  // ============================================================
  // SECTION 1: AUTHENTICATION
  // ============================================================
  console.log('━━━ 1. AUTHENTICATION ━━━');

  // 1a. Register User A
  {
    const { status, json } = await api('POST', '/auth/register', undefined, {
      email: 'qa-a@yelo.dev', password: 'QA@Test1234', name: 'QA User A',
      dateOfBirth: '1999-06-15', gender: 'male', city: 'Dehradun', college: 'Graphic Era',
    });
    report('Register USER_A', status === 201, `status=${status}`);
    tokenA = json?.accessToken || '';
    userIdA = json?.user?.id || '';
  }

  // 1b. Register User B
  {
    const { status, json } = await api('POST', '/auth/register', undefined, {
      email: 'qa-b@yelo.dev', password: 'QA@Test1234', name: 'QA User B',
      dateOfBirth: '1998-03-20', gender: 'female', city: 'Dehradun', college: 'UPES',
    });
    report('Register USER_B', status === 201, `status=${status}`);
    tokenB = json?.accessToken || '';
    userIdB = json?.user?.id || '';
  }

  // 1c. Register Admin
  {
    const { status, json } = await api('POST', '/auth/register', undefined, {
      email: 'qa-admin@yelo.dev', password: 'QA@Test1234', name: 'QA Admin',
      dateOfBirth: '1995-01-10', gender: 'male', city: 'Dehradun', college: 'DAV',
    });
    report('Register ADMIN', status === 201, `status=${status}`);
    tokenAdmin = json?.accessToken || '';
    userIdAdmin = json?.user?.id || '';
  }

  // 1d. Promote admin
  {
    const { Pool } = await import('pg');
    const pool = new Pool({ host: 'localhost', database: 'yelo', user: 'postgres' });
    await pool.query("UPDATE users SET role = 'admin' WHERE email = 'qa-admin@yelo.dev'");
    // Re-login to get new token with admin role
    const { status, json } = await api('POST', '/auth/login', undefined, {
      email: 'qa-admin@yelo.dev', password: 'QA@Test1234',
    });
    tokenAdmin = json?.accessToken || '';
    report('Promote ADMIN', status === 200, `status=${status}`);
    await pool.end();
  }

  // 1e. Duplicate email
  {
    const { status } = await api('POST', '/auth/register', undefined, {
      email: 'qa-a@yelo.dev', password: 'QA@Test1234', name: 'Dup', dateOfBirth: '2000-01-01',
    });
    report('Duplicate email rejected', status === 409, `status=${status}`);
  }

  // 1f. Wrong password
  {
    const { status } = await api('POST', '/auth/login', undefined, {
      email: 'qa-a@yelo.dev', password: 'wrong',
    });
    report('Wrong password rejected', status === 401, `status=${status}`);
  }

  // 1g. Unknown account
  {
    const { status } = await api('POST', '/auth/login', undefined, {
      email: 'nobody@yelo.dev', password: 'QA@Test1234',
    });
    report('Unknown account rejected', status === 401, `status=${status}`);
  }

  // 1h. Get me
  {
    const { status, json } = await api('GET', '/auth/me', tokenA);
    report('GET /auth/me', status === 200 && json?.user?.id === userIdA, `status=${status}`);
  }

  // 1i. No token
  {
    const { status } = await api('GET', '/auth/me');
    report('Unauthenticated rejected', status === 401, `status=${status}`);
  }

  // 1j. Login
  {
    const { status } = await api('POST', '/auth/login', undefined, {
      email: 'qa-a@yelo.dev', password: 'QA@Test1234',
    });
    report('Login USER_A', status === 200, `status=${status}`);
  }

  // ============================================================
  // SECTION 2: PROFILE
  // ============================================================
  console.log('\n━━━ 2. PROFILE ━━━');

  // 2a. Get profile
  {
    const { status, json } = await api('GET', '/users/me', tokenA);
    report('GET /users/me', status === 200 && json?.profile, `status=${status}`);
  }

  // 2b. Update profile
  {
    const { status, json } = await api('PUT', '/users/me', tokenA, {
      bio: 'QA testing account', city: 'Dehradun',
    });
    report('PUT /users/me', status === 200 && json?.profile?.bio === 'QA testing account', `status=${status}`);
  }

  // 2c. Public profile
  {
    const { status, json } = await api('GET', `/users/${userIdB}`, tokenA);
    report('GET /users/:userId (public)', status === 200 && json?.profile?.name === 'QA User B', `status=${status}`);
  }

  // 2d. Profile does not leak sensitive data
  {
    const { json } = await api('GET', `/users/${userIdB}`, tokenA);
    const p = json?.profile || {};
    report('No email in public profile', !p.email, `email=${p.email}`);
    report('No phone in public profile', !p.phone, `phone=${p.phone}`);
    report('No date_of_birth in public profile', !p.date_of_birth, `dob=${p.date_of_birth}`);
  }

  // ============================================================
  // SECTION 3: FEED / POSTS
  // ============================================================
  console.log('\n━━━ 3. FEED / POSTS ━━━');

  // 3a. Create post
  {
    const { status, json } = await api('POST', '/feed', tokenA, {
      category: 'general', content: 'Anyone want to grab coffee at Blue Tokai this evening? ☕',
    });
    report('Create post', status === 201, `status=${status}`);
    postId = json?.post?.id || '';
  }

  // 3b. Get feed
  {
    const { status, json } = await api('GET', '/feed', tokenB);
    report('GET /feed', status === 200 && Array.isArray(json?.posts), `status=${status}`);
  }

  // 3c. Filter by category
  {
    const { status, json } = await api('GET', '/feed?category=general', tokenA);
    report('Feed filter by category', status === 200, `status=${status}`);
  }

  // 3d. Sort popular
  {
    const { status } = await api('GET', '/feed?sort=popular', tokenA);
    report('Feed sort=popular', status === 200, `status=${status}`);
  }

  // 3e. Sort nearby
  {
    const { status } = await api('GET', '/feed?sort=nearby&lat=30.3&lng=78.0', tokenA);
    report('Feed sort=nearby', status === 200, `status=${status}`);
  }

  // 3f. Like post
  {
    const { status, json } = await api('POST', `/feed/${postId}/like`, tokenB);
    report('Like post', status === 200 && json?.liked === true, `status=${status}`);
  }

  // 3g. Unlike post
  {
    const { status, json } = await api('POST', `/feed/${postId}/like`, tokenB);
    report('Unlike post', status === 200 && json?.liked === false, `status=${status}`);
  }

  // 3h. Save post
  {
    const { status, json } = await api('POST', `/feed/${postId}/save`, tokenB);
    report('Save post', status === 200 && json?.saved === true, `status=${status}`);
  }

  // 3i. Unsave post
  {
    const { status, json } = await api('POST', `/feed/${postId}/save`, tokenB);
    report('Unsave post', status === 200 && json?.saved === false, `status=${status}`);
  }

  // 3j. Get single post with comments
  {
    const { status, json } = await api('GET', `/feed/${postId}`, tokenB);
    report('GET /feed/:id', status === 200 && json?.post?.id === postId, `status=${status}`);
  }

  // 3k. Get user posts
  {
    const { status, json } = await api('GET', `/feed/user/${userIdA}`, tokenB);
    report('GET /feed/user/:userId', status === 200 && Array.isArray(json?.posts), `status=${status}`);
  }

  // 3l. Empty comment (should fail)
  {
    const { status } = await api('POST', `/feed/${postId}/comments`, tokenB, { content: '   ' });
    report('Empty comment rejected', status === 400, `status=${status}`);
  }

  // 3m. Create comment
  {
    const { status, json } = await api('POST', `/feed/${postId}/comments`, tokenB, {
      content: 'Count me in! I love Blue Tokai.',
    });
    report('Create comment', status === 201, `status=${status}`);
    commentId = json?.comment?.id || '';
  }

  // 3n. Get comments
  {
    const { status, json } = await api('GET', `/feed/${postId}/comments`, tokenA);
    report('Get comments', status === 200 && json?.comments?.length >= 1, `status=${status}, count=${json?.comments?.length}`);
  }

  // 3o. User A cannot delete User B's comment
  {
    const { status } = await api('DELETE', `/feed/${postId}/comments/${commentId}`, tokenA);
    report('Cannot delete others comment', status === 404, `status=${status}`);
  }

  // 3p. Delete own comment
  {
    const { status } = await api('DELETE', `/feed/${postId}/comments/${commentId}`, tokenB);
    report('Delete own comment', status === 200, `status=${status}`);
  }

  // 3q. Create comment for count test
  {
    await api('POST', `/feed/${postId}/comments`, tokenA, { content: 'Great idea!' });
    const { json } = await api('GET', `/feed/${postId}/comments`, tokenA);
    report('Comment count accurate', json?.comments?.length === 1, `count=${json?.comments?.length}`);
  }

  // 3r. Delete post (owner)
  {
    const { status } = await api('DELETE', `/feed/${postId}`, tokenA);
    report('Delete own post', status === 200, `status=${status}`);
  }

  // 3s. Create more posts for pagination
  {
    for (let i = 0; i < 3; i++) {
      await api('POST', '/feed', tokenA, {
        category: ['rent', 'buddy', 'college'][i],
        content: `Test post ${i + 1} for pagination testing.`,
      });
    }
    const { json } = await api('GET', '/feed?limit=2&page=1', tokenA);
    report('Feed pagination', json?.posts?.length === 2 && json?.pagination?.total >= 3, `total=${json?.pagination?.total}`);
  }

  // ============================================================
  // SECTION 4: RENTALS
  // ============================================================
  console.log('\n━━━ 4. RENTALS ━━━');

  // 4a. Get categories
  let categoryId = '';
  {
    const { status, json } = await api('GET', '/rentals/categories', tokenA);
    report('GET /rentals/categories', status === 200 && Array.isArray(json?.categories), `status=${status}, count=${json?.categories?.length}`);
    categoryId = json?.categories?.[0]?.id || '';
  }

  // 4b. Create listing
  {
    const { status, json } = await api('POST', '/rentals', tokenA, {
      categoryId,
      title: 'Canon EOS Camera for rent',
      description: 'High quality Canon DSLR camera available for rent. Great condition and works perfectly.',
      pricePerDay: 500,
      negotiable: true,
      condition: 'like_new',
      locationLat: 30.3165,
      locationLng: 78.0322,
      locationName: 'Dehradun',
      availableFrom: '2026-09-01',
      availableUntil: '2026-12-31',
    });
    report('Create rental listing', status === 201, `status=${status}`);
    listingId = json?.listing?.id || '';
  }

  // 4c. Search listings
  {
    const { status, json } = await api('GET', '/rentals/search', tokenB);
    report('Search listings', status === 200 && Array.isArray(json?.listings), `status=${status}`);
  }

  // 4d. Search with query
  {
    const { status } = await api('GET', '/rentals/search?q=Canon', tokenB);
    report('Search with query', status === 200, `status=${status}`);
  }

  // 4e. Get listing detail
  {
    const { status, json } = await api('GET', `/rentals/${listingId}`, tokenB);
    report('Get listing detail', status === 200 && json?.listing?.id === listingId, `status=${status}`);
  }

  // 4f. Privacy: no exact coords in public listing
  {
    const { json } = await api('GET', `/rentals/${listingId}`, tokenB);
    const l = json?.listing || {};
    report('Listing location privacy', l.location_lat === undefined || l.location_lat === null, `location_lat exposed: ${l.location_lat}`);
  }

  // 4g. Invalid listing (short description)
  {
    const { status } = await api('POST', '/rentals', tokenA, {
      categoryId, title: 'Test', description: 'Short', pricePerDay: 100,
      condition: 'good', locationLat: 30, locationLng: 78, locationName: 'Ddn',
      availableFrom: '2026-09-01',
    });
    report('Invalid listing rejected (description)', status === 400, `status=${status}`);
  }

  // 4h. Request rental (User B → User A)
  {
    const { status, json } = await api('POST', `/rentals/${listingId}/requests`, tokenB, {
      startDate: '2026-09-10', endDate: '2026-09-12',
      message: 'Hi, can I rent this for the weekend?',
    });
    report('Create rental request', status === 201, `status=${status}`);
    rentalRequestId = json?.request?.id || '';
  }

  // 4i. My listings (User A)
  {
    const { status, json } = await api('GET', '/rentals/my-listings', tokenA);
    report('My listings', status === 200 && Array.isArray(json?.listings), `status=${status}`);
  }

  // 4j. My requests (User B)
  {
    const { status, json } = await api('GET', '/rentals/my-requests', tokenB);
    report('My requests', status === 200 && Array.isArray(json?.requests), `status=${status}`);
  }

  // 4k. Incoming requests (User A)
  {
    const { status, json } = await api('GET', '/rentals/incoming-requests', tokenA);
    report('Incoming requests', status === 200 && Array.isArray(json?.requests), `status=${status}`);
  }

  // 4l. Respond to request
  {
    const { status, json } = await api('PUT', '/rentals/requests/:id/respond', tokenA, {
      status: 'accepted', agreedPrice: 450,
    });
    // Fix: use the actual request ID
    const { status: s2, json: j2 } = await api('PUT', `/rentals/requests/${rentalRequestId}/respond`, tokenA, {
      status: 'accepted', agreedPrice: 450,
    });
    report('Respond to rental request', s2 === 200, `status=${s2}`);
  }

  // 4m. User B cannot delete User A's listing
  {
    const { status } = await api('DELETE', `/rentals/${listingId}`, tokenB);
    report('Cannot delete others listing', status === 404, `status=${status}`);
  }

  // ============================================================
  // SECTION 5: BUDDY
  // ============================================================
  console.log('\n━━━ 5. BUDDY ━━━');

  // 5a. Get activities
  {
    const { status, json } = await api('GET', '/buddy/activities', tokenA);
    report('GET /buddy/activities', status === 200 && Array.isArray(json?.activities), `status=${status}`);
  }

  // 5b. Create buddy profile (User A)
  {
    const { status, json } = await api('POST', '/buddy/profile', tokenA, {
      buddyType: 'buddy',
      title: 'Coffee and exploring Dehradun',
      description: 'Love exploring new cafes and walking around Dehradun. Always up for a good conversation.',
      activities: ['Coffee', 'Movies', 'Walking'],
      pricePerHour: 300,
      negotiable: true,
      availabilityDays: ['monday', 'wednesday', 'friday'],
      availabilityTimes: '10:00 AM - 6:00 PM',
      locationLat: 30.3165,
      locationLng: 78.0322,
      locationName: 'Dehradun',
      gender: 'male',
    });
    report('Create buddy profile', status === 201, `status=${status}`);
    buddyProfileId = json?.profile?.id || '';
  }

  // 5c. Get my buddy profile
  {
    const { status, json } = await api('GET', '/buddy/profile', tokenA);
    report('GET /buddy/profile', status === 200 && json?.profile?.id === buddyProfileId, `status=${status}`);
  }

  // 5d. Update buddy profile
  {
    const { status, json } = await api('PATCH', '/buddy/profile', tokenA, {
      title: 'Updated: Coffee walks in Dehradun',
      pricePerHour: 350,
    });
    report('Update buddy profile', status === 200, `status=${status}`);
  }

  // 5e. Search buddies (User B → find User A)
  {
    const { status, json } = await api('GET', '/buddy/search', tokenB);
    report('Search buddies', status === 200 && Array.isArray(json?.buddies), `status=${status}, count=${json?.buddies?.length}`);
  }

  // 5f. Buddy privacy: no exact coords
  {
    const { json } = await api('GET', `/buddy/${buddyProfileId}`, tokenB);
    const b = json?.buddy || {};
    report('Buddy location privacy', b.location_lat === undefined || b.location_lat === null, `location_lat exposed: ${b.location_lat}`);
  }

  // 5g. Create buddy request (User B → User A)
  {
    const { status, json } = await api('POST', `/buddy/${buddyProfileId}/requests`, tokenB, {
      activity: 'Coffee',
      message: 'Hey! Want to grab coffee this Saturday?',
      proposedDate: '2026-09-06',
      proposedTime: '14:00',
      proposedDurationHours: 2,
      proposedLocation: 'Blue Tokai, Rajpur Road',
    });
    report('Create buddy request', status === 201, `status=${status}`);
    buddyRequestId = json?.request?.id || '';
  }

  // 5h. My buddy requests
  {
    const { status, json } = await api('GET', '/buddy/my-requests', tokenB);
    report('My buddy requests', status === 200 && Array.isArray(json?.requests), `status=${status}`);
  }

  // 5i. Incoming buddy requests
  {
    const { status, json } = await api('GET', '/buddy/incoming-requests', tokenA);
    report('Incoming buddy requests', status === 200 && Array.isArray(json?.requests), `status=${status}`);
  }

  // 5j. Respond to buddy request
  {
    const { status, json } = await api('PUT', `/buddy/requests/${buddyRequestId}/respond`, tokenA, {
      status: 'accepted', agreedPrice: 300,
    });
    report('Respond to buddy request', status === 200, `status=${status}`);
  }

  // 5k. Pause buddy profile
  {
    const { status, json } = await api('POST', '/buddy/profile/pause', tokenA);
    report('Pause buddy profile', status === 200, `status=${status}`);
  }

  // 5l. Resume buddy profile
  {
    const { status } = await api('POST', '/buddy/profile/pause', tokenA);
    report('Resume buddy profile', status === 200, `status=${status}`);
  }

  // ============================================================
  // SECTION 6: MESSAGES
  // ============================================================
  console.log('\n━━━ 6. MESSAGES ━━━');

  // 6a. Create conversation
  {
    const { status, json } = await api('POST', '/messages', tokenA, { otherUserId: userIdB });
    report('Create conversation', status === 201, `status=${status}`);
    conversationId = json?.id || json?.conversation?.id || '';
  }

  // 6b. Get conversations
  {
    const { status, json } = await api('GET', '/messages', tokenA);
    report('Get conversations', status === 200 && Array.isArray(json?.conversations), `status=${status}`);
  }

  // 6c. Send message
  {
    const { status, json } = await api('POST', `/messages/${conversationId}/messages`, tokenA, {
      content: 'Hey! Ready for coffee this Saturday?',
    });
    report('Send message', status === 201, `status=${status}`);
  }

  // 6d. User B sends reply
  {
    const { status } = await api('POST', `/messages/${conversationId}/messages`, tokenB, {
      content: 'Yes! Blue Tokai at 2pm?',
    });
    report('User B reply', status === 201, `status=${status}`);
  }

  // 6e. Get messages
  {
    const { status, json } = await api('GET', `/messages/${conversationId}/messages`, tokenA);
    report('Get messages', status === 200 && Array.isArray(json?.messages), `status=${status}, count=${json?.messages?.length}`);
  }

  // 6f. Get conversation detail
  {
    const { status, json } = await api('GET', `/messages/${conversationId}`, tokenA);
    report('Get conversation detail', status === 200, `status=${status}`);
  }

  // 6g. Empty message rejected
  {
    const { status } = await api('POST', `/messages/${conversationId}/messages`, tokenA, { content: '   ' });
    report('Empty message rejected', status === 400, `status=${status}`);
  }

  // ============================================================
  // SECTION 7: FORUMS
  // ============================================================
  console.log('\n━━━ 7. FORUMS ━━━');

  // 7a. Get colleges
  {
    const { status, json } = await api('GET', '/forums/colleges', tokenA);
    report('GET /forums/colleges', status === 200 && Array.isArray(json?.colleges), `status=${status}, count=${json?.colleges?.length}`);
    collegeSlug = json?.colleges?.[0]?.slug || '';
  }

  // 7b. Get college detail
  {
    const { status, json } = await api('GET', `/forums/colleges/${collegeSlug}`, tokenA);
    report('GET /forums/colleges/:slug', status === 200 && json?.college?.slug === collegeSlug, `status=${status}`);
    forumCategoryId = json?.categories?.[0]?.id || '';
  }

  // 7c. Create forum post
  {
    const { status, json } = await api('POST', `/forums/categories/${forumCategoryId}/posts`, tokenA, {
      title: 'Best places to study near campus?',
      content: 'Where do you all study outside of hostel? Any good cafes?',
      isAnonymous: false,
    });
    report('Create forum post', status === 201, `status=${status}`);
    forumPostId = json?.post?.id || '';
  }

  // 7d. Create anonymous post
  {
    const { status, json } = await api('POST', `/forums/categories/${forumCategoryId}/posts`, tokenA, {
      title: 'Anonymous question',
      content: 'Is the assignment deadline really Friday?',
      isAnonymous: true,
    });
    report('Create anonymous forum post', status === 201, `status=${status}`);
  }

  // 7e. Get forum posts
  {
    const { status, json } = await api('GET', `/forums/categories/${forumCategoryId}/posts`, tokenB);
    report('Get forum posts', status === 200, `status=${status}`);
  }

  // 7f. Get single forum post
  {
    const { status, json } = await api('GET', `/forums/posts/${forumPostId}`, tokenB);
    report('Get forum post', status === 200, `status=${status}`);
  }

  // 7g. Upvote forum post
  {
    const { status, json } = await api('POST', `/forums/posts/${forumPostId}/upvote`, tokenB);
    report('Upvote forum post', status === 200, `status=${status}`);
  }

  // 7h. Forum comment
  {
    const { status, json } = await api('POST', `/forums/posts/${forumPostId}/comments`, tokenB, {
      content: 'I like studying at Cafe Coffee Day near Clock Tower.',
      isAnonymous: false,
    });
    report('Forum comment', status === 201, `status=${status}`);
    forumCommentId = json?.comment?.id || '';
  }

  // 7i. Get forum comments
  {
    const { status, json } = await api('GET', `/forums/posts/${forumPostId}/comments`, tokenA);
    report('Get forum comments', status === 200 && Array.isArray(json?.comments), `status=${status}`);
  }

  // 7j. Delete forum comment (own)
  {
    const { status } = await api('DELETE', `/forums/comments/${forumCommentId}`, tokenB);
    report('Delete own forum comment', status === 200, `status=${status}`);
  }

  // 7k. Delete own forum post
  {
    const { status } = await api('DELETE', `/forums/posts/${forumPostId}`, tokenA);
    report('Delete own forum post', status === 200, `status=${status}`);
  }

  // ============================================================
  // SECTION 8: NOTIFICATIONS
  // ============================================================
  console.log('\n━━━ 8. NOTIFICATIONS ━━━');

  // 8a. Get notifications
  {
    const { status, json } = await api('GET', '/notifications', tokenA);
    report('GET /notifications', status === 200, `status=${status}`);
  }

  // 8b. Mark all read
  {
    const { status } = await api('POST', '/notifications/read-all', tokenA);
    report('Mark all notifications read', status === 200, `status=${status}`);
  }

  // ============================================================
  // SECTION 9: REPORTS
  // ============================================================
  console.log('\n━━━ 9. REPORTS ━━━');

  // 9a. Create report (User B reports User A)
  {
    const { status, json } = await api('POST', '/reports', tokenB, {
      reportType: 'user', targetId: userIdA, reason: 'Inappropriate behavior',
      description: 'Testing report functionality.',
    });
    report('Create report', status === 201, `status=${status}`);
    reportId = json?.report?.id || '';
  }

  // 9b. Get reports (admin only)
  {
    const { status, json } = await api('GET', '/reports', tokenAdmin);
    report('Admin get reports', status === 200, `status=${status}`);
  }

  // 9c. Non-admin cannot get reports
  {
    const { status } = await api('GET', '/reports', tokenA);
    report('Non-admin reports rejected', status === 403, `status=${status}`);
  }

  // 9d. Resolve report
  {
    const { status } = await api('PUT', `/reports/${reportId}/resolve`, tokenAdmin, {
      adminNotes: 'Reviewed and dismissed.', status: 'dismissed',
    });
    report('Resolve report', status === 200, `status=${status}`);
  }

  // ============================================================
  // SECTION 10: REVIEWS
  // ============================================================
  console.log('\n━━━ 10. REVIEWS ━━━');

  // 10a. Create review
  {
    const { status } = await api('POST', '/reviews', tokenB, {
      reviewedUserId: userIdA, rating: 5, comment: 'Great person to hang out with!',
    });
    report('Create review', status === 201, `status=${status}`);
  }

  // 10b. Get user reviews
  {
    const { status, json } = await api('GET', `/reviews/user/${userIdA}`, tokenB);
    report('Get user reviews', status === 200 && Array.isArray(json?.reviews), `status=${status}`);
  }

  // 10c. Missing rating rejected
  {
    const { status } = await api('POST', '/reviews', tokenB, { reviewedUserId: userIdA });
    report('Missing rating rejected', status === 400, `status=${status}`);
  }

  // ============================================================
  // SECTION 11: ADMIN
  // ============================================================
  console.log('\n━━━ 11. ADMIN ━━━');

  // 11a. Dashboard stats
  {
    const { status, json } = await api('GET', '/admin/stats', tokenAdmin);
    report('Admin dashboard stats', status === 200 && json?.stats, `status=${status}`);
  }

  // 11b. Get users
  {
    const { status, json } = await api('GET', '/admin/users', tokenAdmin);
    report('Admin get users', status === 200 && Array.isArray(json?.users), `status=${status}`);
  }

  // 11c. Get listings
  {
    const { status, json } = await api('GET', '/admin/listings', tokenAdmin);
    report('Admin get listings', status === 200 && Array.isArray(json?.listings), `status=${status}`);
  }

  // 11d. Get buddy profiles
  {
    const { status, json } = await api('GET', '/admin/buddy-profiles', tokenAdmin);
    report('Admin get buddy profiles', status === 200 && Array.isArray(json?.profiles), `status=${status}`);
  }

  // 11e. Non-admin cannot access admin
  {
    const { status } = await api('GET', '/admin/stats', tokenA);
    report('Non-admin rejected from admin', status === 403, `status=${status}`);
  }

  // 11f. User A cannot update User B status
  {
    const { status } = await api('PUT', `/admin/users/${userIdB}/status`, tokenA, {
      status: 'suspended', reason: 'test',
    });
    report('Non-admin cannot update user status', status === 403, `status=${status}`);
  }

  // ============================================================
  // SECTION 12: TRANSACTIONS
  // ============================================================
  console.log('\n━━━ 12. TRANSACTIONS ━━━');

  // 12a. Get commission config
  {
    const { status, json } = await api('GET', '/transactions/commission-config', tokenA);
    report('Get commission config', status === 200, `status=${status}`);
  }

  // 12b. Calculate commission
  {
    const { status } = await api('POST', '/transactions/calculate', tokenA, { amount: 1000 });
    report('Calculate commission', status === 200, `status=${status}`);
  }

  // ============================================================
  // SECTION 13: AUTHORIZATION / IDOR
  // ============================================================
  console.log('\n━━━ 13. AUTHORIZATION ━━━');

  // 13a. User A cannot update User B profile
  {
    const { status } = await api('PUT', '/users/me', tokenB, {
      bio: 'Hacked by A',
    });
    // This updates B's own profile - test using A's token against B's ID
    // Actually, PUT /users/me always updates the token holder.
    // Need to test IDOR: A tries to delete B's listing
    const { status: s2 } = await api('DELETE', `/rentals/${listingId}`, tokenB);
    report('User B cannot delete User A listing', s2 === 404, `status=${s2}`);
  }

  // 13b. Unauthenticated API calls rejected
  {
    const endpoints = [
      ['GET', '/feed'],
      ['GET', '/rentals/categories'],
      ['GET', '/buddy/activities'],
      ['GET', '/forums/colleges'],
      ['GET', '/messages'],
      ['GET', '/notifications'],
      ['GET', '/admin/stats'],
    ];
    for (const [method, path] of endpoints) {
      const { status } = await api(method, path);
      report(`Unauth ${method} ${path} rejected`, status === 401, `status=${status}`);
    }
  }

  // ============================================================
  // SECTION 14: CLEANUP
  // ============================================================
  console.log('\n━━━ 14. CLEANUP ━━━');

  // Delete buddy profile
  {
    const { status } = await api('DELETE', '/buddy/profile', tokenA);
    report('Delete buddy profile', status === 200, `status=${status}`);
  }

  // Delete listing
  {
    const { status } = await api('DELETE', `/rentals/${listingId}`, tokenA);
    report('Delete listing', status === 200, `status=${status}`);
  }

  // Delete feed posts
  {
    const { json } = await api('GET', '/feed?limit=50', tokenA);
    for (const p of (json?.posts || [])) {
      await api('DELETE', `/feed/${p.id}`, tokenA);
    }
    report('Cleaned feed posts', true);
  }

  // Remove test users
  {
    const { Pool } = await import('pg');
    const pool = new Pool({ host: 'localhost', database: 'yelo', user: 'postgres' });
    await pool.query("DELETE FROM users WHERE email LIKE 'qa-%@yelo.dev'");
    await pool.end();
    report('Cleaned test users', true);
  }

  // ============================================================
  // RESULTS
  // ============================================================
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`${'═'.repeat(50)}`);

  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  }

  console.log('');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
