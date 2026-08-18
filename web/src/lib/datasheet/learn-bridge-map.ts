// R28/S10: "the mapping is declared once, in data — not scattered through
// JSX." This is that one place. FE-8 has not built the Learn surface yet —
// these are the destinations the datasheet promises, not routes that exist.
// A LearnBridge card renders when a group has an entry here and is silent
// otherwise; only three of the six property groups have an owner-specified
// destination today (frontend-plan.md §5, FE-3). Guessing a tool for the
// other three would be inventing information architecture that hasn't been
// decided — worse than leaving the bridge absent for those sections.
//
// Anchors are derived from the frozen prototype's actual component names
// (src/components/{StateSimulator,StressStrainChart,DPCalculator,
// Hansen3DChart}.tsx) so FE-8 has a stable target these links already
// committed to rather than a name it has to invent to match.
//
// FE-8 step 1 built Learn as one global route (`/{locale}/learn`), not the
// per-material `/{locale}/m/{slug}/learn` this comment originally sketched
// -- state-simulator and dp-calculator are universal-concept tools with no
// material scope of their own (see StateSimulatorIsland.tsx). LearnBridge.astro
// links to `/{locale}/learn#{anchor}`; `hansen` and `stress-strain` remain
// undelivered anchors until a later FE-8 step builds those tools, same
// "documented gap, not an oversight" posture as before.
export interface LearnTool {
  anchor: string;
  nameFa: string;
  nameEn: string;
}

export const learnBridgeMap: Partial<Record<string, LearnTool[]>> = {
  thermal: [{ anchor: 'state-simulator', nameFa: 'شبیه‌ساز حالت', nameEn: 'State simulator' }],
  mechanical: [
    { anchor: 'stress-strain', nameFa: 'نمودار تنش-کرنش', nameEn: 'Stress–strain chart' },
  ],
  academic: [
    {
      anchor: 'dp-calculator',
      nameFa: 'محاسبه‌گر درجه پلیمریزاسیون',
      nameEn: 'Degree-of-polymerization calculator',
    },
    { anchor: 'hansen', nameFa: 'نمودار سه‌بعدی هانسن', nameEn: 'Hansen 3D chart' },
  ],
};
