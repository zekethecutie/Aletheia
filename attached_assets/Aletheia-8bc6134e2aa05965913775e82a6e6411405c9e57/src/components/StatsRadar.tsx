import React from 'react';
import { UserStats } from '../types';

interface StatsRadarProps {
  stats: UserStats;
}

export const StatsRadar: React.FC<StatsRadarProps> = ({ stats }) => {
  const size = 240;
  const center = size / 2;
  const maxValue = 100;
  
  const statPoints = [
    { name: 'STR', value: stats.physical, angle: 0 },
    { name: 'INT', value: stats.intelligence, angle: 72 },
    { name: 'AGI', value: stats.spiritual, angle: 144 },
    { name: 'LUK', value: stats.social, angle: 216 },
    { name: 'WIS', value: stats.wealth, angle: 288 }
  ];

  const getPoint = (angle: number, distance: number) => {
    const radian = (angle * Math.PI) / 180;
    const x = center + distance * Math.cos(radian - Math.PI / 2);
    const y = center + distance * Math.sin(radian - Math.PI / 2);
    return { x, y };
  };

  const radius = 70;
  const gridLevels = 5;
  const gridPoints = Array.from({ length: gridLevels }, (_, i) => (i + 1) * (radius / gridLevels));

  const polygonPoints = statPoints
    .map(stat => {
      const distance = (stat.value / maxValue) * radius;
      const point = getPoint(stat.angle, distance);
      return `${point.x},${point.y}`;
    })
    .join(' ');

  return (
    <div className="glass-card p-8 rounded-2xl border-white/5 flex flex-col items-center">
      <h3 className="text-[11px] font-display font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Parametrics</h3>
      
      <svg width={size} height={size} className="mb-8">
        {gridPoints.map((r, i) => (
          <circle
            key={`grid-${i}`}
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            opacity="0.3"
          />
        ))}

        {statPoints.map((stat, i) => {
          const point = getPoint(stat.angle, radius);
          return (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="#475569"
              strokeWidth="1"
              opacity="0.5"
            />
          );
        })}

        <polygon
          points={polygonPoints}
          fill="rgba(212, 175, 55, 0.15)"
          stroke="#d4af37"
          strokeWidth="2.5"
        />

        {statPoints.map((stat, i) => {
          const distance = (stat.value / maxValue) * radius;
          const point = getPoint(stat.angle, distance);
          return (
            <circle
              key={`point-${i}`}
              cx={point.x}
              cy={point.y}
              r="5"
              fill="#d4af37"
              stroke="rgba(212, 175, 55, 0.6)"
              strokeWidth="2"
            />
          );
        })}

        {statPoints.map((stat) => {
          const labelDistance = radius + 25;
          const point = getPoint(stat.angle, labelDistance);
          return (
            <text
              key={`label-${stat.name}`}
              x={point.x}
              y={point.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[10px] font-display font-black"
              fill="#d4af37"
              opacity="0.8"
            >
              {stat.name}
            </text>
          );
        })}
      </svg>

      <div className="grid grid-cols-5 gap-4 w-full text-center">
        {statPoints.map((stat) => (
          <div key={stat.name}>
            <p className="text-[9px] font-display font-black text-slate-500 uppercase tracking-widest mb-2">
              {stat.name}
            </p>
            <p className="text-xl font-display font-black text-gold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
