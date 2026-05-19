import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PatientNode } from './PatientNode';
import { EvidenceNode } from './EvidenceNode';
import { SpecialistNode } from './SpecialistNode';
import { HypothesisNode } from './HypothesisNode';
import { ChallengeNode } from './ChallengeNode';
import { AdvocateNode } from './AdvocateNode';
import type { PlaybackState } from '../../hooks/usePlayback';
import type { DemoTrace } from '../../types';

const nodeTypes = {
  patient: PatientNode,
  evidence: EvidenceNode,
  specialist: SpecialistNode,
  hypothesis: HypothesisNode,
  challenge: ChallengeNode,
  advocate: AdvocateNode,
};

interface GraphViewProps {
  trace: DemoTrace;
  state: PlaybackState;
}

// Fixed angular positions for specialists (clock positions)
const SPEC_ANGLES: Record<string, number> = {
  Cardiology: -Math.PI / 2,           // 12 o'clock
  Endocrinology: -Math.PI / 4,        // 1:30
  Neurology: 0,                        // 3 o'clock
  Rheumatology: Math.PI / 4,          // 4:30
  InfectiousDisease: Math.PI / 2,     // 6 o'clock
  Gastroenterology: (3 * Math.PI) / 4, // 7:30
  Psychiatry: Math.PI,                 // 9 o'clock
};

const ADVOCATE_ANGLE = -(3 * Math.PI) / 4; // 10:30

function buildGraph(trace: DemoTrace, state: PlaybackState): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const cx = 520;
  const cy = 380;
  const evidenceRadius = 140;
  const specRadius = 360;

  // Patient node at center
  nodes.push({
    id: 'patient',
    type: 'patient',
    position: { x: cx - 40, y: cy - 40 },
    data: { age: trace.age, sex: trace.sex, caseId: trace.case_id },
  });

  // Evidence nodes — tight inner ring
  const evidenceItems = trace.events[0]?.data as { evidence_count?: number } | undefined;
  const evidenceCount = evidenceItems?.evidence_count ?? 6;

  for (let i = 0; i < evidenceCount; i++) {
    const angle = (i / evidenceCount) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * evidenceRadius - 24;
    const y = cy + Math.sin(angle) * evidenceRadius - 16;
    const evType = i < 3 ? 'Sympt' : i < 6 ? 'Lab' : 'Hist';
    nodes.push({
      id: `ev-${i}`,
      type: 'evidence',
      position: { x, y },
      data: { code: `E${i}`, index: i, evType },
    });
    edges.push({
      id: `patient-ev-${i}`,
      source: 'patient',
      target: `ev-${i}`,
      style: { stroke: '#9CA3AF', strokeWidth: 1, opacity: 0.3 },
      animated: false,
    });
  }

  // ALL specialist nodes at fixed angular positions (dim when idle)
  state.specialists.forEach((spec) => {
    const angle = SPEC_ANGLES[spec.name] ?? 0;
    const x = cx + Math.cos(angle) * specRadius - 55;
    const y = cy + Math.sin(angle) * specRadius - 20;
    const specId = `spec-${spec.name}`;

    nodes.push({
      id: specId,
      type: 'specialist',
      position: { x, y },
      data: { ...spec },
    });

    // Edge from patient to specialist (only when active)
    if (spec.status !== 'IDLE') {
      edges.push({
        id: `patient-${specId}`,
        source: 'patient',
        target: specId,
        style: {
          stroke: spec.status === 'THINKING' ? '#00B4A8' : '#9CA3AF',
          strokeWidth: spec.status === 'THINKING' ? 1.5 : 1,
          opacity: spec.status === 'THINKING' ? 0.6 : 0.2,
          strokeDasharray: spec.status === 'THINKING' ? '6 4' : undefined,
        },
        animated: spec.status === 'THINKING',
      });
    }

    // Hypothesis node — directly adjacent to owning specialist
    if (spec.diagnosis) {
      const hypAngle = angle;
      const hypRadius = specRadius + 70;
      const hx = cx + Math.cos(hypAngle) * hypRadius - 70;
      const hy = cy + Math.sin(hypAngle) * hypRadius - 20;
      const hypId = `hyp-${spec.name}`;

      nodes.push({
        id: hypId,
        type: 'hypothesis',
        position: { x: hx, y: hy },
        data: {
          diagnosis: spec.diagnosis,
          confidence: spec.confidence,
          specialist: spec.name,
          status: spec.status,
        },
      });

      edges.push({
        id: `${specId}-${hypId}`,
        source: specId,
        target: hypId,
        style: { stroke: '#00B4A8', strokeWidth: 2, opacity: 0.9 },
      });

      // Citation edges — hypothesis to evidence (thin, curved, gray)
      if (spec.citations) {
        spec.citations.forEach((cit) => {
          const evIdx = parseInt(cit.replace('E', ''));
          if (!isNaN(evIdx) && evIdx < evidenceCount) {
            edges.push({
              id: `${hypId}-ev-${evIdx}`,
              source: hypId,
              target: `ev-${evIdx}`,
              style: { stroke: '#9CA3AF', strokeWidth: 1, opacity: 0.4 },
              type: 'default',
            });
          }
        });
      }
    }
  });

  // Challenge nodes — positioned between the two specialists
  state.challenges.forEach((ch, i) => {
    const fromAngle = SPEC_ANGLES[ch.from] ?? 0;
    const toAngle = SPEC_ANGLES[ch.to] ?? 0;
    const midAngle = (fromAngle + toAngle) / 2;
    const midRadius = specRadius * 0.65;
    const chx = cx + Math.cos(midAngle) * midRadius - 16;
    const chy = cy + Math.sin(midAngle) * midRadius - 16;
    const chId = `challenge-${i}`;

    nodes.push({
      id: chId,
      type: 'challenge',
      position: { x: chx, y: chy },
      data: { question: ch.question, action: ch.action, from: ch.from, to: ch.to },
    });

    edges.push({
      id: `spec-${ch.from}-${chId}`,
      source: `spec-${ch.from}`,
      target: chId,
      style: { stroke: '#F59E0B', strokeWidth: 2, opacity: 0.7, strokeDasharray: !ch.action ? '5 3' : undefined },
      animated: !ch.action,
    });
    edges.push({
      id: `${chId}-spec-${ch.to}`,
      source: chId,
      target: `spec-${ch.to}`,
      style: {
        stroke: ch.action === 'DEFEND' ? '#10B981' : ch.action === 'REVISE' ? '#F59E0B' : '#F59E0B',
        strokeWidth: ch.action ? 1.5 : 2,
        opacity: 0.7,
      },
    });
  });

  // Devil's Advocate at 10:30 slot
  if (state.devilsAdvocate) {
    const advX = cx + Math.cos(ADVOCATE_ANGLE) * specRadius - 60;
    const advY = cy + Math.sin(ADVOCATE_ANGLE) * specRadius - 30;
    nodes.push({
      id: 'advocate',
      type: 'advocate',
      position: { x: advX, y: advY },
      data: { ...state.devilsAdvocate },
    });
    edges.push({
      id: 'advocate-patient',
      source: 'advocate',
      target: 'patient',
      style: { stroke: '#EF4444', strokeWidth: 1.5, opacity: 0.6, strokeDasharray: '6 3' },
    });
  }

  return { nodes, edges };
}

export function GraphView({ trace, state }: GraphViewProps) {
  const { nodes, edges } = useMemo(
    () => buildGraph(trace, state),
    [trace, state]
  );

  return (
    <div className="w-full h-full" style={{ background: '#0A0E14' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
      >
        <Background color="#ffffff06" gap={50} />
      </ReactFlow>
    </div>
  );
}
