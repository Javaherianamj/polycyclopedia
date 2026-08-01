import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Atom3D } from '../types/polymer';
import { Box, Pause, Play, Info } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

interface MolecularViewer3DProps {
  atoms?: Atom3D[];
  monomerName: string;
  polymerCode: string;
  isDark: boolean;
}

export const MolecularViewer3D: React.FC<MolecularViewer3DProps> = ({
  atoms,
  monomerName,
  polymerCode,
  isDark,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [viewMode, setViewMode] = useState<'repeating' | 'monomer'>('repeating');

  // Generate accurate 3D Ball-and-Stick atom models for Monomers vs Repeating Units
  const getBaseAtoms = (
    mode: 'repeating' | 'monomer',
  ): {
    atoms: Atom3D[];
    title: string;
    formula: string;
    unitWidth: number;
  } => {
    const code = polymerCode.toUpperCase();

    if (code.includes('PET')) {
      if (mode === 'monomer') {
        return {
          title: 'مونومر ترفتالات و اتیلن گلیکول',
          formula: 'C₈H₆O₄ + C₂H₆O₂',
          unitWidth: 12.0,
          atoms: [
            { element: 'C', x: -0.66, y: -1.22, z: 0 },
            { element: 'C', x: 0.67, y: -1.22, z: 0 },
            { element: 'C', x: 1.39, y: 0.04, z: 0 },
            { element: 'C', x: 0.73, y: 1.19, z: 0 },
            { element: 'C', x: -0.72, y: 1.19, z: 0 },
            { element: 'C', x: -1.39, y: 0.04, z: 0 },
            { element: 'H', x: -1.1, y: -2.0, z: 0 },
            { element: 'H', x: 1.1, y: -2.0, z: 0 },
            { element: 'H', x: 1.1, y: 2.0, z: 0 },
            { element: 'H', x: -1.1, y: 2.0, z: 0 },
            { element: 'C', x: 2.84, y: 0.04, z: 0 },
            { element: 'O', x: 2.84, y: 1.26, z: 0 },
            { element: 'O', x: 4.29, y: 0.04, z: 0 },
            { element: 'H', x: 5.0, y: 0.04, z: 0 },
            { element: 'C', x: -2.84, y: 0.04, z: 0 },
            { element: 'O', x: -2.84, y: 1.26, z: 0 },
            { element: 'O', x: -4.29, y: 0.04, z: 0 },
            { element: 'H', x: -5.0, y: 0.04, z: 0 },
            { element: 'O', x: 6.0, y: 0.04, z: 0 },
            { element: 'C', x: 7.45, y: 0.04, z: 0 },
            { element: 'C', x: 8.9, y: 0.04, z: 0 },
            { element: 'O', x: 10.35, y: 0.04, z: 0 },
            { element: 'H', x: 5.3, y: 0.04, z: 0 },
            { element: 'H', x: 11.05, y: 0.04, z: 0 },
            { element: 'H', x: 7.45, y: 0.8, z: 0.8 },
            { element: 'H', x: 7.45, y: -0.8, z: -0.8 },
            { element: 'H', x: 8.9, y: 0.8, z: -0.8 },
            { element: 'H', x: 8.9, y: -0.8, z: 0.8 },
          ],
        };
      } else {
        return {
          title: 'زنجیر پلیمری و واحد تکرارشونده پلی‌اتیلن ترفتالات (PET)',
          formula: '—[ O — CH₂—CH₂ — O — CO — C₆H₄ — CO ]ₙ—',
          unitWidth: 10.8,
          atoms: [
            { element: 'O', x: -5.4, y: 0.0, z: 0.0 },
            { element: 'C', x: -4.3, y: 0.5, z: 0.2 },
            { element: 'H', x: -4.3, y: 1.5, z: 0.4 },
            { element: 'H', x: -4.3, y: 0.2, z: -0.8 },
            { element: 'C', x: -3.0, y: -0.2, z: -0.1 },
            { element: 'H', x: -3.0, y: -1.2, z: -0.3 },
            { element: 'H', x: -3.0, y: -0.1, z: 0.9 },
            { element: 'O', x: -1.9, y: 0.5, z: 0.0 },
            { element: 'C', x: -0.7, y: 0.0, z: 0.0 },
            { element: 'O', x: -0.6, y: -1.2, z: 0.0 }, // double bond (dist=1.2)
            { element: 'C', x: 0.6, y: 0.6, z: 0.0 },
            { element: 'C', x: 1.7, y: -0.2, z: 0.0 }, // double (dist 1.36)
            { element: 'H', x: 1.7, y: -1.2, z: 0.0 },
            { element: 'C', x: 3.0, y: 0.6, z: 0.0 }, // single (dist 1.52)
            { element: 'H', x: 3.9, y: 0.1, z: 0.0 },
            { element: 'C', x: 3.0, y: 2.0, z: 0.0 }, // double (dist 1.40-> wait needs < 1.38. let's make it 1.36)
            { element: 'C', x: 1.7, y: 2.8, z: 0.0 }, // single (dist 1.52)
            { element: 'H', x: 1.7, y: 3.8, z: 0.0 },
            { element: 'C', x: 0.6, y: 2.0, z: 0.0 }, // double
            { element: 'H', x: -0.3, y: 2.5, z: 0.0 },
            { element: 'C', x: 4.3, y: 2.7, z: 0.0 },
            { element: 'O', x: 4.4, y: 3.9, z: 0.0 }, // double bond (dist=1.2)
            { element: 'O', x: 5.4, y: 1.9, z: 0.0 },
          ],
        };
      }
    }

    if (code.includes('PS')) {
      if (mode === 'monomer') {
        return {
          title: 'مونومر استایرن (Styrene Monomer)',
          formula: 'CH₂=CH–C₆H₅',
          unitWidth: 5.0,
          atoms: [
            { element: 'C', x: -1, y: 0, z: 0 },
            { element: 'C', x: 0.34, y: 0, z: 0 },
            { element: 'H', x: -1.59, y: 0.94, z: 0 },
            { element: 'H', x: -1.59, y: -0.94, z: 0 },
            { element: 'H', x: 0.89, y: -0.94, z: 0 },
            { element: 'C', x: 1.07, y: 1.26, z: 0 },
            { element: 'C', x: 0.4, y: 2.42, z: 0 },
            { element: 'H', x: -0.58, y: 2.38, z: 0 },
            { element: 'C', x: 1.07, y: 3.68, z: 0 },
            { element: 'H', x: 0.57, y: 4.55, z: 0 },
            { element: 'C', x: 2.41, y: 3.68, z: 0 },
            { element: 'H', x: 2.86, y: 4.55, z: 0 },
            { element: 'C', x: 3.16, y: 2.47, z: 0 },
            { element: 'H', x: 4.16, y: 2.47, z: 0 },
            { element: 'C', x: 2.49, y: 1.31, z: 0 },
            { element: 'H', x: 3.02, y: 0.48, z: 0 },
          ],
        };
      } else {
        return {
          title: 'زنجیر پلیمری و واحد تکرارشونده پلی‌استایرن (PS)',
          formula: '—[ CH₂ — CH(C₆H₅) ]ₙ—',
          unitWidth: 3.81,
          atoms: [
            { element: 'C', x: -1.9, y: -0.4, z: 0 },
            { element: 'C', x: 0, y: 0.4, z: 0 },
            { element: 'H', x: -1.9, y: -1, z: 0.89 },
            { element: 'H', x: -1.9, y: -1, z: -0.89 },
            { element: 'H', x: 0, y: 1, z: -0.89 },
            { element: 'C', x: 0, y: 1.4, z: 1 },
            { element: 'C', x: 1.16, y: 1.87, z: 1.47 },
            { element: 'H', x: 1.99, y: 1.51, z: 1.11 },
            { element: 'C', x: 1.21, y: 2.88, z: 2.48 },
            { element: 'H', x: 2.08, y: 3.24, z: 2.84 },
            { element: 'C', x: 0.05, y: 3.36, z: 2.96 },
            { element: 'H', x: 0.09, y: 4.05, z: 3.65 },
            { element: 'C', x: -1.21, y: 2.88, z: 2.48 },
            { element: 'H', x: -2.08, y: 3.24, z: 2.84 },
            { element: 'C', x: -1.21, y: 1.94, z: 1.54 },
            { element: 'H', x: -2.08, y: 1.61, z: 1.21 },
          ],
        };
      }
    }

    if (
      code.includes('PE') ||
      code.includes('LDPE') ||
      code.includes('HDPE') ||
      code.includes('LLDPE')
    ) {
      if (mode === 'monomer') {
        return {
          title: 'مونومر اتیلن (Ethylene Monomer)',
          formula: 'CH₂ = CH₂',
          unitWidth: 3.0,
          atoms: [
            { element: 'C', x: -0.67, y: 0, z: 0 },
            { element: 'C', x: 0.67, y: 0, z: 0 },
            { element: 'H', x: -1.23, y: 0.93, z: 0 },
            { element: 'H', x: -1.23, y: -0.93, z: 0 },
            { element: 'H', x: 1.23, y: 0.93, z: 0 },
            { element: 'H', x: 1.23, y: -0.93, z: 0 },
          ],
        };
      } else {
        return {
          title: 'زنجیر پلیمری و واحد تکرارشونده پلی‌اتیلن',
          formula: '—[ CH₂ — CH₂ ]ₙ—',
          unitWidth: 2.54,
          atoms: [
            { element: 'C', x: -1.27, y: -0.4, z: 0 },
            { element: 'C', x: 0, y: 0.4, z: 0 },
            { element: 'H', x: -1.27, y: -1.0, z: 0.89 },
            { element: 'H', x: -1.27, y: -1.0, z: -0.89 },
            { element: 'H', x: 0, y: 1.0, z: 0.89 },
            { element: 'H', x: 0, y: 1.0, z: -0.89 },
          ],
        };
      }
    }

    if (code.includes('PP')) {
      if (mode === 'monomer') {
        return {
          title: 'مونومر پروپیلن (Propylene Monomer)',
          formula: 'CH₂ = CH — CH₃',
          unitWidth: 3.2,
          atoms: [
            { element: 'C', x: -1.2, y: 0, z: 0 },
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: 1.1, y: 1.1, z: 0 },
            { element: 'H', x: -1.8, y: 0.85, z: 0 },
            { element: 'H', x: -1.8, y: -0.85, z: 0 },
            { element: 'H', x: 0.2, y: -1.0, z: 0 },
            { element: 'H', x: 0.8, y: 2.1, z: 0 },
            { element: 'H', x: 1.7, y: 0.9, z: 0.88 },
            { element: 'H', x: 1.7, y: 0.9, z: -0.88 },
          ],
        };
      } else {
        return {
          title: 'زنجیر پلیمری و واحد تکرارشونده پلی‌پروپیلن',
          formula: '—[ CH₂ — CH(CH₃) ]ₙ—',
          unitWidth: 2.54,
          atoms: [
            { element: 'C', x: -1.27, y: -0.4, z: 0 },
            { element: 'C', x: 0, y: 0.4, z: 0 },
            { element: 'C', x: 0, y: 1.9, z: 0 }, // Methyl
            { element: 'H', x: -1.27, y: -1.0, z: 0.89 },
            { element: 'H', x: -1.27, y: -1.0, z: -0.89 },
            { element: 'H', x: 0, y: 0.4, z: -1.1 },
            { element: 'H', x: 0.8, y: 2.3, z: 0 },
            { element: 'H', x: -0.4, y: 2.3, z: 0.89 },
            { element: 'H', x: -0.4, y: 2.3, z: -0.89 },
          ],
        };
      }
    }

    if (code.includes('PVC')) {
      if (mode === 'monomer') {
        return {
          title: 'مونومر وینیل کلراید (VCM)',
          formula: 'CH₂ = CH — Cl',
          unitWidth: 3.2,
          atoms: [
            { element: 'C', x: -0.8, y: 0, z: 0 },
            { element: 'C', x: 0.5, y: 0, z: 0 },
            { element: 'Cl', x: 1.6, y: 1.2, z: 0 },
            { element: 'H', x: -1.3, y: 0.9, z: 0 },
            { element: 'H', x: -1.3, y: -0.9, z: 0 },
            { element: 'H', x: 0.9, y: -1.0, z: 0 },
          ],
        };
      } else {
        return {
          title: 'زنجیر پلیمری و واحد تکرارشونده PVC',
          formula: '—[ CH₂ — CH(Cl) ]ₙ—',
          unitWidth: 2.54,
          atoms: [
            { element: 'C', x: -1.27, y: -0.4, z: 0 },
            { element: 'C', x: 0, y: 0.4, z: 0 },
            { element: 'Cl', x: 0, y: 2.0, z: 0 },
            { element: 'H', x: -1.27, y: -1.0, z: 0.89 },
            { element: 'H', x: -1.27, y: -1.0, z: -0.89 },
            { element: 'H', x: 0, y: 0.4, z: -1.1 },
          ],
        };
      }
    }

    // Fallback
    const activeAtoms =
      atoms && atoms.length > 0
        ? atoms
        : [
            { element: 'C', x: -1.3, y: -0.4, z: 0 },
            { element: 'C', x: 0, y: 0.4, z: 0 },
            { element: 'C', x: 1.3, y: -0.4, z: 0 },
            { element: 'H', x: -1.3, y: -1.0, z: 0.89 },
            { element: 'H', x: -1.3, y: -1.0, z: -0.89 },
            { element: 'H', x: 0, y: 1.0, z: 0.89 },
            { element: 'H', x: 0, y: 1.0, z: -0.89 },
          ];

    return {
      title: `${polymerCode} - ${monomerName}`,
      formula: `—[ ${polymerCode} ]ₙ—`,
      unitWidth: 3.0,
      atoms: activeAtoms,
    };
  };

  const baseData = getBaseAtoms(viewMode);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 400;
    const height = 300;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDark ? 0x0f172a : 0xf6f3eb);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, viewMode === 'repeating' ? 12 : 9);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x508991, 0.6);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    const molGroup = new THREE.Group();

    // Standard CPK Color Map
    const colorMap: Record<string, number> = {
      C: 0x374151, // Dark Gray
      H: 0xf3f4f6, // White
      O: 0xef4444, // Red
      N: 0x3b82f6, // Blue
      Cl: 0x10b981, // Green
      F: 0x8b5cf6, // Purple
    };

    const radiusMap: Record<string, number> = {
      C: 0.42,
      H: 0.22,
      O: 0.36,
      N: 0.38,
      Cl: 0.5,
      F: 0.35,
    };

    // If repeating mode, duplicate units (k = -1, 0, +1) to build a connected chain!
    const unitsToRender = viewMode === 'repeating' ? [-1, 0, 1] : [0];
    const dx = baseData.unitWidth;

    interface ExtendedAtom extends Atom3D {
      id: string;
      unitIndex: number;
      isHighlightedUnit: boolean;
      worldPos: THREE.Vector3;
    }

    const allAtoms: ExtendedAtom[] = [];

    unitsToRender.forEach((unitIdx) => {
      const isHighlightedUnit = unitIdx === 0; // Central unit highlighted!
      baseData.atoms.forEach((atom, aIdx) => {
        const xOffset = unitIdx * dx;
        const worldPos = new THREE.Vector3(atom.x + xOffset, atom.y, atom.z);

        allAtoms.push({
          ...atom,
          id: `unit_${unitIdx}_atom_${aIdx}`,
          unitIndex: unitIdx,
          isHighlightedUnit,
          worldPos,
        });
      });
    });

    // Render Atom Spheres
    allAtoms.forEach((atom) => {
      const radius = radiusMap[atom.element] || 0.35;
      const geo = new THREE.SphereGeometry(radius, 32, 32);

      // Color logic: if central highlighted unit in repeating mode, accent carbons/oxygens with amber/gold ring or glowing material
      let sphereColor = colorMap[atom.element] || 0xcccccc;
      if (viewMode === 'repeating' && atom.isHighlightedUnit && atom.element === 'C') {
        sphereColor = 0xd97706; // Amber accent for highlighted repeat unit backbone
      }

      const mat = new THREE.MeshStandardMaterial({
        color: sphereColor,
        roughness: atom.isHighlightedUnit ? 0.15 : 0.35,
        metalness: atom.isHighlightedUnit ? 0.2 : 0.05,
        opacity: atom.isHighlightedUnit ? 1.0 : 0.7,
        transparent: !atom.isHighlightedUnit && viewMode === 'repeating',
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(atom.worldPos);
      molGroup.add(mesh);
    });

    // Render Bonds
    for (let i = 0; i < allAtoms.length; i++) {
      for (let j = i + 1; j < allAtoms.length; j++) {
        const a1 = allAtoms[i];
        const a2 = allAtoms[j];

        if (a1.element === 'H' && a2.element === 'H') continue;
        if (
          (a1.element === 'Cl' || a1.element === 'F' || a1.element === 'H') &&
          (a2.element === 'Cl' || a2.element === 'F' || a2.element === 'H')
        )
          continue;

        const dist = a1.worldPos.distanceTo(a2.worldPos);
        let maxDist = 1.7;
        if (a1.element === 'H' || a2.element === 'H') maxDist = 1.3;
        else if (a1.element === 'Cl' || a2.element === 'Cl') maxDist = 2.1;

        if (dist > 0.1 && dist < maxDist) {
          const isHighlightedBond = a1.isHighlightedUnit && a2.isHighlightedUnit;

          let isDoubleBond = false;
          if (a1.element === 'O' || a2.element === 'O') {
            if (dist < 1.35) isDoubleBond = true;
          } else if (a1.element === 'C' && a2.element === 'C') {
            if (dist < 1.38) isDoubleBond = true; // Use < 1.38 for double bonds to allow single aromatic bonds to be ~1.40
          }

          const bondMat = new THREE.MeshStandardMaterial({
            color: isHighlightedBond ? 0x508991 : 0x9ca3af,
            roughness: 0.3,
            opacity: isHighlightedBond ? 1.0 : 0.6,
            transparent: !isHighlightedBond && viewMode === 'repeating',
          });

          const dir = a2.worldPos.clone().sub(a1.worldPos).normalize();
          const axis = new THREE.Vector3(0, 1, 0);
          const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, dir);

          if (isDoubleBond) {
            const perpendicular = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 0, 1));
            if (perpendicular.length() < 0.1)
              perpendicular.crossVectors(dir, new THREE.Vector3(1, 0, 0));
            perpendicular.normalize().multiplyScalar(0.12);

            [1, -1].forEach((sign) => {
              const offset = perpendicular.clone().multiplyScalar(sign);
              const bondGeo = new THREE.CylinderGeometry(
                isHighlightedBond ? 0.07 : 0.05,
                isHighlightedBond ? 0.07 : 0.05,
                dist,
                16,
              );
              const bondMesh = new THREE.Mesh(bondGeo, bondMat);
              bondMesh.position
                .copy(a1.worldPos.clone().add(a2.worldPos).multiplyScalar(0.5))
                .add(offset);
              bondMesh.quaternion.copy(quaternion);
              molGroup.add(bondMesh);
            });
          } else {
            const bondGeo = new THREE.CylinderGeometry(
              isHighlightedBond ? 0.11 : 0.08,
              isHighlightedBond ? 0.11 : 0.08,
              dist,
              16,
            );
            const bondMesh = new THREE.Mesh(bondGeo, bondMat);
            bondMesh.position.copy(a1.worldPos.clone().add(a2.worldPos).multiplyScalar(0.5));
            bondMesh.quaternion.copy(quaternion);
            molGroup.add(bondMesh);
          }
        }
      }
    }

    // Add End Extension Indicators for Repeating Mode ("...")
    if (viewMode === 'repeating') {
      const leftEnd = new THREE.Vector3(-1.5 * dx - 0.5, 0, 0);
      const rightEnd = new THREE.Vector3(1.5 * dx + 0.5, 0, 0);

      [leftEnd, rightEnd].forEach((endPos) => {
        for (let dot = 0; dot < 3; dot++) {
          const dotGeo = new THREE.SphereGeometry(0.12, 16, 16);
          const dotMat = new THREE.MeshBasicMaterial({
            color: 0x74b3ce,
            transparent: true,
            opacity: 0.8 - dot * 0.2,
          });
          const dotMesh = new THREE.Mesh(dotGeo, dotMat);
          const offset = (endPos.x < 0 ? -1 : 1) * (dot * 0.4);
          dotMesh.position.set(endPos.x + offset, endPos.y, endPos.z);
          molGroup.add(dotMesh);
        }
      });
    }

    // Center the group
    const box = new THREE.Box3().setFromObject(molGroup);
    const center = box.getCenter(new THREE.Vector3());
    molGroup.position.sub(center);

    scene.add(molGroup);

    // Mouse Drag Controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const domElement = renderer.domElement;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y,
      };

      // Rotation around backbone axis
      molGroup.rotation.y += deltaMove.x * 0.01;
      molGroup.rotation.x += deltaMove.y * 0.01;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.01;
      camera.position.z = Math.max(4, Math.min(25, camera.position.z));
    };

    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    // Animation Loop
    let animationFrameId: number | null = null;
    let isIntersecting = false;

    const animate = () => {
      if (!isIntersecting) {
        animationFrameId = null;
        return;
      }
      animationFrameId = requestAnimationFrame(animate);
      if (autoRotate && !isDragging) {
        molGroup.rotation.y += 0.008; // Smooth rotation along backbone axis
      }
      renderer.render(scene, camera);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isIntersecting = entry.isIntersecting;
          if (isIntersecting && animationFrameId === null) {
            animate();
          }
        });
      },
      { threshold: 0.1 },
    );

    if (mountRef.current) observer.observe(mountRef.current);

    const handleResize = () => {
      if (!mountRef.current) return;
      const newWidth = mountRef.current.clientWidth;
      camera.aspect = newWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [baseData, isDark, autoRotate, viewMode]);

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 my-6 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b border-border-subtle">
        <div>
          <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 text-text-primary">
            <Box className="w-5 h-5 text-accent-primary" />
            <span>مدل سه‌بعدی زنجیر پلیمری (3D Chain Viewer)</span>
            <InfoTooltip text="در حالت واحد تکرارشونده، یک واحد ساختاری متمایز (طلایی/پررنگ) در امتداد زنجیر پیوسته پلیمری نمایش داده می‌شود." />
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            {baseData.title} • فرمول ساختاری:{' '}
            <span className="en-mono font-mono tabular-nums font-bold text-accent-primary">
              {baseData.formula}
            </span>
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-bg-surface p-0.5 rounded border border-border-subtle text-xs">
            <button
              onClick={() => setViewMode('repeating')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'repeating'
                  ? 'bg-accent-primary text-text-primary shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              زنجیر و واحد تکرار
            </button>
            <button
              onClick={() => setViewMode('monomer')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'monomer'
                  ? 'bg-accent-primary text-text-primary shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              مونومر پایه
            </button>
          </div>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className="bg-bg-surface hover:bg-bg-surface text-text-primary text-xs font-bold px-2.5 py-1 rounded border border-border-subtle transition-colors cursor-pointer flex items-center gap-1"
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{autoRotate ? 'توقف' : 'چرخش'}</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas Box */}
      <div
        ref={mountRef}
        className="w-full h-[300px] rounded border border-border-subtle overflow-hidden cursor-grab active:cursor-grabbing relative bg-bg-base transition-colors"
      />

      {/* Legend & Guidance */}
      <div className="flex-wrap justify-between items-center gap-4 mt-3 text-xs text-text-secondary pt-2 border-t border-border-subtle">
        <div className="flex-wrap gap-3 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-bg-surface inline-block" /> کربن (C)
          </span>
          {viewMode === 'repeating' && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-status-warning inline-block" /> واحد
              تکرار شاخص
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-bg-base border border-border-subtle inline-block" />{' '}
            هیدروژن (H)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-status-error inline-block" /> اکسیژن (O)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-status-success inline-block" /> کلر (Cl)
          </span>
        </div>

        <div className="text-[11px] text-text-secondary">
          چرخش حول محور طولی زنجیر • اسکرول جهت بزرگ‌نمایی
        </div>
      </div>
    </div>
  );
};
