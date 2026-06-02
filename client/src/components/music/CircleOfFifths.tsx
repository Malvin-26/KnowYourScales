import { motion } from 'framer-motion';
import { CIRCLE_OF_FIFTHS } from '../../lib/musicTheory';

interface CircleOfFifthsProps {
  selectedRoot?: string;
  selectedType?: 'major' | 'minor';
  onSelect?: (root: string, type: 'major' | 'minor') => void;
}

export function CircleOfFifths({ selectedRoot, selectedType = 'major', onSelect }: CircleOfFifthsProps) {
  const radius = 120;
  const center = 150;

  return (
    <div className="relative w-[300px] h-[300px] mx-auto">
      <svg viewBox="0 0 300 300" className="w-full h-full">
        <circle cx={center} cy={center} r={radius + 20} fill="none" stroke="rgba(99,102,241,0.2)" strokeWidth="2" />
        {CIRCLE_OF_FIFTHS.map((item, i) => {
          const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          const isSelected = selectedRoot === item.key && selectedType === item.type;
          return (
            <g key={item.key}>
              <motion.circle
                cx={x}
                cy={y}
                r={22}
                fill={isSelected ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.06)'}
                stroke={isSelected ? '#818cf8' : 'rgba(255,255,255,0.15)'}
                strokeWidth={isSelected ? 2 : 1}
                className="cursor-pointer"
                whileHover={{ scale: 1.1 }}
                onClick={() => onSelect?.(item.key, item.type)}
              />
              <text
                x={x}
                y={y + 5}
                textAnchor="middle"
                fill={isSelected ? '#fff' : '#94a3b8'}
                fontSize="12"
                fontWeight="600"
                className="pointer-events-none select-none"
              >
                {item.key}
              </text>
            </g>
          );
        })}
        <text x={center} y={center + 5} textAnchor="middle" fill="#6366f1" fontSize="11" fontWeight="500">
          Circle of Fifths
        </text>
      </svg>
    </div>
  );
}
