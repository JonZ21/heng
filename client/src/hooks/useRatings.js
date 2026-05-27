import { useState, useEffect, useCallback } from 'react';

export function useRatings(limit = 6) {
  const [ratings, setRatings] = useState([]);

  const fetchRatings = useCallback(async () => {
    const res = await fetch(`/api/ratings?limit=${limit}`);
    const data = await res.json();
    setRatings(data);
  }, [limit]);

  useEffect(() => { fetchRatings(); }, [fetchRatings]);

  async function addRating(week_start, rating, notes = '') {
    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_start, rating, notes }),
    });
    const row = await res.json();
    setRatings(prev => [row, ...prev].slice(0, limit));
  }

  async function deleteRating(id) {
    setRatings(prev => prev.filter(r => r.id !== id));
    await fetch(`/api/ratings/${id}`, { method: 'DELETE' });
  }

  return { ratings, addRating, deleteRating };
}
