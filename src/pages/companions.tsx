'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllCharacters } from '@/lib/characters';

export default function CompanionsPage() {
  const [companions, setCompanions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanions();
  }, []);

  const fetchCompanions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/companions', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCompanions(data.companions);
      }
    } catch (error) {
      console.error('Error fetching companions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCompanion = async (characterId: string) => {
    try {
      const token = localStorage.getItem('token');
      const character = getAllCharacters().find((c) => c.id === characterId);

      const response = await fetch('/api/companions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: character?.name,
          gender: character?.gender,
          ageStyle: character?.ageStyle,
          avatarModel: character?.avatarModel,
          voiceModel: character?.voiceModel,
        }),
      });

      if (response.ok) {
        const newCompanion = await response.json();
        setCompanions([...companions, newCompanion]);
        setSelectedCharacter(null);
      }
    } catch (error) {
      console.error('Error creating companion:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">SAGE</h1>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/';
            }}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Your Companions</h2>

        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : companions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No companions yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {companions.map((companion) => (
              <Link key={companion.id} href={`/chat/${companion.id}`}>
                <div className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer p-6">
                  <h3 className="text-xl font-semibold text-gray-800">{companion.name}</h3>
                  <p className="text-gray-600 mt-2">Click to chat</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Available Characters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getAllCharacters().map((character) => (
              <div key={character.id} className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-semibold text-gray-800">{character.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{character.description}</p>
                <p className="text-xs text-gray-500 mt-2">{character.traits.join(', ')}</p>
                <button
                  onClick={() => createCompanion(character.id)}
                  className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded transition"
                >
                  Add Companion
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
