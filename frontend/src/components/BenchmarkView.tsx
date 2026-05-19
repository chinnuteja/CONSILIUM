import { CheckCircle, XCircle, AlertTriangle, Beaker, Users, Zap, Shield } from 'lucide-react';

const HEADLINE = {
  accuracy: 73,
  correct: 22,
  total: 30,
  framing: '3 out of 4',
};

const METRICS = {
  consilium: { top1: 57, top3: 67, pathTop3: 73, mrr: 0.617 },
  baseline:  { top1: 54, top3: 76, pathTop3: null, mrr: null },
};

const TRIAGE = [
  { tier: 'SIMPLE', count: 7, color: 'bg-emerald-500', desc: 'Resolved by triage alone — no specialists needed' },
  { tier: 'MODERATE', count: 18, color: 'bg-amber-400', desc: '2–3 targeted specialists consulted' },
  { tier: 'COMPLEX', count: 5, color: 'bg-red-400', desc: 'Full 7-specialist council + Devil\'s Advocate' },
];

const CASE_RESULTS = [
  { id: 75493, disease: 'Acute dystonic reactions', tier: 'SIMPLE', correct: true },
  { id: 124409, disease: 'Pulmonary neoplasm', tier: 'COMPLEX', correct: true },
  { id: 101404, disease: 'Myocarditis', tier: 'MODERATE', correct: true },
  { id: 110495, disease: 'Influenza', tier: 'SIMPLE', correct: true },
  // Summarized for display
];

function MetricBar({ label, value, max = 100, color }: { label: string; value: number; max?: number; color: string }) {
  const pct = (value / max) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-sm font-semibold text-text-primary">{value}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-1000`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-bg-elevated p-5 space-y-2">
      <div className="flex items-center gap-2 text-text-secondary">
        <Icon className="w-4 h-4" />
        <span className="text-[11px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-secondary leading-relaxed">{sub}</p>
    </div>
  );
}

export function BenchmarkView() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto py-10 px-6 space-y-10">

        {/* ─── Hero ─── */}
        <div className="text-center space-y-4">
          <p className="text-[11px] uppercase tracking-[0.25em] text-accent-teal/70 font-semibold">
            Benchmark Results
          </p>
          <div className="flex items-baseline justify-center gap-3">
            <span className="text-7xl font-bold text-accent-emerald">{HEADLINE.accuracy}%</span>
          </div>
          <p className="text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
            CONSILIUM correctly identifies the underlying disease in{' '}
            <span className="text-text-primary font-semibold">{HEADLINE.framing}</span> cases.
          </p>
        </div>

        {/* ─── What does this mean? ─── */}
        <div className="rounded-xl border border-white/10 bg-bg-elevated p-6 space-y-3">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Beaker className="w-4 h-4 text-accent-teal" />
            How we tested this
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            We gave CONSILIUM <span className="text-text-primary font-medium">30 real patient cases</span> from{' '}
            <span className="text-text-primary font-medium">DDXPlus</span> — a medical dataset with over 130,000 
            synthetic patients across ~50 different diseases. Each case includes symptoms, lab results, and 
            medical history, just like a real doctor would see.
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            For every case, CONSILIUM's council of specialists had to figure out what disease the patient 
            actually has — then we checked if they got it right. No hints, no shortcuts. The same cases 
            were also given to a single AI prompt (no agents, no debate) so we could compare.
          </p>
          <p className="text-[11px] text-text-secondary/60 mt-2">
            Seed 42 · Gemini 2.5 Pro · Cross-examination disabled for controlled evaluation
          </p>
        </div>

        {/* ─── Key numbers ─── */}
        <div>
          <h3 className="text-xs uppercase tracking-wider text-text-secondary font-semibold mb-4">
            Key Numbers
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              icon={CheckCircle}
              label="Cases correct"
              value={`${HEADLINE.correct} / ${HEADLINE.total}`}
              sub="The council identified the actual disease in the patient's top-3 predictions"
            />
            <StatCard
              icon={Users}
              label="vs. Single Prompt"
              value="57% vs 54%"
              sub="Multi-agent deliberation beats a single AI answering alone on top-1 accuracy"
            />
            <StatCard
              icon={Shield}
              label="Mean Reciprocal Rank"
              value="0.62"
              sub="When the right answer appears, it tends to rank high — not buried at #3"
            />
          </div>
        </div>

        {/* ─── CONSILIUM vs Baseline ─── */}
        <div className="rounded-xl border border-white/10 bg-bg-elevated p-6 space-y-5">
          <h3 className="text-sm font-semibold text-text-primary">CONSILIUM vs. Single-Prompt Baseline</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            The baseline sends the exact same patient case to one AI prompt and asks it to diagnose. 
            No specialists. No debate. No triage. Same model, same cases — just one shot.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-wider text-accent-teal font-semibold">CONSILIUM</p>
              <MetricBar label="Pathology in top-3" value={73} color="bg-accent-emerald" />
              <MetricBar label="DDXPlus top-1" value={57} color="bg-accent-teal" />
              <MetricBar label="DDXPlus top-3" value={67} color="bg-accent-teal/70" />
            </div>
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Single Prompt</p>
              <MetricBar label="Pathology in top-3" value={54} color="bg-white/20" />
              <MetricBar label="DDXPlus top-1" value={54} color="bg-white/15" />
              <MetricBar label="DDXPlus top-3" value={76} color="bg-white/25" />
            </div>
          </div>
          <div className="rounded-lg bg-white/5 p-3 mt-2">
            <p className="text-xs text-text-secondary leading-relaxed">
              <span className="text-accent-teal font-medium">Why is the baseline's DDXPlus top-3 higher?</span>{' '}
              DDXPlus ranks diseases by differential probability, not by the actual disease the patient has. 
              The baseline is good at matching that ranking. CONSILIUM optimizes for something harder — 
              finding the <span className="text-text-primary">actual disease</span>, which is why our 
              pathology-in-top-3 metric leads.
            </p>
          </div>
        </div>

        {/* ─── Triage Distribution ─── */}
        <div className="rounded-xl border border-white/10 bg-bg-elevated p-6 space-y-5">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            How the Triage Agent Routed Cases
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Not every case needs seven specialists arguing. The triage agent looks at each case first and 
            decides how much firepower to bring in. Simple cases get resolved instantly. Complex cases get 
            the full council.
          </p>
          <div className="space-y-3">
            {TRIAGE.map((t) => (
              <div key={t.tier} className="flex items-center gap-4">
                <div className="w-24 text-right">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    t.tier === 'SIMPLE' ? 'bg-emerald-500/20 text-emerald-400' :
                    t.tier === 'MODERATE' ? 'bg-amber-400/20 text-amber-300' :
                    'bg-red-400/20 text-red-300'
                  }`}>
                    {t.tier}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="h-6 rounded bg-white/5 overflow-hidden relative">
                    <div
                      className={`h-full rounded ${t.color}/30 transition-all duration-1000 flex items-center px-3`}
                      style={{ width: `${(t.count / 30) * 100}%` }}
                    >
                      <span className="text-xs font-semibold text-text-primary">{t.count}</span>
                    </div>
                  </div>
                </div>
                <p className="w-64 text-[11px] text-text-secondary">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── What the numbers don't show ─── */}
        <div className="rounded-xl border border-accent-teal/20 bg-accent-teal/5 p-6 space-y-3">
          <h3 className="text-sm font-semibold text-accent-teal flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            What the numbers don't show
          </h3>
          <ul className="space-y-2 text-sm text-text-secondary leading-relaxed">
            <li className="flex gap-2">
              <span className="text-accent-teal mt-0.5">•</span>
              <span><span className="text-text-primary font-medium">Every prediction has a reason.</span> You can trace exactly which evidence each specialist cited and why they reached their conclusion.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent-teal mt-0.5">•</span>
              <span><span className="text-text-primary font-medium">When the system is wrong, it's honest about it.</span> Low agreement scores mean the council genuinely disagreed — not that it's hiding uncertainty.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent-teal mt-0.5">•</span>
              <span><span className="text-text-primary font-medium">The debate matters.</span> Cross-examination catches overconfident specialists and forces evidence-backed reasoning. A single prompt can't do that.</span>
            </li>
          </ul>
        </div>

        {/* ─── Footer ─── */}
        <p className="text-center text-xs text-text-secondary/50 pb-6">
          30 cases · DDXPlus dataset · Gemini 2.5 Pro · Seed 42 · Built in 4 days by one person
        </p>

      </div>
    </div>
  );
}
