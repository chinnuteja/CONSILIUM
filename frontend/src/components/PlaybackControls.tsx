import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  speed: number;
  currentEventIndex: number;
  totalEvents: number;
  isComplete: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onSetSpeed: (speed: number) => void;
}

const SPEEDS = [1, 2, 4, 8];

export function PlaybackControls({
  isPlaying,
  speed,
  currentEventIndex,
  totalEvents,
  isComplete,
  onPlay,
  onPause,
  onStep,
  onReset,
  onSetSpeed,
}: PlaybackControlsProps) {
  const progress = totalEvents > 0 ? ((currentEventIndex + 1) / totalEvents) * 100 : 0;

  return (
    <div className="bg-bg-surface rounded-xl border border-white/5 p-5">
      <div className="flex items-center justify-center gap-3 mb-4">
        <button
          onClick={onReset}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-elevated hover:bg-white/10 transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4 text-text-secondary" />
        </button>

        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={isComplete}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-accent-teal/20 border border-accent-teal/40 hover:bg-accent-teal/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-accent-teal" />
          ) : (
            <Play className="w-5 h-5 text-accent-teal ml-0.5" />
          )}
        </button>

        <button
          onClick={onStep}
          disabled={isComplete}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-elevated hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Step"
        >
          <SkipForward className="w-4 h-4 text-text-secondary" />
        </button>
      </div>

      <div className="mb-3">
        <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-teal rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] font-mono text-text-secondary">
            {currentEventIndex + 1}/{totalEvents} events
          </span>
          <span className="text-[10px] font-mono text-text-secondary">
            {isComplete ? 'Complete' : isPlaying ? 'Playing' : 'Paused'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5">
        <span className="text-[10px] font-mono text-text-secondary mr-2">Speed:</span>
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => onSetSpeed(s)}
            className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
              speed === s
                ? 'bg-accent-teal/20 text-accent-teal border border-accent-teal/40'
                : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
