-- =============================================================================
-- Seed: sources (bibliography)
-- =============================================================================
-- Transcribed 1:1 from the hand-written bibliography in
-- src/components/ResourcesModal.tsx. That component lists these works as prose
-- with no join key to any individual value, which is exactly the gap this table
-- closes: once a source is a row, a citation can point at a page in it.
--
-- NOTHING here is invented. Only works actually named in ResourcesModal.tsx are
-- seeded. Fields the component does not state (ISBN, DOI, exact year) are left
-- NULL rather than guessed -- a wrong ISBN is worse than a missing one.
--
-- Idempotent: safe to run repeatedly.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Publishers (needed before sources reference them by name)
-- -----------------------------------------------------------------------------
INSERT INTO organization (key, name_en, name_fa, country_code, kind) VALUES
    ('wiley',                 'Wiley',                     NULL, 'US', 'publisher'),
    ('wiley_interscience',    'Wiley-Interscience',        NULL, 'US', 'publisher'),
    ('oxford_university_press','Oxford University Press',  NULL, 'GB', 'publisher'),
    ('astm_international',    'ASTM International',        NULL, 'US', 'standards_body'),
    ('iso',                   'International Organization for Standardization', NULL, 'CH', 'standards_body')
ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Section 1 of ResourcesModal.tsx: standard academic handbooks
-- -----------------------------------------------------------------------------
-- These are the top tier: peer-reviewed reference works. Values cited to these
-- outrank manufacturer datasheets when the two conflict.
INSERT INTO source (kind, tier, title, authors, publisher, edition) VALUES
    ('handbook', 'peer_reviewed_handbook',
     'Polymer Handbook',
     'J. Brandrup; E. H. Immergut; E. A. Grulke',
     'Wiley-Interscience',
     '4th Edition'),

    ('textbook', 'peer_reviewed_handbook',
     'Principles of Polymerization',
     'George Odian',
     'Wiley',
     '4th Edition'),

    ('encyclopedia', 'peer_reviewed_handbook',
     'Encyclopedia of Polymer Science and Technology',
     'Herman F. Mark',
     'Wiley',
     NULL),

    ('textbook', 'peer_reviewed_handbook',
     'Polymer Physics',
     'Michael Rubinstein; Ralph H. Colby',
     'Oxford University Press',
     NULL)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- Section 2 of ResourcesModal.tsx: international test standards
-- -----------------------------------------------------------------------------
-- Seeded as `source` rows so a value measured per a standard can cite the
-- standard itself. The machine-readable method codes live in `test_method`
-- (see 0004_test_methods.sql) and are what `property_value.test_method_id`
-- points at.
INSERT INTO source (kind, tier, title, publisher) VALUES
    ('standard', 'standard', 'ASTM D1238 / ISO 1133 - Melt Flow Rate of Thermoplastics',                    'ASTM International / ISO'),
    ('standard', 'standard', 'ASTM D638 / ISO 527 - Tensile Properties of Plastics',                        'ASTM International / ISO'),
    ('standard', 'standard', 'ASTM D3418 / ISO 11357 - Differential Scanning Calorimetry (Tg, Tm, Crystallinity)', 'ASTM International / ISO'),
    ('standard', 'standard', 'ASTM D7611 / ISO 11469 - Resin Identification Coding System',                  'ASTM International / ISO')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- Section 3 of ResourcesModal.tsx: manufacturer datasheets
-- -----------------------------------------------------------------------------
-- The component names categories ("Iranian petrochemical complexes",
-- "multinational complexes") rather than specific datasheet documents. One
-- placeholder-free collective row is seeded per category so that grade-level
-- datasheets can attach to a real parent source as they are actually obtained.
-- No individual datasheet is invented here.
INSERT INTO source (kind, tier, title, publisher) VALUES
    ('datasheet', 'manufacturer_datasheet', 'Iranian Petrochemical Producer Technical Datasheets (collection)',  NULL),
    ('datasheet', 'manufacturer_datasheet', 'Multinational Producer Technical Datasheets (collection)',          NULL)
ON CONFLICT DO NOTHING;
