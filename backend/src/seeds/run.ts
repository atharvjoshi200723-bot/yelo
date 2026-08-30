import { pool } from '../lib/db';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Colleges
    const colleges = [
      { name: 'Graphic Era Hill University', slug: 'gehu', description: 'Graphic Era Hill University, Dehradun' },
      { name: 'Graphic Era Deemed University', slug: 'gedu', description: 'Graphic Era Deemed University, Dehradun' },
      { name: 'UPES', slug: 'upes', description: 'University of Petroleum and Energy Studies' },
      { name: 'DIT University', slug: 'dit', description: 'DIT University, Dehradun' },
      { name: 'DAV PG College', slug: 'dav', description: 'DAV Post Graduate College, Dehradun' },
    ];

    for (const college of colleges) {
      await pool.query(
        `INSERT INTO colleges (name, slug, description) VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING`,
        [college.name, college.slug, college.description]
      );
    }
    console.log('✅ Colleges seeded');

    // Forum categories for each college
    const collegeResult = await pool.query('SELECT id, slug FROM colleges');
    const categoryNames = [
      { name: 'Assignments', slug: 'assignments' },
      { name: 'Teachers', slug: 'teachers' },
      { name: 'Exams', slug: 'exams' },
      { name: 'Campus', slug: 'campus' },
      { name: 'Hostel', slug: 'hostel' },
      { name: 'Food', slug: 'food' },
      { name: 'Restaurants', slug: 'restaurants' },
      { name: 'Events', slug: 'events' },
      { name: 'College Life', slug: 'college-life' },
      { name: 'Questions', slug: 'questions' },
      { name: 'General', slug: 'general' },
      { name: 'Off-topic', slug: 'off-topic' },
    ];

    for (const college of collegeResult.rows) {
      for (let i = 0; i < categoryNames.length; i++) {
        const cat = categoryNames[i];
        await pool.query(
          `INSERT INTO forum_categories (college_id, name, slug, sort_order)
           VALUES ($1, $2, $3, $4) ON CONFLICT (college_id, slug) DO NOTHING`,
          [(college as any).id, cat.name, cat.slug, i]
        );
      }
    }
    console.log('✅ Forum categories seeded');

    // Rental categories
    const rentalCategories = [
      { name: 'Electronics', slug: 'electronics', icon: '💻' },
      { name: 'Cameras', slug: 'cameras', icon: '📷' },
      { name: 'Bikes & Cycles', slug: 'bikes', icon: '🚲' },
      { name: 'Books', slug: 'books', icon: '📚' },
      { name: 'Sports Equipment', slug: 'sports', icon: '⚽' },
      { name: 'Musical Instruments', slug: 'musical', icon: '🎸' },
      { name: 'Furniture', slug: 'furniture', icon: '🪑' },
      { name: 'Clothing', slug: 'clothing', icon: '👕' },
      { name: 'Gaming', slug: 'gaming', icon: '🎮' },
      { name: 'Event Equipment', slug: 'events', icon: '🎪' },
      { name: 'Other', slug: 'other', icon: '📦' },
    ];

    for (let i = 0; i < rentalCategories.length; i++) {
      const cat = rentalCategories[i];
      await pool.query(
        `INSERT INTO rental_categories (name, slug, icon, sort_order)
         VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO NOTHING`,
        [cat.name, cat.slug, cat.icon, i]
      );
    }
    console.log('✅ Rental categories seeded');

    // Commission config
    await pool.query(
      `INSERT INTO commission_config (type, value) VALUES ('percentage', 10) ON CONFLICT DO NOTHING`
    );
    console.log('✅ Commission config seeded');

    console.log('🎉 Seeding complete!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
