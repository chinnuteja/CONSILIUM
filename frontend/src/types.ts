export type EventType =
  | 'case_received'
  | 'triage_decision'
  | 'specialist_thinking'
  | 'specialist_posted'
  | 'challenge_posted'
  | 'response_posted'
  | 'devils_advocate'
  | 'final_differential';

export interface TraceEvent {
  timestamp_ms: number;
  type: EventType;
  data: Record<string, unknown>;
}

export interface CaseReceivedData {
  case_id: string;
  vignette: string;
  evidence_count: number;
}

export interface TriageData {
  case_complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
  confident_diagnosis?: string;
  confidence: number;
  red_flags: string[];
  recommended_specialties: string[];
  reasoning: string;
}

export interface SpecialistThinkingData {
  specialty: string;
}

export interface SpecialistPostedData {
  specialty: string;
  diagnosis: string;
  confidence: number;
  reasoning: string;
  citations: string[];
}

export interface ChallengePostedData {
  from_specialty: string;
  to_specialty: string;
  question: string;
}

export interface ResponsePostedData {
  from_specialty: string;
  action: 'DEFEND' | 'REVISE';
  revised_diagnosis: string;
  revised_confidence: number;
  response_text: string;
}

export interface DevilsAdvocateData {
  alternative_diagnosis: string;
  confidence: number;
  reasoning: string;
  citations: string[];
}

export interface FinalDifferentialData {
  top_3: Array<{
    diagnosis: string;
    agreement_score: number;
  }>;
}

export interface DemoTrace {
  case_id: string;
  vignette: string;
  age: number;
  sex: string;
  ground_truth: string;
  compute_time_seconds: number;
  events: TraceEvent[];
}

export type SpecialistStatus =
  | 'IDLE'
  | 'THINKING'
  | 'POSTED'
  | 'CHALLENGED'
  | 'DEFENDED'
  | 'REVISED';

export type Complexity = 'SIMPLE' | 'MODERATE' | 'COMPLEX';

export interface SpecialistState {
  name: string;
  status: SpecialistStatus;
  diagnosis?: string;
  confidence?: number;
  reasoning?: string;
  citations?: string[];
}

export interface ChallengeArrow {
  id: string;
  from: string;
  to: string;
  question: string;
  action?: 'DEFEND' | 'REVISE';
  responseText?: string;
}
