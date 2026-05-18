import type { DemoTrace } from '../types';
import caseA from './case_a.json';
import caseB from './case_b.json';
import caseC from './case_c.json';

export const traces: Record<string, DemoTrace> = {
  case_a: caseA as unknown as DemoTrace,
  case_b: caseB as unknown as DemoTrace,
  case_c: caseC as unknown as DemoTrace,
};

export const caseOptions = [
  { id: 'case_a', label: 'Case A — Common Cold', complexity: 'SIMPLE' as const },
  { id: 'case_b', label: 'Case B — Aldosterone Excess', complexity: 'MODERATE' as const },
  { id: 'case_c', label: 'Case C — Septic Shock', complexity: 'COMPLEX' as const },
];
