import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// Get scan results from Firestore
export async function GET(request: Request) {
  try {
    if (!adminDb) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const species = searchParams.get('species') || '';
    const serviceId = searchParams.get('service_id') || '';
    const offset = parseInt(searchParams.get('offset') || '0');

    let query: FirebaseFirestore.Query = adminDb
      .collection('dino_monitor_results')
      .orderBy('created_at', 'desc');

    if (species) {
      query = query.where('species', '==', species);
    }
    if (serviceId) {
      query = query.where('service_id', '==', serviceId);
    }

    if (offset > 0) {
      query = query.offset(offset);
    }

    query = query.limit(limit + 1);

    const snapshot = await query.get();
    const docs = snapshot.docs.slice(0, limit);
    const hasMore = snapshot.docs.length > limit;

    const results = docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        species: data.species,
        level: data.level,
        hp_points: data.hp_points,
        melee_points: data.melee_points,
        location: data.location,
        server_name: data.server_name,
        service_id: data.service_id,
        scanned_at: data.scanned_at,
      };
    });

    return NextResponse.json({ results, hasMore });
  } catch (error) {
    console.error('Failed to fetch scan results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results', results: [] },
      { status: 500 }
    );
  }
}
