import { useState, useEffect, useCallback } from 'react';
import { getWeekStart } from '../utils/time.js';

export function useGoals() {
  const [goals, setGoals] = useState([]);
  const weekStart = getWeekStart();

  const fetchGoals = useCallback(async () => {
    const res = await fetch(`/api/goals?week=${weekStart}`);
    const data = await res.json();
    setGoals(data);
  }, [weekStart]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  async function addGoal(title) {
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_start: weekStart, title }),
    });
    const goal = await res.json();
    setGoals(prev => [...prev, goal]);
  }

  async function toggleGoal(id, completed) {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: completed ? 1 : 0 } : g));
    await fetch(`/api/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: completed ? 1 : 0 }),
    });
  }

  async function deleteGoal(id) {
    setGoals(prev => prev.filter(g => g.id !== id));
    await fetch(`/api/goals/${id}`, { method: 'DELETE' });
  }

  return { goals, addGoal, toggleGoal, deleteGoal };
}
