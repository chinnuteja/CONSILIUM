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

function buildGraph(trace: DemoTrace, state: PlaybackState): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const cx = 500;
  const cy = 350;

  // Patient node at center
  nodes.push({
    id: 'patient',
    type: 'patient',
    position: { x: cx - 40, y: cy - 40 },
    data: { age: trace.age, sex: trace.sex, caseId: trace.case_id },
  });

  // Evidence nodes in inner ring
  const evidenceItems = trace.events[0]?.data as { evidence_count?: number } | undefined;
  const evidenceCount = evidenceItems?.evidence_count ?? 6;
  const evidenceRadius = 160;

  for (let i = 0; i < evidenceCount; i++) {
    const angle = (i / evidenceCount) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * evidenceRadius - 20;
    const y = cy + Math.sin(angle) * evidenceRadius - 12;
    nodes.push({
      id: `ev-${i}`,
      type: 'evidence',
      position: { x, y },
      data: { code: `E${i}`, index: i },
    });
    edges.push({
      id: `patient-ev-${i}`,
      source: 'patient',
      target: `ev-${i}`,
      style: { stroke: '#ffffff10', strokeWidth: 1 },
      animated: false,
    });
  }

  // Specialist nodes in outer ring (only active ones)
  const activeSpecs = state.specialists.filter((s) => s.status !== 'IDLE');
  const specRadius = 320;

  activeSpecs.forEach((spec, i) => {
    const angle = (i / Math.max(activeSpecs.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * specRadius - 50;
    const y = cy + Math.sin(angle) * specRadius - 24;
    const specId = `spec-${spec.name}`;

    nodes.push({
      id: specId,
      type: 'specialist',
      position: { x, y },
      data: { ...spec },
    });

    // Edge from patient to specialist
    edges.push({
      id: `patient-${specId}`,
      source: 'patient',
      target: specId,
      style: { stroke: '#00B4A830', strokeWidth: 1 },
      animated: spec.status === 'THINKING',
    });

    // Hypothesis node for posted specialists
    if (spec.diagnosis) {
      const hx = x + (x > cx ? 80 : -140);
      const hy = y + 50;
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
        style: { stroke: '#00B4A860', strokeWidth: 1.5 },
      });

      // Supports edges from hypothesis to cited evidence
      if (spec.citations) {
        spec.citations.forEach((cit) => {
          const evIdx = parseInt(cit.replace('E', ''));
          if (!isNaN(evIdx) && evIdx < evidenceCount) {
            edges.push({
              id: `${hypId}-ev-${evIdx}`,
              source: hypId,
              target: `ev-${evIdx}`,
              style: { stroke: '#00B4A820', strokeWidth: 1, strokeDasharray: '4 2' },
            });
          }
        });
      }
    }
  });

  // Challenge nodes
  state.challenges.forEach((ch, i) => {
    const fromSpec = activeSpecs.findIndex((s) => s.name === ch.from);
    const toSpec = activeSpecs.findIndex((s) => s.name === ch.to);
    if (fromSpec === -1 || toSpec === -1) return;

    const fromAngle = (fromSpec / Math.max(activeSpecs.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const toAngle = (toSpec / Math.max(activeSpecs.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const midAngle = (fromAngle + toAngle) / 2;
    const midRadius = specRadius * 0.7;
    const chx = cx + Math.cos(midAngle) * midRadius - 40;
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
      style: { stroke: '#F59E0B60', strokeWidth: 1.5 },
      animated: !ch.action,
    });
    edges.push({
      id: `${chId}-spec-${ch.to}`,
      source: chId,
      target: `spec-${ch.to}`,
      style: { stroke: '#F59E0B60', strokeWidth: 1.5 },
    });
  });

  // Devil's Advocate
  if (state.devilsAdvocate) {
    const advX = cx + specRadius + 60;
    const advY = cy - 40;
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
      style: { stroke: '#EF444460', strokeWidth: 1.5, strokeDasharray: '6 3' },
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
        minZoom={0.4}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
      >
        <Background color="#ffffff08" gap={40} />
      </ReactFlow>
    </div>
  );
}
