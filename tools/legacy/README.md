# Legacy scripts

One-off Node scripts used during the prototype's early data-entry phase — hand-editing `src/data/polymersData.ts` (the `fix_*`, `update_*`, `refactor_data`, `dedup`, `strip_dark` scripts) and generating the 3D molecule coordinates used by `MolecularViewer3D` (the `generate_*`, `make_*`, `gen_*` scripts).

None of these are imported by the running app or referenced by any `package.json` script — they were run manually, once, against the data file. Kept for reference (especially the molecule-coordinate generators, in case `atoms3d` data needs regenerating) rather than deleted outright.
