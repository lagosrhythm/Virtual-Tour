import { getRealtimeDB, COLLECTIONS } from './firestore';
import { RECOMMENDED_TOURS } from '../../data/recommendedTours';
import { TOURS } from '../../constants';

export async function seedRecommendedTours(): Promise<void> {
  try {
    const db = getRealtimeDB();
    const ref = db.ref(COLLECTIONS.recommended_tours);
    const existing = await ref.limitToFirst(1).get();
    if (existing.exists()) {
      console.log('✓ Recommended tours already seeded (RTDB), skipping.');
      return;
    }
    console.log('Seeding recommended tours to RTDB...');
    const now = new Date().toISOString();
    for (const tour of RECOMMENDED_TOURS) {
      const newRef = ref.push();
      await newRef.set({
        ...tour,
        id: newRef.key,
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(`✓ Seeded ${RECOMMENDED_TOURS.length} recommended tours to RTDB`);
  } catch (error) {
    console.warn('Could not seed recommended tours to RTDB:', error instanceof Error ? error.message : error);
  }
}

export async function seedCatalogTours(): Promise<void> {
  try {
    const db = getRealtimeDB();
    const ref = db.ref(COLLECTIONS.catalog_tours);
    const existing = await ref.limitToFirst(1).get();
    if (existing.exists()) {
      console.log('✓ Catalog tours already seeded (RTDB), skipping.');
      return;
    }
    console.log('Seeding catalog tours to RTDB...');
    const now = new Date().toISOString();
    for (const tour of TOURS) {
      const newRef = ref.push();
      const imageUrl = tour.imgClass.match(/url\('(.+?)'\)/)?.[1] ?? '';
      await newRef.set({
        id: newRef.key,
        title: tour.title,
        category: tour.category,
        duration: tour.duration,
        description: '',
        imageUrl,
        free: tour.isFree ?? true,
        views: tour.views,
        trend: tour.trend ?? '',
        visibility: 'public',
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(`✓ Seeded ${TOURS.length} catalog tours to RTDB`);
  } catch (error) {
    console.warn('Could not seed catalog tours to RTDB:', error instanceof Error ? error.message : error);
  }
}

export async function initializeFirestoreData(): Promise<void> {
  try {
    await seedRecommendedTours();
    await seedCatalogTours();
    console.log('✓ Realtime Database initialization complete');
  } catch (error) {
    console.error('Error initializing RTDB:', error);
    throw error;
  }
}
