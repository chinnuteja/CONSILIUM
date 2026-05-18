import { useState, useMemo } from 'react';
import { Header, type ViewMode } from './components/Header';
import { GraphView } from './components/graph/GraphView';
import { CaseCard } from './components/CaseCard';
import { PlaybackControls } from './components/PlaybackControls';
import { TriageCard } from './components/TriageCard';
import { SpecialistGrid } from './components/SpecialistGrid';
import { CrossExamPanel } from './components/CrossExamPanel';
import { DevilsAdvocatePanel } from './components/DevilsAdvocatePanel';
import { FinalDifferential } from './components/FinalDifferential';
import { usePlayback } from './hooks/usePlayback';
import { traces } from './data/traces';

function App() {
  const [selectedCase, setSelectedCase] = useState('case_b');
  const [viewMode, setViewMode] = useState<ViewMode>('council');
  const trace = useMemo(() => traces[selectedCase] || null, [selectedCase]);
  const { state, play, pause, step, reset, setSpeed } = usePlayback(trace);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header
        selectedCase={selectedCase}
        onSelectCase={setSelectedCase}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <aside className="w-[30%] min-w-[320px] border-r border-white/5 p-4 overflow-y-auto space-y-4">
          {trace && <CaseCard trace={trace} isComplete={state.isComplete} />}

          <PlaybackControls
            isPlaying={state.isPlaying}
            speed={state.speed}
            currentEventIndex={state.currentEventIndex}
            totalEvents={state.totalEvents}
            isComplete={state.isComplete}
            onPlay={play}
            onPause={pause}
            onStep={step}
            onReset={reset}
            onSetSpeed={setSpeed}
          />

          <TriageCard triage={state.triage} />
        </aside>

        {/* Right Panel */}
        <section className="flex-1 overflow-hidden">
          {viewMode === 'council' ? (
            <div className="p-4 overflow-y-auto h-full">
              <SpecialistGrid specialists={state.specialists} />
              <CrossExamPanel challenges={state.challenges} />
              <DevilsAdvocatePanel data={state.devilsAdvocate} />
              <FinalDifferential
                data={state.finalDifferential}
                complexity={state.triage?.case_complexity ?? null}
              />
            </div>
          ) : (
            trace && <GraphView trace={trace} state={state} />
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
