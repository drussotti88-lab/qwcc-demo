'use client';

import { useState, useMemo } from 'react';

// ─── DEMO DATA ───────────────────────────────────────────────────────────────

const PROJECT = {
  name: 'Riverside Commons Phase I',
  number: 'RC-2024-001',
  pm: 'Marcus Webb',
  super: 'Dana Kowalski',
  qaqc: 'J. Torres',
  signedOff: true,
  signedAt: 'Mar 3, 2025',
};

const TODAY = new Date('2025-06-09');
function d(n: number) { const dt = new Date(TODAY); dt.setDate(dt.getDate() + n); return dt; }
function fmt(dt: Date) { return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function fmtFull(dt: Date) { return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }

// Schedule scopes
const SCOPES = [
  { div: '03', name: 'Concrete — Elevated Slabs',      start: d(-60), end: d(5),   pct: 88, sub: 'Ironclad Concrete' },
  { div: '03', name: 'Gypcrete',                        start: d(-10), end: d(22),  pct: 30, sub: 'Level-Rite Finishes' },
  { div: '04', name: 'Brick Veneer',                    start: d(-20), end: d(18),  pct: 45, sub: 'Summit Masonry' },
  { div: '05', name: 'Misc Steel & Railings',           start: d(-15), end: d(30),  pct: 20, sub: 'Apex Steel' },
  { div: '07', name: 'TPO Roofing',                     start: d(-8),  end: d(14),  pct: 40, sub: 'Premier Roofing' },
  { div: '07', name: 'Air Barrier',                     start: d(-12), end: d(8),   pct: 70, sub: 'Enviro-Seal' },
  { div: '07', name: 'Firestopping',                    start: d(5),   end: d(45),  pct: 0,  sub: 'FireStop Pro' },
  { div: '08', name: 'Storefront & Curtainwall',        start: d(-25), end: d(10),  pct: 65, sub: 'ClearView Glazing' },
  { div: '08', name: 'Flush Wood Doors',                start: d(8),   end: d(35),  pct: 0,  sub: 'Door Systems Inc.' },
  { div: '09', name: 'Drywall & Metal Framing',         start: d(-35), end: d(12),  pct: 75, sub: 'Apex Framing & Drywall' },
  { div: '09', name: 'Tiling',                          start: d(-5),  end: d(25),  pct: 15, sub: 'Tile Masters' },
  { div: '09', name: 'Painting — Interior',             start: d(10),  end: d(50),  pct: 0,  sub: 'ColorPro Painting' },
  { div: '09', name: 'Resilient Flooring',              start: d(20),  end: d(55),  pct: 0,  sub: 'Floor Craft' },
  { div: '21', name: 'Fire Protection',                 start: d(-45), end: d(20),  pct: 60, sub: 'Allied Fire Systems' },
  { div: '22', name: 'Plumbing Trim-Out',               start: d(15),  end: d(45),  pct: 0,  sub: 'Summit MEP' },
  { div: '23', name: 'HVAC Equipment & Controls',       start: d(5),   end: d(40),  pct: 5,  sub: 'Summit MEP' },
  { div: '26', name: 'Electrical Devices & Fixtures',   start: d(12),  end: d(48),  pct: 0,  sub: 'Volt Electric' },
  { div: '32', name: 'Site Concrete & Paving',          start: d(25),  end: d(70),  pct: 0,  sub: 'Ironclad Concrete' },
];

const WARNING_DAYS = 14;

function classifyScope(s: typeof SCOPES[0]) {
  const daysToEnd = Math.round((s.end.getTime() - TODAY.getTime()) / 86400000);
  if (s.pct === 100) return 'complete';
  if (s.start > TODAY) return 'upcoming';
  if (daysToEnd < 0 && s.pct < 100) return 'overdue';
  if (daysToEnd <= WARNING_DAYS) return 'finishing';
  return 'active';
}

const SCOPE_COLORS: Record<string, { color: string; bg: string; border: string; label: string }> = {
  complete:  { color: '#10b981', bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.4)',  label: 'Complete' },
  active:    { color: '#22d3ee', bg: 'rgba(34,211,238,0.12)',  border: 'rgba(34,211,238,0.3)',  label: 'In Progress' },
  finishing: { color: '#f59e0b', bg: 'rgba(245,158,11,0.18)',  border: 'rgba(245,158,11,0.45)', label: 'Finishing Soon' },
  overdue:   { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.4)',   label: 'Overdue' },
  upcoming:  { color: '#64748b', bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.25)', label: 'Not Started' },
};

// DFW items
type GapLevel = 'ok' | 'pending' | 'gap' | 'manual';
interface DfwItem {
  csi: string;
  div: string;
  name: string;
  sub: string;
  applicability: 'applicable' | 'na' | 'watch';
  submittalStatus: 'approved' | 'under_review' | 'not_submitted' | 'na';
  submittalDate: string | null;
  leadTime: string | null;
  materialConfirmed: boolean | null;
  materialDate: string | null;
  mockupRequired: boolean;
  mockupStatus: 'complete' | 'scheduled' | 'not_scheduled' | 'na';
  subStartProjected: string | null;
  subStartActual: string | null;
  premobHeld: boolean | null;
  firstWorkDate: string | null;
  inspectionLinked: boolean;
  closeoutStatus: 'not_started' | 'in_progress' | 'complete' | 'na';
  notes: string | null;
  source: 'procore' | 'manual' | 'gap';
}

const DFW_ITEMS: DfwItem[] = [
  // Div 03
  { csi: '03 3000-1', div: '03', name: 'Concrete Mix Designs', sub: 'Ironclad Concrete', applicability: 'applicable', submittalStatus: 'approved', submittalDate: 'Feb 14', leadTime: '3 wks', materialConfirmed: true, materialDate: 'Mar 2', mockupRequired: false, mockupStatus: 'na', subStartProjected: 'Mar 10', subStartActual: 'Mar 12', premobHeld: true, firstWorkDate: 'Mar 12', inspectionLinked: true, closeoutStatus: 'in_progress', notes: null, source: 'procore' },
  { csi: '03 3000-6', div: '03', name: 'Reinforcing Steel SD (SOG)', sub: 'Ironclad Concrete', applicability: 'applicable', submittalStatus: 'approved', submittalDate: 'Jan 28', leadTime: '4 wks', materialConfirmed: true, materialDate: 'Feb 20', mockupRequired: false, mockupStatus: 'na', subStartProjected: 'Feb 24', subStartActual: 'Feb 26', premobHeld: true, firstWorkDate: 'Feb 26', inspectionLinked: true, closeoutStatus: 'in_progress', notes: null, source: 'procore' },
  { csi: '03 5413', div: '03', name: 'Gypcrete PD & Mix Design', sub: 'Level-Rite Finishes', applicability: 'applicable', submittalStatus: 'approved', submittalDate: 'Apr 10', leadTime: '2 wks', materialConfirmed: null, materialDate: null, mockupRequired: false, mockupStatus: 'na', subStartProjected: 'May 30', subStartActual: 'Jun 1', premobHeld: false, firstWorkDate: 'Jun 1', inspectionLinked: false, closeoutStatus: 'not_started', notes: 'PreMob not yet scheduled', source: 'procore' },
  // Div 07
  { csi: '07 5423', div: '07', name: 'TPO Roof System PD & SD', sub: 'Premier Roofing', applicability: 'applicable', submittalStatus: 'approved', submittalDate: 'Mar 20', leadTime: '6 wks', materialConfirmed: true, materialDate: 'May 1', mockupRequired: true, mockupStatus: 'complete', subStartProjected: 'Jun 1', subStartActual: 'Jun 2', premobHeld: true, firstWorkDate: 'Jun 2', inspectionLinked: true, closeoutStatus: 'not_started', notes: null, source: 'procore' },
  { csi: '07 2726', div: '07', name: 'Air Barrier PD & System Details', sub: 'Enviro-Seal Systems', applicability: 'applicable', submittalStatus: 'approved', submittalDate: 'Mar 5', leadTime: '3 wks', materialConfirmed: true, materialDate: 'Mar 28', mockupRequired: true, mockupStatus: 'complete', subStartProjected: 'May 28', subStartActual: 'May 28', premobHeld: true, firstWorkDate: 'May 28', inspectionLinked: true, closeoutStatus: 'not_started', notes: null, source: 'procore' },
  { csi: '07 8413', div: '07', name: 'Penetration Firestopping PD', sub: 'FireStop Pro', applicability: 'applicable', submittalStatus: 'under_review', submittalDate: null, leadTime: null, materialConfirmed: null, materialDate: null, mockupRequired: false, mockupStatus: 'na', subStartProjected: 'Jun 14', subStartActual: null, premobHeld: null, firstWorkDate: null, inspectionLinked: false, closeoutStatus: 'not_started', notes: 'Submittal submitted May 22 — 18 days under review', source: 'gap' },
  { csi: '07 8443', div: '07', name: 'Joint Firestopping PD', sub: 'FireStop Pro', applicability: 'applicable', submittalStatus: 'not_submitted', submittalDate: null, leadTime: null, materialConfirmed: null, materialDate: null, mockupRequired: false, mockupStatus: 'na', subStartProjected: 'Jun 14', subStartActual: null, premobHeld: null, firstWorkDate: null, inspectionLinked: false, closeoutStatus: 'not_started', notes: null, source: 'gap' },
  // Div 08
  { csi: '08 4113-1', div: '08', name: 'Aluminum-Framed Storefront PD', sub: 'ClearView Glazing', applicability: 'applicable', submittalStatus: 'approved', submittalDate: 'Feb 28', leadTime: '10 wks', materialConfirmed: true, materialDate: 'May 10', mockupRequired: true, mockupStatus: 'complete', subStartProjected: 'May 15', subStartActual: 'May 15', premobHeld: true, firstWorkDate: 'May 15', inspectionLinked: true, closeoutStatus: 'not_started', notes: null, source: 'procore' },
  { csi: '08 1416-1', div: '08', name: 'Flush Wood Doors PD, Schedule & SD', sub: 'Door Systems Inc.', applicability: 'applicable', submittalStatus: 'approved', submittalDate: 'Apr 2', leadTime: '8 wks', materialConfirmed: null, materialDate: null, mockupRequired: false, mockupStatus: 'na', subStartProjected: 'Jun 17', subStartActual: null, premobHeld: null, firstWorkDate: null, inspectionLinked: false, closeoutStatus: 'not_started', notes: 'Lead time ends Jun 16 — confirm material delivery', source: 'gap' },
  { csi: '08 7100A', div: '08', name: 'Door Hardware Schedule & PD', sub: 'Door Systems Inc.', applicability: 'applicable', submittalStatus: 'under_review', submittalDate: null, leadTime: null, materialConfirmed: null, materialDate: null, mockupRequired: false, mockupStatus: 'na', subStartProjected: 'Jun 17', subStartActual: null, premobHeld: null, firstWorkDate: null, inspectionLinked: false, closeoutStatus: 'not_started', notes: null, source: 'gap' },
  // Div 09
  { csi: '09 2900', div: '09', name: 'Gypsum Board PD', sub: 'Apex Framing & Drywall', applicability: 'applicable', submittalStatus: 'approved', submittalDate: 'Feb 10', leadTime: '3 wks', materialConfirmed: true, materialDate: 'Mar 3', mockupRequired: false, mockupStatus: 'na', subStartProjected: 'Mar 5', subStartActual: 'Mar 5', premobHeld: true, firstWorkDate: 'Mar 5', inspectionLinked: true, closeoutStatus: 'not_started', notes: null, source: 'procore' },
  { csi: '09 3000-1', div: '09', name: 'Tiling PD', sub: 'Tile Masters', applicability: 'applicable', submittalStatus: 'approved', submittalDate: 'Apr 18', leadTime: '4 wks', materialConfirmed: null, materialDate: null, mockupRequired: true, mockupStatus: 'not_scheduled', subStartProjected: 'Jun 4', subStartActual: 'Jun 4', premobHeld: false, firstWorkDate: 'Jun 4', inspectionLinked: false, closeoutStatus: 'not_started', notes: 'Mockup not scheduled. Material delivery unconfirmed.', source: 'gap' },
  { csi: '09 6400-1', div: '09', name: 'Wood Flooring PD & SD', sub: 'Floor Craft', applicability: 'applicable', submittalStatus: 'not_submitted', submittalDate: null, leadTime: null, materialConfirmed: null, materialDate: null, mockupRequired: true, mockupStatus: 'not_scheduled', subStartProjected: 'Jun 29', subStartActual: null, premobHeld: null, firstWorkDate: null, inspectionLinked: false, closeoutStatus: 'not_started', notes: null, source: 'gap' },
  { csi: '09 9123-1', div: '09', name: 'Interior Painting PD', sub: 'ColorPro Painting', applicability: 'applicable', submittalStatus: 'approved', submittalDate: 'May 1', leadTime: '2 wks', materialConfirmed: null, materialDate: null, mockupRequired: false, mockupStatus: 'na', subStartProjected: 'Jun 19', subStartActual: null, premobHeld: null, firstWorkDate: null, inspectionLinked: false, closeoutStatus: 'not_started', notes: null, source: 'procore' },
  // Div 21
  { csi: '21 0100-1', div: '21', name: 'Fire Protection PD', sub: 'Allied Fire Systems', applicability: 'applicable', submittalStatus: 'approved', submittalDate: 'Jan 15', leadTime: '6 wks', materialConfirmed: true, materialDate: 'Feb 26', mockupRequired: false, mockupStatus: 'na', subStartProjected: 'Feb 28', subStartActual: 'Mar 1', premobHeld: true, firstWorkDate: 'Mar 1', inspectionLinked: true, closeoutStatus: 'not_started', notes: null, source: 'procore' },
  // Div 22
  { csi: '22 0100-1', div: '22', name: 'Plumbing General Provisions PD', sub: 'Summit MEP', applicability: 'applicable', submittalStatus: 'approved', submittalDate: 'Jan 10', leadTime: '5 wks', materialConfirmed: true, materialDate: 'Feb 14', mockupRequired: false, mockupStatus: 'na', subStartProjected: 'Feb 18', subStartActual: 'Feb 18', premobHeld: true, firstWorkDate: 'Feb 18', inspectionLinked: true, closeoutStatus: 'not_started', notes: null, source: 'procore' },
  { csi: '22 4213', div: '22', name: 'Plumbing Fixtures PD', sub: 'Summit MEP', applicability: 'applicable', submittalStatus: 'approved', submittalDate: 'Mar 12', leadTime: '8 wks', materialConfirmed: null, materialDate: null, mockupRequired: false, mockupStatus: 'na', subStartProjected: 'Jun 24', subStartActual: null, premobHeld: null, firstWorkDate: null, inspectionLinked: false, closeoutStatus: 'not_started', notes: 'Lead time expires Jun 16 — confirm on-site delivery', source: 'gap' },
  // Div 26
  { csi: '26 5100', div: '26', name: 'Interior Lighting & Lamps PD', sub: 'Volt Electric', applicability: 'applicable', submittalStatus: 'under_review', submittalDate: null, leadTime: null, materialConfirmed: null, materialDate: null, mockupRequired: false, mockupStatus: 'na', subStartProjected: 'Jun 21', subStartActual: null, premobHeld: null, firstWorkDate: null, inspectionLinked: false, closeoutStatus: 'not_started', notes: null, source: 'gap' },
  { csi: '26 2726', div: '26', name: 'Wiring Devices PD', sub: 'Volt Electric', applicability: 'applicable', submittalStatus: 'approved', submittalDate: 'Feb 20', leadTime: '4 wks', materialConfirmed: true, materialDate: 'Mar 18', mockupRequired: false, mockupStatus: 'na', subStartProjected: 'Mar 22', subStartActual: 'Mar 24', premobHeld: true, firstWorkDate: 'Mar 24', inspectionLinked: true, closeoutStatus: 'not_started', notes: null, source: 'procore' },
];

const DIV_LABELS: Record<string, string> = {
  '03': 'Division 03 — Concrete',
  '07': 'Division 07 — Thermal & Moisture Protection',
  '08': 'Division 08 — Doors & Windows',
  '09': 'Division 09 — Finishes',
  '21': 'Division 21 — Fire Protection',
  '22': 'Division 22 — Plumbing',
  '26': 'Division 26 — Electrical',
};

// Gap analysis
function computeGaps(item: DfwItem): { field: string; question: string }[] {
  const gaps: { field: string; question: string }[] = [];
  if (item.applicability !== 'applicable') return gaps;
  if (item.submittalStatus === 'not_submitted') gaps.push({ field: 'Submittal', question: "Submittal hasn't been submitted — is the sub aware? What's the hold-up?" });
  if (item.submittalStatus === 'under_review') gaps.push({ field: 'Submittal Review', question: 'Submittal has been under review — has the design team been followed up with?' });
  if (item.submittalStatus === 'approved' && !item.materialConfirmed) gaps.push({ field: 'Material Confirmation', question: 'Submittal approved but no material delivery confirmed on site within 24 hrs. What is the lead time status?' });
  if (item.mockupRequired && item.mockupStatus === 'not_scheduled') gaps.push({ field: 'Mockup', question: "Mockup is required but hasn't been scheduled. When is the sub planning to execute this?" });
  if (!item.premobHeld && item.subStartActual) gaps.push({ field: 'PreMob Meeting', question: 'Sub has mobilized but no PreMob meeting recorded. Was it held? Who attended?' });
  if (!item.inspectionLinked && item.subStartActual) gaps.push({ field: 'Inspection Checklist', question: 'No inspection checklist is linked to this scope. Is a template ready?' });
  return gaps;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

type TabType = 'timeline' | 'dfw' | 'meeting';

export default function DfwPage() {
  const [activeTab, setActiveTab] = useState<TabType>('timeline');
  const [selectedItem, setSelectedItem] = useState<DfwItem | null>(null);
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [hoveredScope, setHoveredScope] = useState<number | null>(null);
  const [manualNotes, setManualNotes] = useState<Record<string, string>>({});
  const [manualPremob, setManualPremob] = useState<Record<string, boolean>>({});

  const annotatedScopes = useMemo(() =>
    SCOPES.map(s => ({ ...s, status: classifyScope(s) })), []);

  const filteredScopes = useMemo(() =>
    scopeFilter === 'all' ? annotatedScopes : annotatedScopes.filter(s => s.status === scopeFilter),
    [scopeFilter, annotatedScopes]);

  const scopeCounts = useMemo(() => ({
    all: annotatedScopes.length,
    active: annotatedScopes.filter(s => s.status === 'active').length,
    finishing: annotatedScopes.filter(s => s.status === 'finishing').length,
    overdue: annotatedScopes.filter(s => s.status === 'overdue').length,
    upcoming: annotatedScopes.filter(s => s.status === 'upcoming').length,
    complete: annotatedScopes.filter(s => s.status === 'complete').length,
  }), [annotatedScopes]);

  // Timeline math
  const allDates = SCOPES.flatMap(s => [s.start, s.end]);
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())) - 15 * 86400000);
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())) + 15 * 86400000);
  const totalMs = maxDate.getTime() - minDate.getTime();
  const todayX = ((TODAY.getTime() - minDate.getTime()) / totalMs) * 100;
  const warningX = (((TODAY.getTime() + WARNING_DAYS * 86400000) - minDate.getTime()) / totalMs) * 100;

  function dateToX(dt: Date) { return ((dt.getTime() - minDate.getTime()) / totalMs) * 100; }

  // Tick marks
  const ticks: Date[] = [];
  const cur = new Date(minDate); cur.setDate(1);
  while (cur <= maxDate) { ticks.push(new Date(cur)); cur.setMonth(cur.getMonth() + 1); }

  // DFW items
  const applicableItems = DFW_ITEMS.filter(i => i.applicability === 'applicable');
  const gapItems = applicableItems.filter(i => computeGaps(i).length > 0);
  const divs = [...new Set(applicableItems.map(i => i.div))];

  const totalGaps = applicableItems.reduce((s, i) => s + computeGaps(i).length, 0);
  const fullyGreen = applicableItems.filter(i => computeGaps(i).length === 0).length;

  return (
    <div className="p-6 space-y-5 animate-fade-in">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display text-3xl text-white tracking-wide">DFW LOG</h1>
            <span className="font-mono text-xs text-white/30 tracking-widest border border-white/10 rounded px-2 py-0.5">DEMO</span>
          </div>
          <p className="text-white/40 text-sm">Definable Features of Work · {PROJECT.name}</p>
        </div>

        {/* Sign-off badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-400/30 bg-emerald-400/5">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <div className="text-right">
            <p className="font-mono text-xs text-emerald-400">SCOPE SIGNED OFF</p>
            <p className="font-mono text-xs text-white/30">{PROJECT.qaqc} + {PROJECT.pm} · {PROJECT.signedAt}</p>
          </div>
        </div>
      </div>

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'APPLICABLE ITEMS', value: applicableItems.length, color: '#22d3ee' },
          { label: 'FULLY CURRENT',    value: fullyGreen,              color: '#10b981' },
          { label: 'ITEMS WITH GAPS',  value: gapItems.length,         color: '#ef4444' },
          { label: 'TOTAL GAP FLAGS',  value: totalGaps,               color: '#f59e0b' },
          { label: 'FINISHING SOON',   value: scopeCounts.finishing,   color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="glass rounded-xl border border-white/10 p-4">
            <p className="font-mono text-xs text-white/30 tracking-wider mb-1">{s.label}</p>
            <p className="font-display text-3xl" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tab Nav ── */}
      <div className="flex gap-1 border-b border-white/10">
        {([
          { id: 'timeline', label: '01 · SCHEDULE TIMELINE' },
          { id: 'dfw',      label: '02 · DFW TABLE' },
          { id: 'meeting',  label: `03 · MEETING VIEW  ${gapItems.length > 0 ? `(${gapItems.length} items)` : ''}` },
        ] as { id: TabType; label: string }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-5 py-2.5 font-mono text-xs tracking-widest transition-all relative"
            style={{
              color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.35)',
              borderBottom: activeTab === tab.id ? '2px solid #f59e0b' : '2px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          PANEL 1: SCHEDULE TIMELINE
      ══════════════════════════════════════════════════ */}
      {activeTab === 'timeline' && (
        <div className="space-y-4 animate-fade-in">

          {/* Filter strip */}
          <div className="flex gap-2 flex-wrap items-center">
            {(Object.entries(SCOPE_COLORS) as [string, typeof SCOPE_COLORS[string]][]).concat([['all', { color: 'rgba(255,255,255,0.4)', bg: '', border: '', label: 'All Scopes' }]]).reverse().map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setScopeFilter(key)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md font-mono text-xs transition-all"
                style={{
                  border: `1px solid ${scopeFilter === key ? cfg.color : 'rgba(255,255,255,0.1)'}`,
                  background: scopeFilter === key ? `${cfg.color}15` : 'transparent',
                  color: scopeFilter === key ? cfg.color : 'rgba(255,255,255,0.35)',
                }}
              >
                {key !== 'all' && <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />}
                {cfg.label} <span className="opacity-50">({scopeCounts[key as keyof typeof scopeCounts] ?? filteredScopes.length})</span>
              </button>
            ))}
          </div>

          {/* Gantt */}
          <div className="glass rounded-xl border border-white/10 overflow-hidden">
            {/* Header row */}
            <div className="grid border-b border-white/8 bg-white/3" style={{ gridTemplateColumns: '240px 1fr' }}>
              <div className="px-4 py-2 font-mono text-xs text-white/25 tracking-widest">SCOPE / SUBCONTRACTOR</div>
              <div className="relative h-8 pr-4">
                {ticks.map((tick, i) => {
                  const x = dateToX(tick);
                  if (x < 0 || x > 100) return null;
                  return (
                    <span key={i} className="absolute font-mono text-white/20 select-none"
                      style={{ left: `${x}%`, top: '50%', transform: 'translate(-50%,-50%)', fontSize: 9, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                      {tick.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Scope rows */}
            {filteredScopes.map((scope, i) => {
              const st = SCOPE_COLORS[scope.status];
              const sx = Math.max(0, dateToX(scope.start));
              const ex = Math.min(100, dateToX(scope.end));
              const bw = Math.max(0.8, ex - sx);
              const daysLeft = Math.round((scope.end.getTime() - TODAY.getTime()) / 86400000);
              const isHov = hoveredScope === i;

              return (
                <div key={i}
                  onMouseEnter={() => setHoveredScope(i)}
                  onMouseLeave={() => setHoveredScope(null)}
                  className="grid border-b border-white/4 transition-colors"
                  style={{ gridTemplateColumns: '240px 1fr', background: isHov ? 'rgba(255,255,255,0.03)' : 'transparent', minHeight: 38, alignItems: 'center' }}
                >
                  <div className="px-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: st.color, boxShadow: scope.status === 'finishing' ? `0 0 5px ${st.color}` : 'none' }} />
                    <div>
                      <p className="text-xs leading-tight" style={{ color: isHov ? 'white' : 'rgba(255,255,255,0.7)' }}>{scope.name}</p>
                      <p className="font-mono text-white/25 leading-tight" style={{ fontSize: 9 }}>{scope.sub}</p>
                    </div>
                  </div>
                  <div className="relative pr-4" style={{ height: 38 }}>
                    {/* Warning zone */}
                    <div className="absolute top-0 bottom-0" style={{ left: `${todayX}%`, width: `${warningX - todayX}%`, background: 'rgba(245,158,11,0.04)', borderLeft: '1px solid rgba(245,158,11,0.25)' }} />
                    {/* Today line */}
                    <div className="absolute top-1 bottom-1 z-10" style={{ left: `${todayX}%`, width: 1.5, background: '#f59e0b', opacity: 0.9 }} />
                    {/* Bar */}
                    <div className="absolute flex items-center" style={{ left: `${sx}%`, width: `${bw}%`, height: isHov ? 20 : 16, top: '50%', transform: 'translateY(-50%)', borderRadius: 4, background: st.bg, border: `1px solid ${st.border}`, overflow: 'hidden', zIndex: 2, transition: 'height 0.1s' }}>
                      {scope.pct > 0 && <div className="absolute left-0 top-0 bottom-0 rounded-l" style={{ width: `${scope.pct}%`, background: st.color, opacity: 0.3 }} />}
                      {bw > 8 && <span className="absolute left-1.5 font-mono z-10" style={{ fontSize: 9, color: st.color }}>{scope.pct}%</span>}
                    </div>
                    {/* Day label */}
                    {(scope.status === 'finishing' || scope.status === 'overdue') && (
                      <span className="absolute font-mono" style={{ left: `${ex + 0.8}%`, top: '50%', transform: 'translateY(-50%)', fontSize: 9, color: st.color, whiteSpace: 'nowrap' }}>
                        {scope.status === 'finishing' ? `${daysLeft}d left` : `${Math.abs(daysLeft)}d late`}
                      </span>
                    )}
                    {/* Tooltip */}
                    {isHov && (
                      <div className="absolute z-20 rounded-lg border p-3 min-w-44 pointer-events-none shadow-xl"
                        style={{ left: `${Math.min(sx + bw / 2, 65)}%`, top: 'calc(100% + 4px)', transform: 'translateX(-50%)', background: 'hsl(222,18%,12%)', borderColor: st.border }}>
                        <p className="font-display text-sm mb-2 tracking-wide" style={{ color: st.color }}>{scope.name}</p>
                        {[['Sub', scope.sub], ['Start', fmt(scope.start)], ['Finish', fmt(scope.end)], ['Progress', `${scope.pct}%`],
                          scope.status === 'finishing' ? ['⚠ Days left', `${daysLeft}d`] : scope.status === 'overdue' ? ['⚠ Days late', `${Math.abs(daysLeft)}d`] : null,
                        ].filter(Boolean).map(([k, v]) => (
                          <div key={k as string} className="flex justify-between gap-4">
                            <span className="font-mono text-white/30" style={{ fontSize: 10 }}>{k}</span>
                            <span className="font-mono text-white/70" style={{ fontSize: 10 }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-5 flex-wrap px-1">
            {Object.entries(SCOPE_COLORS).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-6 h-1.5 rounded" style={{ background: cfg.color }} />
                <span className="font-mono text-white/30 tracking-widest" style={{ fontSize: 9 }}>{cfg.label.toUpperCase()}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 ml-2">
              <div className="w-px h-3" style={{ background: '#f59e0b' }} />
              <span className="font-mono text-white/30 tracking-widest" style={{ fontSize: 9 }}>TODAY · {fmt(TODAY)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          PANEL 2: DFW TABLE
      ══════════════════════════════════════════════════ */}
      {activeTab === 'dfw' && (
        <div className="animate-fade-in flex gap-4">

          {/* Main table */}
          <div className="flex-1 min-w-0 space-y-3">
            {divs.map(div => {
              const items = applicableItems.filter(i => i.div === div);
              return (
                <div key={div} className="glass rounded-xl border border-white/10 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-white/8 bg-white/3 flex items-center justify-between">
                    <p className="font-display text-sm text-white/50 tracking-widest">{DIV_LABELS[div] || `Division ${div}`}</p>
                    <div className="flex gap-2">
                      <span className="font-mono text-xs text-white/25">{items.length} items</span>
                      {items.some(i => computeGaps(i).length > 0) && (
                        <span className="font-mono text-xs text-red-400">{items.filter(i => computeGaps(i).length > 0).length} gaps</span>
                      )}
                    </div>
                  </div>

                  {/* Column headers */}
                  <div className="grid text-xs border-b border-white/8 px-4 py-1.5" style={{ gridTemplateColumns: '1fr 100px 80px 90px 80px 80px 80px 80px 48px' }}>
                    {['Scope Item', 'Submittal', 'Material', 'Mockup', 'Sub Start', 'PreMob', 'Inspection', 'Closeout', 'Gaps'].map(h => (
                      <span key={h} className="font-mono text-white/20 tracking-wider" style={{ fontSize: 9 }}>{h}</span>
                    ))}
                  </div>

                  {items.map((item, i) => {
                    const gaps = computeGaps(item);
                    const isSelected = selectedItem?.csi === item.csi;

                    return (
                      <div key={item.csi}
                        onClick={() => setSelectedItem(isSelected ? null : item)}
                        className="grid px-4 py-2.5 border-b border-white/4 last:border-0 cursor-pointer transition-colors hover:bg-white/4 items-center"
                        style={{
                          gridTemplateColumns: '1fr 100px 80px 90px 80px 80px 80px 80px 48px',
                          background: isSelected ? 'rgba(245,158,11,0.06)' : undefined,
                          borderLeft: isSelected ? '2px solid rgba(245,158,11,0.5)' : '2px solid transparent',
                        }}
                      >
                        {/* Name */}
                        <div>
                          <p className="text-xs text-white/75 leading-tight">{item.name}</p>
                          <p className="font-mono text-white/25 leading-tight" style={{ fontSize: 9 }}>{item.csi} · {item.sub}</p>
                        </div>

                        {/* Submittal */}
                        <FieldChip status={item.submittalStatus === 'approved' ? 'ok' : item.submittalStatus === 'under_review' ? 'pending' : item.submittalStatus === 'na' ? 'na' : 'gap'}
                          label={item.submittalStatus === 'approved' ? (item.submittalDate || 'Approved') : item.submittalStatus === 'under_review' ? 'In Review' : item.submittalStatus === 'na' ? 'N/A' : 'Not Submitted'} />

                        {/* Material */}
                        <FieldChip status={item.materialConfirmed === true ? 'ok' : item.materialConfirmed === null && item.submittalStatus === 'approved' ? 'gap' : 'pending'}
                          label={item.materialConfirmed === true ? (item.materialDate || '✓') : item.materialConfirmed === null ? '—' : 'No'} />

                        {/* Mockup */}
                        <FieldChip status={!item.mockupRequired ? 'na' : item.mockupStatus === 'complete' ? 'ok' : item.mockupStatus === 'scheduled' ? 'pending' : 'gap'}
                          label={!item.mockupRequired ? 'N/A' : item.mockupStatus === 'complete' ? '✓ Done' : item.mockupStatus === 'scheduled' ? 'Sched.' : 'Not Sched.'} />

                        {/* Sub Start */}
                        <FieldChip status={item.subStartActual ? 'ok' : item.subStartProjected ? 'pending' : 'gap'}
                          label={item.subStartActual || item.subStartProjected || '—'} />

                        {/* PreMob */}
                        <FieldChip status={(manualPremob[item.csi] || item.premobHeld) === true ? 'ok' : item.premobHeld === false && item.subStartActual ? 'gap' : 'pending'}
                          label={(manualPremob[item.csi] || item.premobHeld) ? '✓ Held' : '—'} />

                        {/* Inspection */}
                        <FieldChip status={item.inspectionLinked ? 'ok' : item.subStartActual ? 'gap' : 'pending'}
                          label={item.inspectionLinked ? '✓ Linked' : '—'} />

                        {/* Closeout */}
                        <FieldChip status={item.closeoutStatus === 'complete' ? 'ok' : item.closeoutStatus === 'in_progress' ? 'pending' : item.closeoutStatus === 'na' ? 'na' : 'pending'}
                          label={item.closeoutStatus === 'complete' ? '✓' : item.closeoutStatus === 'in_progress' ? 'In Prog.' : item.closeoutStatus === 'na' ? 'N/A' : 'Not Started'} />

                        {/* Gap count */}
                        <div className="flex justify-center">
                          {gaps.length === 0
                            ? <span className="text-emerald-400/60" style={{ fontSize: 11 }}>✓</span>
                            : <span className="font-mono text-xs font-bold text-red-400 px-1.5 py-0.5 rounded bg-red-400/10 border border-red-400/20">{gaps.length}</span>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* ── Side Panel ── */}
          {selectedItem && (
            <div className="w-72 shrink-0 animate-fade-in">
              <div className="glass rounded-xl border border-amber-400/20 overflow-hidden sticky top-6">
                {/* Header */}
                <div className="px-4 py-3 border-b border-white/8 bg-amber-400/5 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-sm text-white tracking-wide leading-tight">{selectedItem.name}</p>
                    <p className="font-mono text-white/35 mt-0.5" style={{ fontSize: 9 }}>{selectedItem.csi} · {selectedItem.sub}</p>
                  </div>
                  <button onClick={() => setSelectedItem(null)} className="text-white/25 hover:text-white/60 transition-colors text-lg leading-none mt-0.5">✕</button>
                </div>

                {/* Auto fields */}
                <div className="px-4 py-3 border-b border-white/8 space-y-2">
                  <p className="font-mono text-white/25 tracking-widest mb-2" style={{ fontSize: 9 }}>AUTO — PROCORE</p>
                  {[
                    ['Submittal Status', selectedItem.submittalStatus.replace('_', ' ')],
                    ['Approved Date', selectedItem.submittalDate || '—'],
                    ['Lead Time', selectedItem.leadTime || '—'],
                    ['Material Confirmed', selectedItem.materialConfirmed === true ? '✓ Yes' : selectedItem.materialConfirmed === false ? '✗ No' : '—'],
                    ['Material Date', selectedItem.materialDate || '—'],
                    ['Mockup', selectedItem.mockupRequired ? selectedItem.mockupStatus.replace('_', ' ') : 'Not Required'],
                    ['Sub Start (Proj)', selectedItem.subStartProjected || '—'],
                    ['Sub Start (Actual)', selectedItem.subStartActual || '—'],
                    ['First Work in Place', selectedItem.firstWorkDate || '—'],
                    ['Inspection Linked', selectedItem.inspectionLinked ? '✓ Yes' : '—'],
                    ['Closeout', selectedItem.closeoutStatus.replace('_', ' ')],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-2">
                      <span className="font-mono text-white/30 leading-tight" style={{ fontSize: 10 }}>{k}</span>
                      <span className="font-mono text-white/65 text-right leading-tight" style={{ fontSize: 10 }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Manual fields */}
                <div className="px-4 py-3 border-b border-white/8 space-y-3">
                  <p className="font-mono text-white/25 tracking-widest" style={{ fontSize: 9 }}>MANUAL ENTRY</p>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-mono text-white/50" style={{ fontSize: 11 }}>PreMob Meeting Held</span>
                    <div className="relative">
                      <input type="checkbox"
                        checked={manualPremob[selectedItem.csi] ?? selectedItem.premobHeld ?? false}
                        onChange={e => setManualPremob(p => ({ ...p, [selectedItem.csi]: e.target.checked }))}
                        className="sr-only peer" />
                      <div className="w-8 h-4 rounded-full bg-white/10 peer-checked:bg-amber-400/60 transition-colors cursor-pointer" />
                      <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                    </div>
                  </label>
                  <div>
                    <label className="font-mono text-white/30 block mb-1" style={{ fontSize: 10 }}>Notes / Action Items</label>
                    <textarea
                      rows={3}
                      value={manualNotes[selectedItem.csi] ?? selectedItem.notes ?? ''}
                      onChange={e => setManualNotes(p => ({ ...p, [selectedItem.csi]: e.target.value }))}
                      placeholder="Add notes..."
                      className="w-full px-2 py-1.5 rounded bg-white/5 border border-white/10 text-white/70 resize-none focus:outline-none focus:border-amber-400/40 transition-colors"
                      style={{ fontSize: 11, fontFamily: 'monospace' }}
                    />
                  </div>
                </div>

                {/* Gap flags */}
                {computeGaps(selectedItem).length > 0 && (
                  <div className="px-4 py-3 space-y-2">
                    <p className="font-mono text-red-400/60 tracking-widest" style={{ fontSize: 9 }}>GAP FLAGS</p>
                    {computeGaps(selectedItem).map((g, i) => (
                      <div key={i} className="rounded-lg border border-red-400/15 bg-red-400/5 p-2.5 space-y-1">
                        <p className="font-mono text-red-400 font-medium" style={{ fontSize: 10 }}>{g.field}</p>
                        <p className="text-white/40 leading-snug" style={{ fontSize: 10 }}>{g.question}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* History */}
                <div className="px-4 py-3 border-t border-white/8 space-y-2">
                  <p className="font-mono text-white/20 tracking-widest" style={{ fontSize: 9 }}>HISTORY</p>
                  {[
                    { date: 'Jun 3', actor: 'Auto-sync', note: 'Submittal status updated from Procore' },
                    { date: 'May 28', actor: 'J. Torres', note: 'Confirmed sub has mobilized' },
                  ].map((h, i) => (
                    <div key={i} className="text-white/30 leading-snug" style={{ fontSize: 10 }}>
                      <span className="text-white/20">{h.date} · {h.actor}</span><br />
                      {h.note}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          PANEL 3: MEETING VIEW
      ══════════════════════════════════════════════════ */}
      {activeTab === 'meeting' && (
        <div className="space-y-4 animate-fade-in">

          {/* Meeting header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-xl text-white/70 tracking-wide">QAQC MEETING READOUT</p>
              <p className="font-mono text-white/30 text-xs mt-0.5">
                {fmtFull(TODAY)} · {gapItems.length} items requiring discussion · Generated from DFW gap analysis
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-400/30 bg-amber-400/8 text-amber-400 font-mono text-xs tracking-widest hover:bg-amber-400/15 transition-colors">
              <span>↓</span> EXPORT PDF
            </button>
          </div>

          {/* Items */}
          {divs.map(div => {
            const items = gapItems.filter(i => i.div === div);
            if (items.length === 0) return null;
            return (
              <div key={div} className="space-y-2">
                <p className="font-display text-sm text-white/35 tracking-widest px-1">{DIV_LABELS[div]}</p>
                {items.map((item, idx) => {
                  const gaps = computeGaps(item);
                  return (
                    <div key={item.csi} className="glass rounded-xl border border-white/10 overflow-hidden">
                      {/* Item header */}
                      <div className="flex items-start justify-between gap-4 px-5 py-3 border-b border-white/8">
                        <div className="flex items-start gap-3">
                          <span className="font-display text-2xl text-red-400/50 leading-none mt-0.5">{String(idx + 1).padStart(2, '0')}</span>
                          <div>
                            <p className="text-sm text-white/85 font-medium">{item.name}</p>
                            <p className="font-mono text-white/30 mt-0.5" style={{ fontSize: 10 }}>{item.csi} · {item.sub}</p>
                          </div>
                        </div>
                        <span className="font-mono text-xs text-red-400 px-2 py-0.5 rounded border border-red-400/20 bg-red-400/8 shrink-0">
                          {gaps.length} gap{gaps.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Gaps + questions */}
                      <div className="px-5 py-3 space-y-3">
                        {gaps.map((g, gi) => (
                          <div key={gi} className="grid gap-2" style={{ gridTemplateColumns: '120px 1fr' }}>
                            <span className="font-mono text-red-400/70 text-xs pt-0.5">{g.field}</span>
                            <div className="space-y-1.5">
                              <p className="text-white/60 text-xs leading-snug">{g.question}</p>
                              <div className="flex items-center gap-2 rounded bg-white/3 border border-white/8 px-2 py-1.5">
                                <span className="font-mono text-white/20" style={{ fontSize: 9 }}>ACTION:</span>
                                <span className="font-mono text-white/25 flex-1" style={{ fontSize: 9 }}>Click to assign owner + due date →</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Current status snapshot */}
                      <div className="flex gap-4 px-5 py-2 border-t border-white/6 bg-white/2">
                        {[
                          ['Submittal', item.submittalStatus.replace('_', ' ')],
                          ['Material', item.materialConfirmed === true ? 'Confirmed' : '—'],
                          ['Sub Start', item.subStartActual || item.subStartProjected || '—'],
                          ['Inspection', item.inspectionLinked ? 'Linked' : 'Missing'],
                        ].map(([k, v]) => (
                          <div key={k}>
                            <p className="font-mono text-white/20" style={{ fontSize: 8 }}>{k}</p>
                            <p className="font-mono text-white/50" style={{ fontSize: 10 }}>{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {gapItems.length === 0 && (
            <div className="glass rounded-xl border border-emerald-400/20 p-12 text-center">
              <p className="font-display text-2xl text-emerald-400 tracking-wide mb-2">ALL CLEAR</p>
              <p className="font-mono text-white/30 text-sm">No gap flags across all applicable DFW items.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Field chip helper ────────────────────────────────────────────────────────
function FieldChip({ status, label }: { status: 'ok' | 'pending' | 'gap' | 'na' | 'manual'; label: string }) {
  const cfg = {
    ok:      { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)' },
    pending: { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.18)' },
    gap:     { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)' },
    na:      { color: '#475569', bg: 'transparent',            border: 'rgba(71,85,105,0.2)' },
    manual:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  }[status];
  return (
    <span className="inline-block px-1.5 py-0.5 rounded font-mono leading-tight truncate max-w-full"
      style={{ fontSize: 9, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      {label}
    </span>
  );
}
