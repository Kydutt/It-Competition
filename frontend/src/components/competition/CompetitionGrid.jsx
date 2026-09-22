import React from 'react';
import CompetitionCard from './CompetitionCard';

export const CompetitionGrid = ({ competitions = [] }) => {
  if (!competitions || competitions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 p-8">
        <p className="text-gray-500 font-medium">Belum ada kompetisi aktif yang tersedia saat ini.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
      {competitions.map((comp) => (
        <CompetitionCard key={comp.id || comp.slug} competition={comp} />
      ))}
    </div>
  );
};

export default CompetitionGrid;
