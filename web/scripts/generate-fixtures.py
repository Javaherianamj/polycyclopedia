
import json, os

WEB_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(WEB_ROOT, 'public')
FIXTURES_DIR = os.path.join(PUBLIC_DIR, 'fixtures')

PROPERTY_GROUP_MAP = {
    'process_temp': 'processing', 'process_pressure': 'processing',
    'mould_temp': 'processing', 'mfi': 'processing',
    'bur': 'processing', 'mold_shrinkage': 'processing',
    'rheology_notes': 'processing',
    'tg': 'thermal', 'tm': 'thermal', 'degradation_temp': 'thermal',
    'hdt': 'thermal', 'vicat': 'thermal', 'embrittlement_temp': 'thermal',
    'brittleness_temp': 'thermal', 'conductivity': 'thermal',
    'cte': 'thermal', 'specific_heat': 'thermal',
    'enthalpy_exp': 'thermal', 'enthalpy_100_cryst': 'thermal',
    'crystallinity': 'thermal', 'thermal_notes': 'thermal',
    'max_service_temp': 'thermal', 'min_service_temp': 'thermal',
    'thermal_diffusivity': 'thermal',
    'tensile_strength': 'mechanical', 'young_modulus': 'mechanical',
    'elongation_at_break': 'mechanical', 'flexural_modulus': 'mechanical',
    'flexural_strength': 'mechanical', 'compressive_strength': 'mechanical',
    'compressive_modulus': 'mechanical',
    'hardness_shore_d': 'mechanical', 'hardness_shore_a': 'mechanical',
    'hardness_rockwell_r': 'mechanical', 'hardness_brinell': 'mechanical',
    'izod_impact': 'mechanical', 'charpy_impact': 'mechanical',
    'tensile_impact': 'mechanical', 'poisson_ratio': 'mechanical',
    'abrasion_resistance': 'mechanical', 'mechanical_notes': 'mechanical',
    'density': 'physical', 'water_absorption': 'physical',
    'moisture_absorption': 'physical', 'refractive_index': 'physical',
    'haze': 'physical', 'gloss': 'physical',
    'oxygen_permeability': 'physical', 'co2_permeability': 'physical',
    'n2_permeability': 'physical', 'water_vapor_permeability': 'physical',
    'appearance': 'physical', 'density_temp_coeff': 'physical',
    'swelling_ratio': 'physical',
    'dielectric_constant': 'electrical', 'dielectric_strength': 'electrical',
    'dissipation_factor': 'electrical', 'volume_resistivity': 'electrical',
    'surface_resistivity': 'electrical', 'arc_resistance': 'electrical',
    'comparative_tracking_index': 'electrical', 'electrical_notes': 'electrical',
    'mn': 'academic', 'mw': 'academic', 'pdi': 'academic',
    'rz': 'academic', 'monomer_molar_mass': 'academic',
    'monomer_name': 'academic', 'repeat_unit_structure': 'academic',
    'copolymer_architecture': 'academic', 'polymerization_method': 'academic',
    'catalyst_system': 'academic', 'chain_end_group': 'academic',
    'solubility_parameter': 'academic', 'hansen_d': 'academic',
    'hansen_p': 'academic', 'hansen_h': 'academic',
    'flory_huggins_chi': 'academic', 'ffv': 'academic',
    'persistence_length': 'academic', 'thermo_notes': 'academic',
}

GROUP_META_LIST = [
    ('processing', {'nameFa': 'فرآیندپذیری', 'nameEn': 'Processing', 'sortOrder': 10}),
    ('thermal', {'nameFa': 'خواص حرارتی', 'nameEn': 'Thermal', 'sortOrder': 20}),
    ('mechanical', {'nameFa': 'خواص مکانیکی', 'nameEn': 'Mechanical', 'sortOrder': 30}),
    ('physical', {'nameFa': 'خواص فیزیکی', 'nameEn': 'Physical', 'sortOrder': 40}),
    ('electrical', {'nameFa': 'خواص الکتریکی', 'nameEn': 'Electrical', 'sortOrder': 50}),
    ('academic', {'nameFa': 'اطلاعات علمی و مولکولی', 'nameEn': 'Academic', 'sortOrder': 60}),
]

FAMILY_MAP = {}

def main():
    global FAMILY_MAP
    os.makedirs(FIXTURES_DIR, exist_ok=True)
    with open(os.path.join(PUBLIC_DIR, 'search-materials.json')) as f:
        search_materials = json.load(f)
    with open(os.path.join(PUBLIC_DIR, 'search-properties.json')) as f:
        search_properties = json.load(f)

    for m in search_materials['materials']:
        FAMILY_MAP[m['familyKey']] = {
            'nameFa': m['familyNameFa'],
            'nameEn': m['familyNameEn']
        }
    
    materials_list = []
    for m in search_materials['materials']:
        cov_pct = float(m['citationCoveragePct'])
        field = 'thermosets' if m['familyKey'] in ('epoxies', 'synthetic-rubbers') else 'thermoplastics'
        materials_list.append({
            'slug': m['slug'],
            'nameFa': m['nameFa'],
            'nameEn': m['nameEn'],
            'code': None,
            'field': field,
            'family': m['familyKey'],
            'familyNameFa': m['familyNameFa'],
            'familyNameEn': m['familyNameEn'],
            'status': 'published',
            'citationCoverage': cov_pct,
        })
    materials_response = {'data': materials_list, 'total': len(materials_list), 'limit': 200, 'offset': 0}
    with open(os.path.join(FIXTURES_DIR, 'materials-list.json'), 'w') as f:
        json.dump(materials_response, f, ensure_ascii=False, indent=2)
    print('materials-list.json: %d materials' % len(materials_list))
    
    groups = {}
    for gkey, _ in GROUP_META_LIST:
        groups[gkey] = []
    for p in search_properties['properties']:
        gkey = PROPERTY_GROUP_MAP.get(p['key'], 'academic')
        if gkey not in groups:
            groups[gkey] = []
        unit = p.get('unit') or None
        prop_def = {
            'key': p['key'],
            'nameFa': p['nameFa'],
            'nameEn': p['nameEn'],
            'descriptionFa': None,
            'descriptionEn': None,
            'symbol': p.get('symbol'),
            'dataType': p['dataType'],
            'unit': unit,
            'allowedUnits': [unit] if unit else [],
            'isSearchable': True,
            'isComparable': p['dataType'] in ('numeric', 'range'),
            'appliesToFields': [],
            'appliesToFamilies': [],
        }
        groups[gkey].append(prop_def)
    
    result = []
    total_props = 0
    for gkey, meta in GROUP_META_LIST:
        props = groups.get(gkey, [])
        total_props += len(props)
        result.append({'key': gkey, 'nameFa': meta['nameFa'], 'nameEn': meta['nameEn'], 'properties': props})
    properties_response = {'data': result, 'total': total_props}
    with open(os.path.join(FIXTURES_DIR, 'properties.json'), 'w') as f:
        json.dump(properties_response, f, ensure_ascii=False, indent=2)
    print('properties.json: %d properties in %d groups' % (total_props, len(result)))
    
    coverage_data = []
    for m in search_materials['materials']:
        cov_pct = float(m['citationCoveragePct'])
        coverage_data.append({
            'slug': m['slug'],
            'nameFa': m['nameFa'],
            'nameEn': m['nameEn'],
            'totalValues': len(m['values']),
            'citedValues': 0,
            'coveragePct': cov_pct,
        })
    coverage_response = {'data': coverage_data}
    with open(os.path.join(FIXTURES_DIR, 'coverage.json'), 'w') as f:
        json.dump(coverage_response, f, ensure_ascii=False, indent=2)
    print('coverage.json: %d materials' % len(coverage_data))
    
    for m in search_materials['materials']:
        s = m['slug']
        family_info = FAMILY_MAP.get(m['familyKey'], {'nameFa': m['familyNameFa'], 'nameEn': m['familyNameEn']})
        field_key = 'thermosets' if m['familyKey'] in ('epoxies', 'synthetic-rubbers') else 'thermoplastics'
        
        property_groups = []
        for gkey, meta in GROUP_META_LIST:
            group_props = []
            for search_prop in search_properties['properties']:
                if PROPERTY_GROUP_MAP.get(search_prop['key'], 'academic') != gkey:
                    continue
                value_data = m['values'].get(search_prop['key'])
                if value_data:
                    vmin = value_data.get('valueMin')
                    vmax = value_data.get('valueMax')
                    vtyp = value_data.get('valueTypical')
                    unit = search_prop.get('unit') or ''
                    display_parts = []
                    if vmin is not None and vmax is not None and vmin != vmax:
                        display_parts.append(str(vmin) + ' - ' + str(vmax))
                    elif vmin is not None:
                        display_parts.append(str(vmin))
                    elif vmax is not None:
                        display_parts.append(str(vmax))
                    if vtyp is not None:
                        display_parts.append('typical: ' + str(vtyp))
                    if unit and display_parts:
                        display_parts[-1] = display_parts[-1] + ' ' + unit
                    elif unit:
                        display_parts.append(unit)
                    display = ' '.join(display_parts) if display_parts else None
                    pv = {
                        'key': search_prop['key'],
                        'nameFa': search_prop['nameFa'],
                        'nameEn': search_prop['nameEn'],
                        'symbol': search_prop.get('symbol'),
                        'dataType': search_prop['dataType'],
                        'valueMin': vmin,
                        'valueMax': vmax,
                        'valueTypical': vtyp,
                        'valueTextFa': None,
                        'valueTextEn': None,
                        'valueEnum': None,
                        'valueBool': None,
                        'qualifier': None,
                        'unit': unit if unit else None,
                        'display': display,
                        'status': 'unsourced',
                        'citations': [],
                    }
                    group_props.append(pv)
            if group_props:
                property_groups.append({
                    'key': gkey,
                    'nameFa': meta['nameFa'],
                    'nameEn': meta['nameEn'],
                    'properties': group_props,
                })
        
        total_values = len(m['values'])
        cov_pct = float(m['citationCoveragePct'])
        field_name_fa = 'پلیمرهای مهندسی' if field_key == 'thermoplastics' else 'گرما سخت‌ها'
        field_en = 'Thermoplastics' if field_key == 'thermoplastics' else 'Thermosets'
        detail = {
            'slug': m['slug'],
            'nameFa': m['nameFa'],
            'nameEn': m['nameEn'],
            'code': None,
            'status': 'published',
            'overviewFa': None,
            'overviewEn': None,
            'discoveryYear': None,
            'chainType': None,
            'field': {'key': field_key, 'nameFa': field_name_fa, 'nameEn': field_en},
            'family': {'key': m['familyKey'], 'nameFa': family_info['nameFa'], 'nameEn': family_info['nameEn']},
            'coverage': {'totalValues': total_values, 'citedValues': 0, 'coveragePct': cov_pct},
            'identifiers': {},
            'propertyGroups': property_groups,
            'chemicalResistance': [],
            'marketShare': [],
            'structure': None,
            'processingTechniques': [],
            'gradeClasses': [],
        }
        filename = 'material-' + s + '.json'
        with open(os.path.join(FIXTURES_DIR, filename), 'w') as f:
            json.dump(detail, f, ensure_ascii=False, indent=2)
        ng = len(detail['propertyGroups'])
        np = sum(len(g['properties']) for g in detail['propertyGroups'])
        print('  ' + filename + ': %d groups, %d properties' % (ng, np))
    
    print('')
    print('All fixtures written to ' + FIXTURES_DIR)

if __name__ == '__main__':
    main()
