import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  DemoTrace,
  TraceEvent,
  TriageData,
  SpecialistState,
  SpecialistStatus,
  ChallengeArrow,
  SpecialistPostedData,
  ChallengePostedData,
  ResponsePostedData,
  DevilsAdvocateData,
  FinalDifferentialData,
} from '../types';

const ALL_SPECIALISTS = [
  'Cardiology',
  'Endocrinology',
  'Neurology',
  'Rheumatology',
  'InfectiousDisease',
  'Gastroenterology',
  'Psychiatry',
];

export interface PlaybackState {
  isPlaying: boolean;
  speed: number;
  currentEventIndex: number;
  totalEvents: number;
  triage: TriageData | null;
  specialists: SpecialistState[];
  challenges: ChallengeArrow[];
  devilsAdvocate: DevilsAdvocateData | null;
  finalDifferential: FinalDifferentialData | null;
  isComplete: boolean;
}

const initialSpecialists: SpecialistState[] = ALL_SPECIALISTS.map((name) => ({
  name,
  status: 'IDLE' as SpecialistStatus,
}));

export function usePlayback(trace: DemoTrace | null) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(4);
  const [currentEventIndex, setCurrentEventIndex] = useState(-1);
  const [triage, setTriage] = useState<TriageData | null>(null);
  const [specialists, setSpecialists] = useState<SpecialistState[]>(initialSpecialists);
  const [challenges, setChallenges] = useState<ChallengeArrow[]>([]);
  const [devilsAdvocate, setDevilsAdvocate] = useState<DevilsAdvocateData | null>(null);
  const [finalDifferential, setFinalDifferential] = useState<FinalDifferentialData | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetState = useCallback(() => {
    setCurrentEventIndex(-1);
    setTriage(null);
    setSpecialists(initialSpecialists);
    setChallenges([]);
    setDevilsAdvocate(null);
    setFinalDifferential(null);
    setIsComplete(false);
    setIsPlaying(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    resetState();
  }, [trace, resetState]);

  const processEvent = useCallback((event: TraceEvent) => {
    switch (event.type) {
      case 'triage_decision':
        setTriage(event.data as unknown as TriageData);
        break;

      case 'specialist_thinking': {
        const specName = (event.data as { specialty: string }).specialty;
        setSpecialists((prev) =>
          prev.map((s) =>
            s.name === specName ? { ...s, status: 'THINKING' as SpecialistStatus } : s
          )
        );
        break;
      }

      case 'specialist_posted': {
        const d = event.data as unknown as SpecialistPostedData;
        setSpecialists((prev) =>
          prev.map((s) =>
            s.name === d.specialty
              ? {
                  ...s,
                  status: 'POSTED' as SpecialistStatus,
                  diagnosis: d.diagnosis,
                  confidence: d.confidence,
                  reasoning: d.reasoning,
                  citations: d.citations,
                }
              : s
          )
        );
        break;
      }

      case 'challenge_posted': {
        const d = event.data as unknown as ChallengePostedData;
        const arrow: ChallengeArrow = {
          id: `${d.from_specialty}->${d.to_specialty}`,
          from: d.from_specialty,
          to: d.to_specialty,
          question: d.question,
        };
        setChallenges((prev) => [...prev, arrow]);
        setSpecialists((prev) =>
          prev.map((s) =>
            s.name === d.to_specialty ? { ...s, status: 'CHALLENGED' as SpecialistStatus } : s
          )
        );
        break;
      }

      case 'response_posted': {
        const d = event.data as unknown as ResponsePostedData;
        const newStatus: SpecialistStatus = d.action === 'DEFEND' ? 'DEFENDED' : 'REVISED';
        setSpecialists((prev) =>
          prev.map((s) =>
            s.name === d.from_specialty
              ? {
                  ...s,
                  status: newStatus,
                  ...(d.action === 'REVISE'
                    ? { diagnosis: d.revised_diagnosis, confidence: d.revised_confidence }
                    : {}),
                }
              : s
          )
        );
        setChallenges((prev) =>
          prev.map((c) =>
            c.to === d.from_specialty && !c.action
              ? { ...c, action: d.action, responseText: d.response_text }
              : c
          )
        );
        break;
      }

      case 'devils_advocate':
        setDevilsAdvocate(event.data as unknown as DevilsAdvocateData);
        break;

      case 'final_differential':
        setFinalDifferential(event.data as unknown as FinalDifferentialData);
        setIsComplete(true);
        setIsPlaying(false);
        break;
    }
  }, []);

  const advanceEvent = useCallback(() => {
    if (!trace) return;

    setCurrentEventIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex >= trace.events.length) {
        setIsPlaying(false);
        return prevIndex;
      }

      const event = trace.events[nextIndex];
      processEvent(event);

      if (nextIndex + 1 < trace.events.length) {
        const nextEvent = trace.events[nextIndex + 1];
        const delay = (nextEvent.timestamp_ms - event.timestamp_ms) / speed;
        const minDelay = event.type === 'triage_decision' ? 2000 / speed : 200;
        const actualDelay = Math.max(delay, minDelay);

        timerRef.current = setTimeout(() => {
          if (isPlaying) advanceEvent();
        }, actualDelay);
      } else {
        setIsPlaying(false);
      }

      return nextIndex;
    });
  }, [trace, speed, isPlaying, processEvent]);

  useEffect(() => {
    if (isPlaying && trace) {
      if (currentEventIndex < 0) {
        advanceEvent();
      } else if (currentEventIndex < trace.events.length - 1) {
        advanceEvent();
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const step = useCallback(() => {
    if (!trace || currentEventIndex >= trace.events.length - 1) return;
    setIsPlaying(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    const nextIndex = currentEventIndex + 1;
    processEvent(trace.events[nextIndex]);
    setCurrentEventIndex(nextIndex);
  }, [trace, currentEventIndex, processEvent]);

  const reset = useCallback(() => {
    resetState();
  }, [resetState]);

  const state: PlaybackState = {
    isPlaying,
    speed,
    currentEventIndex,
    totalEvents: trace?.events.length ?? 0,
    triage,
    specialists,
    challenges,
    devilsAdvocate,
    finalDifferential,
    isComplete,
  };

  return { state, play, pause, step, reset, setSpeed };
}
