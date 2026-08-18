// FE-8 step 4 — types this unit owns, mirroring the real, landed
// `GET /api/solvents` response (api/src/routes/solvents.ts). Kept local to
// this unit rather than added to web/src/lib/api/types.ts, matching FE-7's
// precedent (components/sources/types.ts) for a route this unit built
// itself end-to-end.
export interface Solvent {
  key: string;
  nameEn: string;
  /** NULL for the great majority of rows — the handbook import does not
   * machine-translate ~700 chemical names (see fetch-solvents.ts and the
   * unit's build-and-test record). Callers must fall back to `nameEn`
   * rather than render an empty cell. */
  nameFa: string | null;
  systematicName: string | null;
  casNumber: string | null;
  /** MPa^0.5 */
  hansenD: number;
  /** MPa^0.5 */
  hansenP: number;
  /** MPa^0.5 */
  hansenH: number;
  /** cm3/mol. NULL for the handful of rows the handbook omits it for. */
  molarVolume: number | null;
  status: string;
  /** Whether at least one evidence row backs this solvent
   * (evidence.subject_type = 'solvent'). A boolean, not a count — same
   * provenance-mark contract as every other cited/uncited flag on the site
   * (R11, D5, D36 sage/grey). */
  cited: boolean;
}

export interface SolventsListResponse {
  data: Solvent[];
  total: number;
}
