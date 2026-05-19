import { ChevronDown, LayoutGrid, GitBranch } from 'lucide-react';
import { caseOptions } from '../data/traces';

export type ViewMode = 'council' | 'graph';

interface HeaderProps {
  selectedCase: string;
  onSelectCase: (caseId: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function Header({ selectedCase, onSelectCase, viewMode, onViewModeChange }: HeaderProps) {
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

      <div className="flex items-center gap-4">
        <div className="flex rounded-lg border border-white/10 overflow-hidden">
          <button
            onClick={() => onViewModeChange('council')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
              viewMode === 'council'
                ? 'bg-accent-teal/20 text-accent-teal'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Council
          </button>
          <button
            onClick={() => onViewModeChange('graph')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
              viewMode === 'graph'
                ? 'bg-accent-teal/20 text-accent-teal'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            Graph
          </button>
        </div>

        <div className="w-[280px] rounded-lg border border-white/10 bg-bg-surface px-3 py-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-accent-teal/70">
              Benchmark accuracy:
            </span>
            <span className="text-[16px] font-semibold text-accent-emerald">73%</span>
          </div>
          <p className="mt-0.5 text-[10px] leading-snug text-text-secondary">
            Correctly identifies the disease in 3 out of 4 cases (30-case DDXPlus benchmark)
          </p>
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
      </div>
    </header>
  );
}
