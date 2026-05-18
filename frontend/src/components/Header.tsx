import { ChevronDown } from 'lucide-react';
import { caseOptions } from '../data/traces';

interface HeaderProps {
  selectedCase: string;
  onSelectCase: (caseId: string) => void;
}

export function Header({ selectedCase, onSelectCase }: HeaderProps) {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-bg-surface">
      <div className="flex items-center gap-4">
        <h1 className="text-[28px] font-serif italic text-accent-teal tracking-tight">
          CONSILIUM
        </h1>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-secondary mt-1">
          Multi-Agent Diagnostic Council
        </span>
      </div>

      <div className="relative">
        <select
          value={selectedCase}
          onChange={(e) => onSelectCase(e.target.value)}
          className="appearance-none bg-bg-elevated text-text-primary text-sm px-4 py-2 pr-10 rounded-lg border border-white/10 cursor-pointer hover:border-accent-teal/50 transition-colors focus:outline-none focus:border-accent-teal"
        >
          {caseOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
          <option value="custom" disabled>
            Custom (requires backend)
          </option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
      </div>
    </header>
  );
}
