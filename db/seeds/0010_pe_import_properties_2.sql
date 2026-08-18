-- 0010_pe_import_properties_2.sql
-- Polypedia: one more property needed for a complete P1-PE import pass
-- (curation/cited data-by author-p1-PE.md, Table 3), found on the second,
-- careful re-read of that table alongside hardness_shore_d.

INSERT INTO property_definition
    (group_id, key, name_fa, name_en, description_fa, description_en,
     data_type, canonical_unit, allowed_units, plausible_min, plausible_max,
     variance_class, symbol, sort_order)
VALUES
    ((SELECT id FROM property_group WHERE key = 'mechanical'), 'hardness_brinell',
     'سختی برینل', 'Brinell Hardness',
     'سختی برینل، مقیاسی متفاوت از سختی شور D که در برخی دیتاشیت‌های تجاری گزارش می‌شود.',
     'Brinell hardness, a different scale from Shore D reported in some commercial datasheets.',
     'range', 'MPa', ARRAY['MPa'], 0, 500, 'grade_dependent', NULL, 240)
ON CONFLICT (key) DO NOTHING;
