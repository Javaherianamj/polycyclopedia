// FE-8 step 4, REVISED 2026-08-14 — the Hansen solubility-space
// visualisation, reworked per two owner corrections to the original ship:
//
// 1. "for hsb i need the 3d one, like HSPIP software and its output" — this
//    is now a true rotatable 3D scatter (drag to rotate, scroll to zoom),
//    not three flat 2D panels. See lib/learn/hansen-space.ts's header for
//    the hand-rolled-SVG-vs-Three.js decision (made again under this
//    correction, not inherited from the old one).
//
//    REVISED 2026-08-16 (b): this paragraph used to end "and for why NO
//    interaction-radius (Ro) sphere is ever drawn: no material in this
//    database has a real Ro value". That premise expired when the
//    `hsp_correlation` table landed with Hansen's own published sphere fits
//    (Handbook Table A.2), 12 of which are linked to catalog materials. The
//    RULE behind it has not moved an inch: R7 forbids an INVENTED radius.
//    A sphere is drawn if and only if `selected.hspCorrelation` is non-null,
//    at that correlation's own sourced centre and Ro; every other material
//    keeps the point-only rendering and still says so out loud
//    (`learn.hansen.noRoNote`).
//
//    Where a material has BOTH a linked correlation and its own
//    `hansen_d/p/h` property values (LDPE/HDPE carry unsourced ones), the
//    SOURCED correlation supplies the marker position — same posture the
//    rest of the site takes toward provenance, and the reason the
//    correlation's own citation note replaces the uncited-values note.
//
//    THE SPHERE'S COLOUR CHANNELS, and why they are arranged this way:
//    RED (Ra/Ro) drives each solvent dot's FILL, and provenance
//    (cited/uncited) moves from fill to STROKE — solid outline for cited,
//    dashed for not. Provenance is a channel this site guarantees
//    everywhere (R11/D5/D36); RED is not allowed to consume it, so the two
//    facts get two channels rather than fighting over one. And because
//    roughly 8% of male readers cannot separate green from red, hue is
//    never the only carrier: 'good' is a filled disc, 'poor' is an open
//    ring, 'boundary' is between the two, and every dot's <title> states
//    the numeric RED outright.
//
// 2. "on the learning env i don't want all of the solvents available to
//    see, just having the option to choose as many as i want ... to see
//    them against the polymer we have our page dedicated to" — the full
//    ~1,180-row solvent cloud is NOT plotted by default. The reader
//    searches and adds solvents one at a time (or from the "closest
//    matches" list once a polymer is shown); only the ones they chose are
//    ever rendered. The full unfiltered browse stays on `/solvents`
//    (untouched by this revision) and is one link away
//    (`learn.hansen.solventsPageLink`).
//
//    "the polymer we have our page dedicated to": a reader arriving via a
//    material's datasheet page (PropertySection.astro's LearnBridge) is
//    bound to THAT material, via `?material={slug}` on the link
//    (lib/learn/learn-url-state.ts, same convention as search's `?from=`
//    and compare's `?subjects=`) — not a free-floating "pick any of 7
//    polymers" dropdown. A direct visit to `/learn` with no `material` param
//    still gets a small picker (only materials with real hansen data are
//    ever offered), since Learn is also a standalone route.
//
// R7 applied per-dependency, same posture the rest of this unit uses: the
// tool itself renders once solvent data exists, independent of whether any
// polymer qualifies for a marker (only 2 of the current catalog do, both
// unsourced — shown honestly via the same value.uncited mark the rest of
// the site uses, never hidden).
//
// FE-8 foundation layer, part 1 — refactored onto lib/learn/material-context.ts's
// shared hook so the "read ?material=, resolve it against the live catalog"
// logic is the SAME code every Learn tool runs, not five parallel
// reimplementations. Behaviour here is unchanged: this island was already
// the one tool that read the material param correctly (the FE-8 build brief
// this file's own header describes), and the material fetch is combined
// with the solvent fetch exactly as before — the hook only replaces the
// URL-read and catalog-fetch effects, not the solvent-specific one, which
// this tool alone needs.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Locale } from '../i18n/config';
import { t, type MessageKey } from '../i18n/t';
import type { LearnMaterial } from '../lib/learn/fetch-learn-materials';
import { useLearnMaterialContext } from '../lib/learn/material-context';
import { fetchSolvents } from '../lib/solvents/fetch-solvents';
import type { Solvent } from '../lib/solvents/types';
import {
  axisLines,
  boundingBoxEdges,
  dropLine,
  expandBoxForSphere,
  gridPlaneLines,
  nearestByHansenDistance,
  plotBox,
  project3D,
  projectPlot,
  projectSphere,
  redBand,
  relativeEnergyDifference,
  type HansenAxis,
  type HansenPlotBox,
  type HansenPoint,
  type PlotSegment,
  type RedBand,
  type Rotation,
} from '../lib/learn/hansen-space';

interface HansenSpaceIslandProps {
  locale: Locale;
}

type FetchStatus = 'loading' | 'ready' | 'error';

const SCENE = { width: 360, height: 320 };
const CENTER = { x: SCENE.width / 2, y: SCENE.height / 2 };
const DEFAULT_ROTATION: Rotation = { azimuthDeg: -35, elevationDeg: -22 };
const DEFAULT_SCALE = 110;
const MIN_SCALE = 55;
const MAX_SCALE = 220;
const SOLVENT_RADIUS = 4;
const POLYMER_RADIUS = 8;
const NEAREST_LIMIT = 8;
const SEARCH_RESULT_LIMIT = 20;
const MIN_QUERY_LENGTH = 2;

const AXIS_LABEL: Record<HansenAxis, MessageKey> = {
  d: 'learn.hansen.axisD',
  p: 'learn.hansen.axisP',
  h: 'learn.hansen.axisH',
} as const;

function materialName(m: LearnMaterial, locale: Locale): string {
  return locale === 'fa' ? m.nameFa : m.nameEn;
}

function solventName(s: Solvent, locale: Locale): string {
  return locale === 'fa' ? (s.nameFa ?? s.nameEn) : s.nameEn;
}

function solventPoint(s: Solvent): HansenPoint {
  return { d: s.hansenD, p: s.hansenP, h: s.hansenH };
}

/** Where a material sits in Hansen space, or `null` if nothing in the
 * database says.
 *
 * A linked `hsp_correlation` WINS over the material's own hansen_d/p/h
 * property values, and that ordering is the point of this function existing
 * instead of an inline `m.hansen`. The correlation is one of Hansen's own
 * published sphere fits, citable to a printed page; the property values
 * that exist today (LDPE, HDPE) are `status='unsourced'`. Preferring the
 * sourced number is the same call the rest of the site makes everywhere
 * else, and it additionally keeps the sphere CONCENTRIC with its marker —
 * an Ro is only meaningful about the centre it was fitted around, so
 * drawing a correlation's radius about a different centre would be a
 * quietly wrong picture. */
function materialPoint(m: LearnMaterial): HansenPoint | null {
  if (m.hspCorrelation) {
    return { d: m.hspCorrelation.d, p: m.hspCorrelation.p, h: m.hspCorrelation.h };
  }
  if (m.hansen) {
    return { d: m.hansen.d.value, p: m.hansen.p.value, h: m.hansen.h.value };
  }
  return null;
}

/** Formats RED for a dot's `<title>`. Two decimals because the third would
 * be well inside the published Ro's own precision (see
 * `RED_BOUNDARY_TOLERANCE`'s doc comment). */
function formatRed(red: number): string {
  return red.toFixed(2);
}

const RED_BAND_CLASS: Record<RedBand, string> = {
  good: 'hansen-red-good',
  boundary: 'hansen-red-boundary',
  poor: 'hansen-red-poor',
};

function matchesQuery(s: Solvent, query: string): boolean {
  const q = query.toLowerCase();
  return (
    s.nameEn.toLowerCase().includes(q) ||
    (s.nameFa?.toLowerCase().includes(q) ?? false) ||
    (s.systematicName?.toLowerCase().includes(q) ?? false)
  );
}

export default function HansenSpaceIsland({ locale }: HansenSpaceIslandProps) {
  const { status: materialStatus, materials, boundSlug, boundMaterial } = useLearnMaterialContext();
  const [solvents, setSolvents] = useState<Solvent[]>([]);
  const [solventStatus, setSolventStatus] = useState<FetchStatus>('loading');
  const [pickedSlug, setPickedSlug] = useState<string>('');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [rotation, setRotation] = useState<Rotation>(DEFAULT_ROTATION);
  const [scale, setScale] = useState(DEFAULT_SCALE);
  // Defaults to the stable corpus view and NEVER auto-switches: an automatic
  // reframe on selection change would recreate exactly the moving-points
  // symptom this revision exists to remove.
  const [viewMode, setViewMode] = useState<'corpus' | 'selection'>('corpus');
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const sceneRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSolvents().then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setSolventStatus('error');
        return;
      }
      setSolvents(result.data);
      setSolventStatus('ready');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Combined status: this tool's own R7 posture ("renders once solvent data
  // exists") plus the shared material fetch, which HansenSpace additionally
  // needs to resolve the bound-slug marker and populate the free picker.
  const status: FetchStatus =
    solventStatus === 'error' || materialStatus === 'error'
      ? 'error'
      : solventStatus === 'ready' && materialStatus === 'ready'
        ? 'ready'
        : 'loading';

  // Non-passive wheel listener: React 17+ attaches onWheel passively, which
  // silently ignores preventDefault(). A native listener is the only way to
  // stop the page from scrolling while the reader zooms the scene.
  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      setScale((prev) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev - e.deltaY * 0.25)));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // Materials this tool can place at all — now either source counts (see
  // `materialPoint`), which is what put the 12 correlation-linked polymers
  // into the picker alongside the 2 that carry their own hansen values.
  const materialsWithHansen = useMemo(
    () => materials.filter((m) => materialPoint(m) !== null),
    [materials],
  );

  // `boundMaterial` itself now comes from the shared hook (material-context.ts)
  // instead of being resolved here — same value, one fewer place the
  // "slug -> catalog entry" lookup is written.
  const pickedMaterial = !boundSlug
    ? materialsWithHansen.find((m) => m.slug === pickedSlug)
    : undefined;
  const selected =
    boundMaterial && materialPoint(boundMaterial) ? boundMaterial : (pickedMaterial ?? null);

  const selectedPoint: HansenPoint | null = selected ? materialPoint(selected) : null;

  // THE ONLY source of a sphere. `null` for every material without a
  // reviewed link to a published correlation, and there is deliberately no
  // fallback branch: R7 forbids inventing a radius, so "no correlation"
  // renders exactly what it rendered before this feature existed — a point,
  // plus `learn.hansen.noRoNote` saying why.
  const correlation = selected?.hspCorrelation ?? null;
  // `relativeEnergyDifference` is the gate rather than `r0 > 0` written out
  // here: a single place decides what counts as a usable radius, and it is
  // the same place the colouring goes through.
  const sphereR0 =
    correlation && relativeEnergyDifference(correlation, correlation, correlation.r0) !== null
      ? correlation.r0
      : 0;

  const selectedSolvents = useMemo(
    () => solvents.filter((s) => selectedKeys.includes(s.key)),
    [solvents, selectedKeys],
  );

  // THE FIX for the owner's "it is showing the solvents in wrong places"
  // report. The box this replaced was computed over `selectedSolvents`, so
  // every add/remove rescaled all three axes and MOVED EVERY POINT ALREADY
  // ON SCREEN. Note the dependency list below: `selectedKeys` is deliberately
  // absent, and must stay absent -- that absence IS the fix. The corpus box
  // depends only on the solvent data itself, which never changes after the
  // fetch resolves, so a point's position is a function of its own Hansen
  // coordinates and nothing else.
  const corpusBox = useMemo(
    () => plotBox(solvents.map(solventPoint)),
    [solvents],
  );

  // Fit-to-selection is the honesty-preserving zoom, not a second projection:
  // `plotBox` always returns a CUBE, so the shared scale (and therefore the
  // Ra-means-distance property) holds in both view modes. Only the visible
  // extent changes. Without this the fix would be a regression in
  // legibility -- the corpus box is ~50 MPa^0.5 on a side, so two solvents
  // 1.5 apart occupy ~3% of a 360px scene and read as one blob.
  const box: HansenPlotBox = useMemo(() => {
    const base =
      viewMode === 'selection' && (selectedSolvents.length > 0 || selectedPoint)
        ? plotBox([...selectedSolvents.map(solventPoint), ...(selectedPoint ? [selectedPoint] : [])])
        : corpusBox;
    // A polymer near the edge of the cloud would otherwise have its marker
    // -- and now, with real Ro data, its whole solubility sphere -- clipped
    // by the wireframe cube. `sphereR0` is 0 when no correlation is linked,
    // which makes this the same no-op it was before the sphere existed.
    return selectedPoint ? expandBoxForSphere(base, selectedPoint, sphereR0) : base;
  }, [corpusBox, viewMode, selectedSolvents, selectedPoint, sphereR0]);

  const searchResults = useMemo(() => {
    if (query.trim().length < MIN_QUERY_LENGTH) return [];
    return solvents.filter((s) => matchesQuery(s, query)).slice(0, SEARCH_RESULT_LIMIT);
  }, [solvents, query]);

  const nearest = useMemo(() => {
    if (!selectedPoint) return [];
    return nearestByHansenDistance(
      selectedPoint,
      solvents.map((s) => ({ ...s, d: s.hansenD, p: s.hansenP, h: s.hansenH })),
      NEAREST_LIMIT,
    );
  }, [selectedPoint, solvents]);

  function addSolvent(key: string) {
    setSelectedKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
  }
  function removeSolvent(key: string) {
    setSelectedKeys((prev) => prev.filter((k) => k !== key));
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    dragRef.current = { x: e.clientX, y: e.clientY };
    // Pointer capture keeps the drag tracking even if the cursor leaves the
    // SVG mid-rotate. Wrapped defensively: some pointer sequences (a
    // synthetic/test-dispatched event with no live capture session) throw
    // InvalidPointerId here, which must not crash the whole tool over a
    // cosmetic capture failure -- the drag still works via onPointerMove's
    // own bubbling listener either way.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Non-fatal — see comment above.
    }
  }
  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    setRotation((prev) => ({
      azimuthDeg: prev.azimuthDeg + dx * 0.5,
      elevationDeg: Math.max(-85, Math.min(85, prev.elevationDeg - dy * 0.5)),
    }));
  }
  function onPointerUp() {
    dragRef.current = null;
  }
  function resetView() {
    setViewMode('corpus');
    setRotation(DEFAULT_ROTATION);
    setScale(DEFAULT_SCALE);
  }

  // R7/Learn convention: silent while unresolved or on a real fetch error.
  if (status !== 'ready') return null;

  const project = (p: HansenPoint) => project3D(p, box, rotation, CENTER, scale);
  const projectEdge = (edge: PlotSegment) => ({
    start: projectPlot(edge.start, box, rotation, CENTER, scale),
    end: projectPlot(edge.end, box, rotation, CENTER, scale),
  });

  // Reference geometry first, so it always paints as backdrop: the gridded
  // floor+walls (owner's "mesh"), the bounding cube (owner's "cubes"), then
  // the axis lines. None of these carry real occlusion against the data --
  // they're wireframe, not solid -- so unlike the spheres below they don't
  // need to be in the depth-sorted paint order.
  const projectedGrid = gridPlaneLines(box).map(projectEdge);
  const projectedBox = boundingBoxEdges(box).map(projectEdge);
  const projectedAxes = axisLines(box).map((line) => ({ axis: line.axis, ...projectEdge(line) }));

  // Drop lines -- one per plotted point, straight down to the floor grid --
  // are the other HSPiP depth cue (see hansen-space.ts's `dropLine` doc).
  // Drawn after the grid/cube/axes but before the spheres, so a sphere never
  // has its own drop line painted across its face.
  const projectedDropLines = [
    ...selectedSolvents.map((s) => projectEdge(dropLine(solventPoint(s), box))),
    ...(selectedPoint ? [projectEdge(dropLine(selectedPoint, box))] : []),
  ];

  // THE ACTUAL HARD PART (see this component's revision note below): SVG has
  // no z-buffer, so "spheres transparent enough to see one another through"
  // only reads correctly if every sphere -- solvent dots AND the polymer
  // marker alike -- is painted in a single far-to-near order. Keeping the
  // polymer marker in its own unconditionally-last <circle> (the previous
  // shape of this code) silently broke that: it would always paint on top
  // even when a solvent was actually closer to the camera. Merging both into
  // one array and sorting by `depth` once is what makes painter's algorithm
  // correct here, not the opacity value itself.
  //
  // THE SOLUBILITY SPHERE RIDES THAT SAME SORT, as TWO entries rather than
  // one. SVG has no z-buffer, so a single translucent circle can only ever
  // paint entirely over or entirely under the dots. Splitting the sphere
  // into a filled BACK hemisphere at `depth - depthRadius` and a stroked
  // FRONT shell at `depth + depthRadius` puts the solvent dots BETWEEN
  // them in the existing far-to-near order, with no change to the sort
  // itself: an interior solvent then paints over the back and under the
  // front, which is what actually reads as "inside the sphere". A solvent
  // outside but nearer the camera paints over both, correctly.
  const projectedSphere =
    selectedPoint && sphereR0 > 0
      ? projectSphere(selectedPoint, sphereR0, box, rotation, CENTER, scale)
      : null;

  type Sphere = {
    key: string;
    kind: 'solvent' | 'polymer' | 'sphere-back' | 'sphere-front';
    x: number;
    y: number;
    depth: number;
    /** Set only for the two sphere-shell entries: the rotation-invariant
     * pixel radius Ro projects to. */
    radius?: number;
    solvent?: Solvent;
    /** Ra/Ro against the selected polymer, or `null` when no sphere is
     * drawn — in which case the dot keeps its pre-existing provenance
     * colouring untouched. */
    red?: number | null;
  };
  const spheres: Sphere[] = [
    ...selectedSolvents.map((s) => {
      const p = project(solventPoint(s));
      const red =
        selectedPoint && sphereR0 > 0
          ? relativeEnergyDifference(selectedPoint, solventPoint(s), sphereR0)
          : null;
      return {
        key: s.key,
        kind: 'solvent' as const,
        x: p.x,
        y: p.y,
        depth: p.depth,
        solvent: s,
        red,
      };
    }),
    ...(selectedPoint
      ? [
          (() => {
            const p = project(selectedPoint);
            return { key: '__polymer', kind: 'polymer' as const, x: p.x, y: p.y, depth: p.depth };
          })(),
        ]
      : []),
    ...(projectedSphere
      ? [
          {
            key: '__sphere-back',
            kind: 'sphere-back' as const,
            x: projectedSphere.cx,
            y: projectedSphere.cy,
            depth: projectedSphere.depth - projectedSphere.depthRadius,
            radius: projectedSphere.r,
          },
          {
            key: '__sphere-front',
            kind: 'sphere-front' as const,
            x: projectedSphere.cx,
            y: projectedSphere.cy,
            depth: projectedSphere.depth + projectedSphere.depthRadius,
            radius: projectedSphere.r,
          },
        ]
      : []),
  ].sort((a, b) => a.depth - b.depth);

  // Depth-scaled radius: HSPiP-style size perspective, a second depth cue
  // independent of the drop lines/grid, so "which sphere is nearer" still
  // reads even when two points are far apart on screen. `depth` from
  // project3D is a normalised (roughly -0.5..0.5) camera-space value, not a
  // pixel size, so the scale factor here is a deliberately gentle
  // multiplier (+/-30% off the base radius) -- enough to be a legible cue,
  // not so much that a far point vanishes or a near one swallows its
  // neighbours.
  const depthRadius = (baseRadius: number, depth: number) => baseRadius * (1 + depth * 0.6);

  return (
    <div className="learn-tool" data-testid="hansen-space" id="hansen-space">
      <div className="learn-tool-head">
        <h2 className="learn-tool-title">{t(locale, 'learn.hansen.title')}</h2>
        <p className="learn-tool-intro">{t(locale, 'learn.hansen.intro')}</p>
      </div>

      {solvents.length === 0 ? (
        <div className="state-empty" data-testid="hansen-space-empty">
          {t(locale, 'learn.hansen.noSolvents')}
        </div>
      ) : (
        <>
          {/* -------------------------------------------- material context */}
          {boundSlug && boundMaterial && (
            <p className="learn-note" data-testid="hansen-bound-note">
              {t(locale, 'learn.hansen.boundNote').replace(
                '{material}',
                materialName(boundMaterial, locale),
              )}
            </p>
          )}
          {/* "can't be positioned" must mean NEITHER source resolved — a
              material placed from a linked correlation is positioned, and
              saying otherwise while its marker is on screen would be a
              flat contradiction. */}
          {boundSlug && boundMaterial && !materialPoint(boundMaterial) && (
            <p className="learn-hint" data-testid="hansen-bound-no-hansen-note">
              {t(locale, 'learn.hansen.boundNoHansenNote').replace(
                '{material}',
                materialName(boundMaterial, locale),
              )}
            </p>
          )}

          {!boundSlug && (
            <div className="learn-field">
              <label className="learn-label" htmlFor="hansen-material">
                {t(locale, 'learn.hansen.materialLabel')}
              </label>
              <select
                id="hansen-material"
                className="learn-select"
                value={pickedSlug}
                onChange={(e) => setPickedSlug(e.target.value)}
                data-testid="hansen-material-select"
                disabled={materialsWithHansen.length === 0}
              >
                <option value="">{t(locale, 'learn.hansen.materialDefault')}</option>
                {materialsWithHansen.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {materialName(m, locale)}
                  </option>
                ))}
              </select>
              {materialsWithHansen.length === 0 && (
                <p className="learn-hint" data-testid="hansen-no-polymer-note">
                  {t(locale, 'learn.hansen.noPolymerNote')}
                </p>
              )}
            </div>
          )}

          {/* The uncited-values warning is about the material's OWN
              hansen_d/p/h. When a sourced correlation supplied the position
              instead (see `materialPoint`), those values aren't what's on
              screen, so warning about them would point at the wrong number
              -- the correlation's own citation note below covers it. */}
          {!correlation &&
            selected?.hansen &&
            (!selected.hansen.d.cited || !selected.hansen.p.cited || !selected.hansen.h.cited) && (
              <p className="learn-note" data-testid="hansen-selected-uncited-note">
                {t(locale, 'learn.hansen.selectedUncited').replace(
                  '{material}',
                  materialName(selected, locale),
                )}
              </p>
            )}

          {selectedPoint && !correlation && (
            <p className="learn-hint" data-testid="hansen-no-ro-note">
              {t(locale, 'learn.hansen.noRoNote').replace(
                '{material}',
                materialName(selected!, locale),
              )}
            </p>
          )}

          {correlation && selected && (
            <>
              <p className="learn-note" data-testid="hansen-ro-note">
                {t(locale, correlation.cited ? 'learn.hansen.roNote' : 'learn.hansen.roUncited')
                  .replace('{material}', materialName(selected, locale))
                  .replace('{ro}', correlation.r0.toFixed(1))}
              </p>
              <p className="learn-hint" data-testid="hansen-sphere-note">
                {t(locale, 'learn.hansen.sphereNote')}
              </p>
            </>
          )}

          {/* --------------------------------------------- solvent picking */}
          <div className="learn-field hansen-search" data-testid="hansen-search">
            <label className="learn-label" htmlFor="hansen-search-input">
              {t(locale, 'learn.hansen.searchLabel')}
            </label>
            <input
              id="hansen-search-input"
              type="search"
              className="learn-input"
              placeholder={t(locale, 'learn.hansen.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              data-testid="hansen-search-input"
            />
            <p className="learn-hint">{t(locale, 'learn.hansen.searchHint')}</p>
            {query.trim().length >= MIN_QUERY_LENGTH && (
              <ul className="hansen-search-results" data-testid="hansen-search-results">
                {searchResults.length === 0 ? (
                  <li className="hansen-search-empty">
                    {t(locale, 'learn.hansen.searchNoResults').replace('{query}', query)}
                  </li>
                ) : (
                  searchResults.map((s) => {
                    const already = selectedKeys.includes(s.key);
                    return (
                      <li key={s.key} className="hansen-search-item">
                        <span>{solventName(s, locale)}</span>
                        <button
                          type="button"
                          className="hansen-add-btn"
                          onClick={() => (already ? removeSolvent(s.key) : addSolvent(s.key))}
                          data-testid={`hansen-search-add-${s.key}`}
                        >
                          {t(locale, already ? 'learn.hansen.remove' : 'learn.hansen.add')}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            )}
          </div>

          <div className="hansen-selected-chips" data-testid="hansen-selected-chips">
            <p className="learn-label">
              {t(locale, 'learn.hansen.selectedHeading').replace(
                '{count}',
                String(selectedSolvents.length),
              )}
            </p>
            {selectedSolvents.length === 0 ? (
              <p className="learn-hint" data-testid="hansen-selected-empty">
                {t(locale, 'learn.hansen.selectedEmpty')}
              </p>
            ) : (
              <ul className="hansen-chip-list">
                {selectedSolvents.map((s) => (
                  <li key={s.key} className="hansen-chip" data-testid={`hansen-chip-${s.key}`}>
                    <span className={s.cited ? 'hansen-dot hansen-dot-cited' : 'hansen-dot'} />
                    <span>{solventName(s, locale)}</span>
                    <button
                      type="button"
                      className="hansen-chip-remove"
                      onClick={() => removeSolvent(s.key)}
                      aria-label={t(locale, 'learn.hansen.remove')}
                      data-testid={`hansen-chip-remove-${s.key}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* --------------------------------------------------- the scene */}
          <div className="hansen-scene-wrap" dir="ltr">
            <svg
              ref={sceneRef}
              className="hansen-scene-svg"
              viewBox={`0 0 ${SCENE.width} ${SCENE.height}`}
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label={t(locale, 'learn.hansen.title')}
              data-testid="hansen-scene"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            >
              {/* Gridded floor + back walls -- the "mesh" the owner asked
                  for, HSPiP's own depth cue: without it a point floating in
                  a bare wireframe cube has no legible position, only "inside
                  the box somewhere". */}
              {projectedGrid.map((edge, i) => (
                <line
                  key={i}
                  x1={edge.start.x}
                  y1={edge.start.y}
                  x2={edge.end.x}
                  y2={edge.end.y}
                  className="hansen-grid-line"
                />
              ))}

              {/* The wireframe cube itself -- the owner's "cubes" -- drawn
                  over the grid so its edges read as the box's outline
                  rather than just more grid lines. */}
              {projectedBox.map((edge, i) => (
                <line
                  key={i}
                  x1={edge.start.x}
                  y1={edge.start.y}
                  x2={edge.end.x}
                  y2={edge.end.y}
                  className="hansen-box-edge"
                />
              ))}

              {projectedAxes.map((axis) => (
                <g key={axis.axis}>
                  <line
                    x1={axis.start.x}
                    y1={axis.start.y}
                    x2={axis.end.x}
                    y2={axis.end.y}
                    className="hansen-axis-line"
                  />
                  <text
                    x={axis.end.x}
                    y={axis.end.y}
                    className="hansen-axis-label"
                    data-testid={`hansen-axis-label-${axis.axis}`}
                  >
                    {t(locale, AXIS_LABEL[axis.axis])}
                  </text>
                </g>
              ))}

              {/* Drop lines: each plotted point's straight line down to the
                  floor grid, the second HSPiP depth cue (see the
                  `projectedDropLines` comment above for why these are
                  drawn before, not sorted into, the spheres). */}
              {projectedDropLines.map((edge, i) => (
                <line
                  key={i}
                  x1={edge.start.x}
                  y1={edge.start.y}
                  x2={edge.end.x}
                  y2={edge.end.y}
                  className="hansen-drop-line"
                />
              ))}

              {/* The spheres themselves, in a single far-to-near paint
                  order (see the `spheres` comment above) so semi-transparent
                  fills actually show one sphere through another instead of
                  just alpha-blending in an arbitrary, rotation-dependent
                  order. Radius is depth-scaled (`depthRadius`) as a second,
                  size-based cue to which sphere is nearer. */}
              {spheres.map((sphere) => {
                if (sphere.kind === 'sphere-back' || sphere.kind === 'sphere-front') {
                  // Same centre and same radius for both — only the depth
                  // key and the styling differ. `r` does not change with
                  // rotation (hansen-space.ts's `projectSphere`), which is
                  // the direct visual proof the metric is right.
                  return (
                    <circle
                      key={sphere.key}
                      cx={sphere.x}
                      cy={sphere.y}
                      r={sphere.radius}
                      className={
                        sphere.kind === 'sphere-back' ? 'hansen-sphere-back' : 'hansen-sphere-front'
                      }
                      data-testid={`hansen-scene-${sphere.kind}`}
                      data-radius={sphere.radius}
                    />
                  );
                }
                if (sphere.kind === 'polymer') {
                  if (!selected) return null;
                  return (
                    <circle
                      key={sphere.key}
                      cx={sphere.x}
                      cy={sphere.y}
                      r={depthRadius(POLYMER_RADIUS, sphere.depth)}
                      className="hansen-dot-polymer"
                      data-testid="hansen-scene-polymer-marker"
                    >
                      <title>{materialName(selected, locale)}</title>
                    </circle>
                  );
                }
                const solvent = sphere.solvent!;
                const red = sphere.red ?? null;
                // With a sphere on screen, FILL carries RED and STROKE
                // carries provenance (solid = cited, dashed = not), so
                // neither fact displaces the other. With no sphere there is
                // no RED to show, and the dot keeps exactly the sage/grey
                // provenance fill it has always had.
                const className =
                  red === null
                    ? solvent.cited
                      ? 'hansen-dot hansen-dot-cited'
                      : 'hansen-dot'
                    : `hansen-dot ${RED_BAND_CLASS[redBand(red)]} ${
                        solvent.cited ? 'hansen-dot-prov-cited' : 'hansen-dot-prov-uncited'
                      }`;
                const coords = `(${solvent.hansenD.toFixed(1)}, ${solvent.hansenP.toFixed(1)}, ${solvent.hansenH.toFixed(1)})`;
                return (
                  <circle
                    key={sphere.key}
                    cx={sphere.x}
                    cy={sphere.y}
                    r={depthRadius(SOLVENT_RADIUS, sphere.depth)}
                    className={className}
                    data-testid={`hansen-scene-point-${solvent.key}`}
                    data-red={red === null ? undefined : formatRed(red)}
                  >
                    {/* The numeric RED is in the title because colour alone
                        is not an accessible channel — see this file's
                        header. */}
                    <title>
                      {red === null
                        ? `${solventName(solvent, locale)} ${coords}`
                        : `${solventName(solvent, locale)} ${coords} — RED ${formatRed(red)}`}
                    </title>
                  </circle>
                );
              })}
            </svg>
            <div className="hansen-scene-controls">
              <p className="learn-hint">{t(locale, 'learn.hansen.rotateHint')}</p>
              <button
                type="button"
                className="hansen-view-btn"
                aria-pressed={viewMode === 'selection'}
                onClick={() => setViewMode((v) => (v === 'corpus' ? 'selection' : 'corpus'))}
                data-testid="hansen-view-mode"
              >
                {t(
                  locale,
                  viewMode === 'corpus'
                    ? 'learn.hansen.viewSelection'
                    : 'learn.hansen.viewCorpus',
                )}
              </button>
              <button
                type="button"
                className="hansen-reset-btn"
                onClick={resetView}
                data-testid="hansen-reset-view"
              >
                {t(locale, 'learn.hansen.resetView')}
              </button>
            </div>
          </div>

          {/* The RED legend only appears when a sphere is actually on
              screen — there is nothing to key without one. Each swatch
              repeats the SHAPE cue as well as the hue (filled disc / part
              filled / open ring), because hue on its own is not a channel
              ~8% of male readers can read. */}
          {projectedSphere && (
            <div className="hansen-red-legend" data-testid="hansen-red-legend">
              <p className="learn-label">{t(locale, 'learn.hansen.redLegend')}</p>
              <ul className="hansen-red-legend-list">
                {(
                  [
                    ['good', 'learn.hansen.redGood'],
                    ['boundary', 'learn.hansen.redBoundary'],
                    ['poor', 'learn.hansen.redPoor'],
                  ] as const
                ).map(([band, key]) => (
                  <li key={band} className="hansen-red-legend-item">
                    <svg
                      className="hansen-red-swatch"
                      viewBox="0 0 12 12"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <circle cx="6" cy="6" r="4.5" className={`hansen-dot ${RED_BAND_CLASS[band]}`} />
                    </svg>
                    <span>{t(locale, key)}</span>
                  </li>
                ))}
              </ul>
              <p className="learn-note" data-testid="hansen-red-boundary-note">
                {t(locale, 'learn.hansen.redBoundaryNote')}
              </p>
            </div>
          )}

          <p className="learn-hint">{t(locale, 'learn.hansen.unitNote')}</p>
          <p className="learn-hint" data-testid="hansen-metric-note">
            {t(locale, 'learn.hansen.metricNote')}
          </p>
          {viewMode === 'selection' && (
            <p className="learn-hint">{t(locale, 'learn.hansen.viewNote')}</p>
          )}

          <p className="learn-hint">
            <a href={`/${locale}/solvents`} data-testid="hansen-solvents-page-link">
              {t(locale, 'learn.hansen.solventsPageLink')}
            </a>
          </p>

          {/* Gated on `selectedPoint`, NOT on `selected.hansen`: a material
              positioned from a linked correlation has no hansen_d/p/h of its
              own, and gating on those would have hidden this panel for
              exactly the 12 polymers that now get a sphere. */}
          {selectedPoint && selected && (
            <div className="hansen-nearest" data-testid="hansen-nearest-list">
              <p className="learn-label">
                {t(locale, 'learn.hansen.nearestHeading').replace(
                  '{material}',
                  materialName(selected, locale),
                )}
              </p>
              <ol className="hansen-nearest-list">
                {nearest.map((s) => {
                  const already = selectedKeys.includes(s.key);
                  return (
                    <li
                      key={s.key}
                      className="hansen-nearest-item"
                      data-testid={`hansen-nearest-${s.key}`}
                    >
                      <span className="hansen-nearest-name">{solventName(s, locale)}</span>
                      <span className="hansen-nearest-distance num" dir="ltr">
                        Ra {s.distance.toFixed(1)}
                      </span>
                      <button
                        type="button"
                        className="hansen-add-btn"
                        onClick={() => (already ? removeSolvent(s.key) : addSolvent(s.key))}
                        data-testid={`hansen-nearest-add-${s.key}`}
                      >
                        {t(locale, already ? 'learn.hansen.remove' : 'learn.hansen.add')}
                      </button>
                    </li>
                  );
                })}
              </ol>
              <p className="learn-note">{t(locale, 'learn.hansen.raNote')}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
