import { ContactShadows, Html, OrbitControls, Sparkles } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getLocationState } from './sceneStates.js';

export const LODGES = Object.freeze([
  {
    id: 'one-wood-lodge',
    name: 'One Wood Lodge',
    type: 'Timber lodge and watchtower',
    sourceSlug: 'cabins',
    description: 'A broad pine lodge with a narrow watchtower above the roofline. Its bell carries across Mirror Lake when the weather turns or the woods become restless.',
  },
  {
    id: 'driftwood-houseboat',
    name: 'Driftwood Houseboat',
    type: 'Floating student lodge',
    sourceSlug: 'boathouse',
    description: 'A cedar houseboat moored in the sheltered water. It rocks gently at night, though students insist it sometimes wakes at a different dock than the one where it went to sleep.',
  },
  {
    id: 'white-pine-treefort',
    name: 'White Pine Treefort',
    type: 'Canopy lodge',
    sourceSlug: 'old-pines',
    description: 'A many-level lodge held in the arms of three old pines. Rope bridges, lantern windows, and a stubborn resident squirrel connect its rooms above the forest floor.',
  },
]);

const LAKE_OUTLINE = [
  [-5.5, -4.2], [-3.4, -5.7], [-0.4, -6.1], [2.8, -5.2], [4.8, -3.4],
  [4.4, -1.2], [5.7, 1.1], [4.8, 4.2], [2.4, 5.7], [-0.2, 5.3],
  [-2.9, 6.3], [-5.0, 4.5], [-4.5, 2.4], [-6.0, 0.2], [-5.2, -2.0],
];

const TERRAIN_OUTLINE = [
  [-12.5, -8.5], [-9.5, -10], [-4.2, -9.6], [0.4, -10.1], [5.6, -9.5],
  [10.8, -9.7], [12.7, -6.8], [12.3, -1.5], [12.8, 3.5], [11.2, 8.7],
  [6.2, 9.6], [1.4, 9.2], [-3.4, 9.8], [-8.3, 9.1], [-12.6, 6.4], [-12.2, 1.1],
];

const TREE_POSITIONS = [
  [-10.8, 0.25, -6.8, 1.15], [-8.3, 0.25, -7.7, 0.82], [-5.8, 0.25, -8.3, 1.08],
  [-2.4, 0.25, -8.5, 0.72], [1.1, 0.25, -8.7, 1.12], [4.6, 0.25, -8.1, 0.86],
  [8.4, 0.25, -7.7, 1.18], [10.5, 0.25, -5.2, 0.88], [10.7, 0.25, -1.6, 1.03],
  [10.8, 0.25, 2.1, 0.74], [10.0, 0.25, 6.2, 1.08], [6.8, 0.25, 7.8, 0.9],
  [3.3, 0.25, 8.1, 1.2], [-0.5, 0.25, 8.0, 0.78], [-4.2, 0.25, 8.2, 1.12],
  [-7.6, 0.25, 7.5, 0.86], [-10.3, 0.25, 5.1, 1.15], [-10.8, 0.25, 1.6, 0.76],
  [-10.1, 0.25, -1.5, 0.68], [-7.0, 0.25, 5.5, 0.7], [7.2, 0.25, 5.9, 0.66],
  [-6.4, 0.25, -5.9, 0.62], [6.2, 0.25, -6.1, 0.7], [9.1, 0.25, 4.0, 0.58],
];

const SHORE_ROCKS = [
  [-5.3, -3.7, 0.28], [-5.6, 0.4, 0.22], [-4.2, 3.0, 0.34], [-2.4, 5.8, 0.24],
  [1.8, 5.4, 0.3], [4.9, 3.2, 0.2], [5.0, 0.7, 0.32], [4.4, -3.6, 0.24],
  [1.8, -5.5, 0.27], [-2.9, -5.4, 0.2],
];

const COLORS = {
  day: {
    background: '#9fb6ab',
    fog: '#b8c5b7',
    ambient: '#d9e4c9',
    sun: '#ffd899',
    water: '#183d43',
    shore: '#65714f',
    pine: '#234d39',
  },
  curfew: {
    background: '#0d1720',
    fog: '#34434a',
    ambient: '#74849c',
    sun: '#9db3d8',
    water: '#071d25',
    shore: '#303b32',
    pine: '#102d25',
  },
  emergency: {
    background: '#07101b',
    fog: '#213849',
    ambient: '#587291',
    sun: '#7293bb',
    water: '#041722',
    shore: '#273334',
    pine: '#0d2928',
  },
};

function WindowLight({ position, rotation, scale = [0.4, 0.55, 0.08], lighting, isNight }) {
  const materialRef = useRef();

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    let intensity = isNight ? 3.4 : 0.18;
    if (lighting === 'dark') intensity = 0;
    if (lighting === 'flickering') {
      const t = clock.elapsedTime;
      intensity = Math.sin(t * 19) > 0.15 ? 4.8 : 0.08;
      if (Math.sin(t * 7.3) > 0.78) intensity = 1.2;
    }
    materialRef.current.emissiveIntensity = intensity;
  });

  return (
    <mesh position={position} rotation={rotation} scale={scale} castShadow>
      <boxGeometry />
      <meshStandardMaterial
        ref={materialRef}
        color="#f3ba5b"
        emissive="#ff9d32"
        roughness={0.45}
      />
    </mesh>
  );
}

function SelectionRing({ selected, radius = 2, height = 0.06 }) {
  if (!selected) return null;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, height, 0]}>
      <ringGeometry args={[radius, radius + 0.09, 48]} />
      <meshBasicMaterial color="#f4d58d" transparent opacity={0.85} side={THREE.DoubleSide} />
    </mesh>
  );
}

function LodgeLabel({ name, position }) {
  return (
    <Html position={position} center className="map-label" style={{ pointerEvents: 'none' }}>
      {name}
    </Html>
  );
}

function ClickableLodge({
  lodge,
  selected,
  onSelect,
  children,
  position,
  labelPosition = [0, 3.5, 0],
  selectionHeight = 0.06,
}) {
  return (
    <group
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(lodge.id);
      }}
      onPointerEnter={(event) => {
        event.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerLeave={() => {
        document.body.style.cursor = 'default';
      }}
    >
      {children}
      <SelectionRing selected={selected} height={selectionHeight} />
      <LodgeLabel name={lodge.name} position={labelPosition} />
    </group>
  );
}

function GableRoof({ width, depth, height, position, color = '#3f4930' }) {
  const panelLength = Math.hypot(width / 2, height);
  const angle = Math.atan2(height, width / 2);
  return (
    <group position={position}>
      <mesh position={[-width / 4, 0, 0]} rotation={[0, 0, angle]} castShadow>
        <boxGeometry args={[panelLength, 0.18, depth]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      <mesh position={[width / 4, 0, 0]} rotation={[0, 0, -angle]} castShadow>
        <boxGeometry args={[panelLength, 0.18, depth]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      <mesh position={[0, height / 2 + 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.11, depth + 0.1, 8]} />
        <meshStandardMaterial color="#20241d" roughness={1} />
      </mesh>
    </group>
  );
}

function FrontRailing({ width, y, z, position = [0, 0, 0] }) {
  const posts = [-width / 2, -width / 4, 0, width / 4, width / 2];
  return (
    <group position={position}>
      <mesh position={[0, y + 0.38, z]} castShadow>
        <boxGeometry args={[width, 0.08, 0.08]} />
        <meshStandardMaterial color="#5a3b25" roughness={1} />
      </mesh>
      {posts.map((x) => (
        <mesh key={x} position={[x, y + 0.2, z]} castShadow>
          <cylinderGeometry args={[0.035, 0.05, 0.52, 6]} />
          <meshStandardMaterial color="#67462b" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function HangingLantern({ position, lit = true }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.75, 6]} />
        <meshStandardMaterial color="#2c241d" />
      </mesh>
      <mesh>
        <boxGeometry args={[0.2, 0.3, 0.2]} />
        <meshStandardMaterial color="#2b251e" roughness={0.7} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.075, 8, 6]} />
        <meshBasicMaterial color={lit ? '#ffc15c' : '#4b4940'} toneMapped={false} />
      </mesh>
      {lit && <pointLight color="#ffae43" intensity={2.8} distance={3} decay={2} />}
    </group>
  );
}

function Ladder({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} position={[x, 0, 0]} castShadow>
          <boxGeometry args={[0.09, 2.7, 0.09]} />
          <meshStandardMaterial color="#755337" roughness={1} />
        </mesh>
      ))}
      {[-1, -0.5, 0, 0.5, 1].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.7, 6]} />
          <meshStandardMaterial color="#8a6744" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function OneWoodLodge({ lodge, locationState, selected, onSelect, isNight }) {
  const lighting = locationState.lighting;
  return (
    <ClickableLodge lodge={lodge} selected={selected} onSelect={onSelect} position={[-8.2, 0.08, -3.3]} labelPosition={[0, 4.8, 0]}>
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.15, 0.34, 2.8]} />
        <meshStandardMaterial color="#716957" roughness={1} />
      </mesh>
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 1.6, 2.5]} />
        <meshStandardMaterial color="#6d4127" roughness={0.92} />
      </mesh>
      <GableRoof width={4.4} depth={2.9} height={1.25} position={[0, 1.95, 0]} />
      {[-1.7, 1.7].map((x) => (
        <mesh key={x} position={[x, 0.95, 1.29]} castShadow>
          <boxGeometry args={[0.13, 1.55, 0.12]} />
          <meshStandardMaterial color="#3d281b" roughness={1} />
        </mesh>
      ))}
      <mesh position={[0, 1.55, 1.3]} castShadow>
        <boxGeometry args={[3.5, 0.12, 0.12]} />
        <meshStandardMaterial color="#3d281b" roughness={1} />
      </mesh>
      <mesh position={[-1.15, 2.75, 0.45]} castShadow>
        <boxGeometry args={[0.95, 3.6, 0.95]} />
        <meshStandardMaterial color="#52331f" roughness={0.95} />
      </mesh>
      <mesh position={[-1.15, 4.68, 0.45]} castShadow>
        <coneGeometry args={[0.9, 1.05, 8]} />
        <meshStandardMaterial color="#35432e" roughness={1} />
      </mesh>
      <mesh position={[-1.15, 3.78, 0.45]} castShadow>
        <cylinderGeometry args={[0.82, 0.82, 0.14, 10]} />
        <meshStandardMaterial color="#5c422b" roughness={1} />
      </mesh>
      <FrontRailing width={1.55} y={3.72} z={0.98} position={[-1.15, 0, 0]} />
      <mesh position={[-1.15, 5.45, 0.45]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 1, 6]} />
        <meshStandardMaterial color="#35291e" />
      </mesh>
      <mesh position={[-0.82, 5.68, 0.45]} rotation={[0, 0, -0.18]}>
        <boxGeometry args={[0.65, 0.28, 0.035]} />
        <meshStandardMaterial color="#9c7a37" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.6, 1.28]} castShadow>
        <boxGeometry args={[0.65, 1.2, 0.1]} />
        <meshStandardMaterial color="#261912" />
      </mesh>
      <WindowLight position={[-1.15, 1, 1.28]} lighting={lighting} isNight={isNight} />
      <WindowLight position={[1.15, 1, 1.28]} lighting={lighting} isNight={isNight} />
      <WindowLight position={[-1.15, 3.25, 0.94]} scale={[0.42, 0.48, 0.08]} lighting={lighting} isNight={isNight} />
      <mesh position={[0, 0.05, 1.85]} receiveShadow>
        <boxGeometry args={[1.4, 0.1, 1.2]} />
        <meshStandardMaterial color="#59432c" />
      </mesh>
      <FrontRailing width={3.5} y={0.08} z={1.85} />
    </ClickableLodge>
  );
}

function DriftwoodHouseboat({ lodge, locationState, selected, onSelect, isNight }) {
  const boatRef = useRef();
  useFrame(({ clock }) => {
    if (!boatRef.current) return;
    boatRef.current.position.y = 0.48 + Math.sin(clock.elapsedTime * 0.8) * 0.06;
    boatRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.55) * 0.012;
  });

  return (
    <ClickableLodge
      lodge={lodge}
      selected={selected}
      onSelect={onSelect}
      position={[0.8, 0, 1.5]}
      labelPosition={[0, 3.15, 0]}
      selectionHeight={0.28}
    >
      <group ref={boatRef}>
        <mesh position={[0, -0.06, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 0.44, 0.72]} castShadow>
          <capsuleGeometry args={[0.9, 2.8, 6, 12]} />
          <meshStandardMaterial color="#352820" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[4.15, 0.2, 2.15]} />
          <meshStandardMaterial color="#705037" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.85, 0]} castShadow>
          <boxGeometry args={[2.75, 1.5, 1.65]} />
          <meshStandardMaterial color="#8a6842" roughness={0.9} />
        </mesh>
        <GableRoof width={3.25} depth={2.05} height={0.95} position={[0, 1.75, 0]} color="#46503a" />
        <WindowLight position={[-0.75, 0.95, 0.84]} lighting={locationState.lighting} isNight={isNight} />
        <WindowLight position={[0.75, 0.95, 0.84]} lighting={locationState.lighting} isNight={isNight} />
        <mesh position={[1.85, 0.22, 0]} castShadow>
          <boxGeometry args={[0.45, 0.12, 2.65]} />
          <meshStandardMaterial color="#735537" />
        </mesh>
        <mesh position={[-1.95, -0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.12, 0.12, 1.1, 10]} />
          <meshStandardMaterial color="#796144" />
        </mesh>
        <FrontRailing width={3.9} y={0.3} z={1.02} />
        <mesh position={[-0.85, 2.25, -0.45]} castShadow>
          <boxGeometry args={[0.28, 1.2, 0.28]} />
          <meshStandardMaterial color="#4a3123" roughness={1} />
        </mesh>
        <mesh position={[1.45, 0.65, 1.08]}>
          <torusGeometry args={[0.27, 0.08, 8, 18]} />
          <meshStandardMaterial color="#b66a42" roughness={0.8} />
        </mesh>
        <HangingLantern position={[-1.75, 0.85, 1.08]} lit={isNight} />
      </group>
    </ClickableLodge>
  );
}

function WhitePineTreefort({ lodge, locationState, selected, onSelect, isNight }) {
  return (
    <ClickableLodge lodge={lodge} selected={selected} onSelect={onSelect} position={[7.8, 0.08, -3.7]} labelPosition={[0, 5.8, 0]}>
      {[-1.1, 0, 1.05].map((x, index) => (
        <group key={x} position={[x, 0, index === 1 ? -0.25 : 0.15]}>
          <mesh position={[0, 2.1, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.52, 4.4, 9]} />
            <meshStandardMaterial color="#4d3527" roughness={1} />
          </mesh>
          <mesh position={[0, 4.5, 0]} castShadow>
            <coneGeometry args={[1.25, 3.3, 9]} />
            <meshStandardMaterial color="#174234" roughness={0.96} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 2.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.35, 1.55, 2.1]} />
        <meshStandardMaterial color="#765033" roughness={0.92} />
      </mesh>
      <GableRoof width={3.8} depth={2.5} height={1.05} position={[0, 3.65, 0]} color="#455037" />
      <WindowLight position={[-0.88, 2.7, 1.08]} lighting={locationState.lighting} isNight={isNight} />
      <WindowLight position={[0.88, 2.7, 1.08]} lighting={locationState.lighting} isNight={isNight} />
      <mesh position={[0, 1.65, 1.4]} castShadow>
        <boxGeometry args={[3.9, 0.14, 0.45]} />
        <meshStandardMaterial color="#5c422d" />
      </mesh>
      <FrontRailing width={3.7} y={1.65} z={1.56} />
      <Ladder position={[-2.05, 1.1, 1.42]} rotation={[0, 0, -0.48]} />
      <HangingLantern position={[2.05, 2.8, 1.35]} lit={isNight} />
    </ClickableLodge>
  );
}

function PineTree({ position, color, index }) {
  const treeRef = useRef();
  const scale = position[3];
  useFrame(({ clock }) => {
    if (!treeRef.current) return;
    treeRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.42 + index * 0.9) * 0.016;
  });

  return (
    <group ref={treeRef} position={position.slice(0, 3)} scale={scale}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.3, 2.4, 8]} />
        <meshStandardMaterial color="#5b3c28" roughness={1} />
      </mesh>
      <mesh position={[0, 2.15, 0]} castShadow>
        <coneGeometry args={[1.1, 2.8, 9]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      <mesh position={[0, 3.15, 0]} castShadow>
        <coneGeometry args={[0.8, 2.3, 9]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      <mesh position={[0, 4.05, 0]} castShadow>
        <coneGeometry args={[0.52, 1.75, 9]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
    </group>
  );
}

function shapeFromOutline(outline) {
  const shape = new THREE.Shape();
  outline.forEach(([x, z], index) => {
    if (index === 0) shape.moveTo(x, -z);
    else shape.lineTo(x, -z);
  });
  shape.closePath();
  return shape;
}

function Terrain({ palette, stormy }) {
  const lakeMaterialRef = useRef();
  const terrainShape = useMemo(() => shapeFromOutline(TERRAIN_OUTLINE), []);
  const lakeShape = useMemo(() => shapeFromOutline(LAKE_OUTLINE), []);
  const shorelineCurve = useMemo(() => new THREE.CatmullRomCurve3(
    LAKE_OUTLINE.map(([x, z]) => new THREE.Vector3(x, 0.27, z)),
    true,
    'catmullrom',
    0.08,
  ), []);

  useFrame(({ clock }) => {
    if (!lakeMaterialRef.current) return;
    const pulse = Math.sin(clock.elapsedTime * (stormy ? 2.2 : 0.55));
    lakeMaterialRef.current.emissiveIntensity = stormy ? 0.18 + pulse * 0.08 : 0.035 + pulse * 0.015;
  });

  return (
    <group>
      <mesh position={[0, -0.37, 0]} receiveShadow>
        <boxGeometry args={[26, 0.75, 20.5]} />
        <meshStandardMaterial color="#17201d" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
        <shapeGeometry args={[terrainShape]} />
        <meshStandardMaterial color={palette.shore} roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.16, 0]} receiveShadow>
        <shapeGeometry args={[lakeShape]} />
        <meshStandardMaterial
          ref={lakeMaterialRef}
          color={palette.water}
          emissive={palette.water}
          metalness={0.28}
          roughness={stormy ? 0.2 : 0.34}
          transparent
          opacity={0.96}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh>
        <tubeGeometry args={[shorelineCurve, 128, 0.17, 7, true]} />
        <meshStandardMaterial color="#9a8764" roughness={1} />
      </mesh>
      {SHORE_ROCKS.map(([x, z, size], index) => (
        <mesh
          key={`${x}-${z}`}
          position={[x, 0.3, z]}
          rotation={[index * 0.3, index * 0.7, index * 0.2]}
          scale={[1.25, 0.7, 1]}
          castShadow
        >
          <dodecahedronGeometry args={[size, 0]} />
          <meshStandardMaterial color={index % 2 ? '#6e7268' : '#817967'} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function FogWisps({ active }) {
  const groupRef = useRef();
  const wisps = useMemo(() => [
    [-5, 1.25, 2, 2.4], [1, 1.1, -2, 2.8], [5, 1.5, 1.5, 2.2], [-1, 2, 5, 2.5],
  ], []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((wisp, index) => {
      wisp.position.x = wisps[index][0] + Math.sin(clock.elapsedTime * 0.2 + index) * 1.8;
      wisp.position.z = wisps[index][2] + Math.cos(clock.elapsedTime * 0.14 + index) * 1.1;
    });
  });

  return (
    <group ref={groupRef} visible={active}>
      {wisps.map(([x, y, z, scale], index) => (
        <mesh key={`${x}-${z}`} position={[x, y, z]} scale={[scale, 0.34, scale * 0.65]}>
          <sphereGeometry args={[1, 16, 10]} />
          <meshBasicMaterial color="#b8cad0" transparent opacity={0.075 + index * 0.012} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function Dock() {
  return (
    <group position={[5.15, 0.4, 2.7]} rotation={[0, -0.1, 0]}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[4.2, 0.16, 0.72]} />
        <meshStandardMaterial color="#614932" roughness={0.95} />
      </mesh>
      {[-1.7, -0.6, 0.6, 1.7].map((x) => (
        <mesh key={x} position={[x, -0.42, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.11, 1, 8]} />
          <meshStandardMaterial color="#443326" />
        </mesh>
      ))}
    </group>
  );
}

function Canoe({ position, rotation, color }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow scale={[1, 0.32, 0.48]}>
        <capsuleGeometry args={[0.48, 2.2, 5, 10]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.19, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.78, 0.18, 0.3]}>
        <capsuleGeometry args={[0.42, 2, 4, 10]} />
        <meshStandardMaterial color="#17252a" roughness={0.85} />
      </mesh>
      <mesh position={[0.15, 0.25, 0]} rotation={[0, 0.45, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 2.6, 8]} />
        <meshStandardMaterial color="#b28b55" />
      </mesh>
    </group>
  );
}

function ReedCluster({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[-0.22, 0, 0.2].map((x, index) => (
        <group key={x} position={[x, 0, index % 2 ? 0.08 : -0.04]}>
          <mesh position={[0, 0.45 + index * 0.08, 0]}>
            <cylinderGeometry args={[0.025, 0.035, 0.9 + index * 0.16, 6]} />
            <meshStandardMaterial color="#697345" />
          </mesh>
          <mesh position={[0, 0.95 + index * 0.16, 0]}>
            <capsuleGeometry args={[0.045, 0.17, 3, 6]} />
            <meshStandardMaterial color="#4b3924" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function StudentFigure({ position, coat = '#8e4b3f', scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.29, 0.18, 10]} />
        <meshStandardMaterial color="#7a4c2b" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.48, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.24, 0.68, 9]} />
        <meshStandardMaterial color="#9b6437" roughness={0.98} />
      </mesh>
      <mesh position={[0, 0.76, 0.11]} castShadow>
        <coneGeometry args={[0.27, 0.48, 8]} />
        <meshStandardMaterial color={coat} roughness={0.96} />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <sphereGeometry args={[0.14, 10, 8]} />
        <meshStandardMaterial color="#a96f3f" roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.04, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.29, 0.06, 10]} />
        <meshStandardMaterial color={coat} roughness={0.96} />
      </mesh>
      <mesh position={[0.05, 1.29, 0]} rotation={[0, 0, -0.14]} castShadow>
        <coneGeometry args={[0.22, 0.58, 9]} />
        <meshStandardMaterial color={coat} roughness={0.96} />
      </mesh>
    </group>
  );
}

function Campfire({ active }) {
  const lightRef = useRef();
  useFrame(({ clock }) => {
    if (!lightRef.current || !active) return;
    lightRef.current.intensity = 6 + Math.sin(clock.elapsedTime * 11) * 1.5;
  });
  if (!active) return null;
  return (
    <group position={[-6.3, 0.28, -1.3]}>
      {[0, Math.PI / 2].map((rotation) => (
        <mesh key={rotation} rotation={[0, 0, rotation]} position={[0, 0.05, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.11, 0.85, 8]} />
          <meshStandardMaterial color="#4c2d1e" />
        </mesh>
      ))}
      <mesh position={[0, 0.35, 0]}>
        <coneGeometry args={[0.22, 0.65, 8]} />
        <meshBasicMaterial color="#ffb34b" toneMapped={false} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0.6, 0]} color="#ff9d43" distance={4.5} decay={2} />
    </group>
  );
}

function LanternPost({ position, lit, flicker = false }) {
  const materialRef = useRef();
  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    materialRef.current.emissiveIntensity = !lit ? 0 : flicker && Math.sin(clock.elapsedTime * 16) < -0.25 ? 0.1 : 3.6;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.055, 1.4, 7]} />
        <meshStandardMaterial color="#302b26" />
      </mesh>
      <mesh position={[0, 1.42, 0]}>
        <boxGeometry args={[0.22, 0.32, 0.22]} />
        <meshStandardMaterial ref={materialRef} color="#e9b85f" emissive="#ff9f32" roughness={0.5} />
      </mesh>
    </group>
  );
}

function FlyingMail({ active }) {
  const mailRef = useRef();
  useFrame(({ clock }) => {
    if (!mailRef.current || !active) return;
    const t = clock.elapsedTime * 0.28;
    mailRef.current.position.x = -5.8 + (t % 1) * 11.5;
    mailRef.current.position.y = 4.2 + Math.sin(t * 18) * 0.18;
    mailRef.current.position.z = -1.8 + Math.sin(t * Math.PI * 2) * 1.4;
    mailRef.current.rotation.z = Math.sin(t * 14) * 0.12;
  });
  if (!active) return null;
  return (
    <group ref={mailRef}>
      <mesh castShadow>
        <boxGeometry args={[0.48, 0.05, 0.32]} />
        <meshStandardMaterial color="#e8d8ad" roughness={0.88} />
      </mesh>
      {[-0.34, 0.34].map((x) => (
        <mesh key={x} position={[x, 0.04, 0]} rotation={[0, 0, x < 0 ? -0.45 : 0.45]}>
          <boxGeometry args={[0.34, 0.025, 0.22]} />
          <meshStandardMaterial color="#f1e2bc" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function CampusDetails({ sceneId }) {
  const isNight = sceneId !== 'peaceful';
  const emergency = sceneId === 'emergency';
  return (
    <group>
      <Canoe position={[-1.7, 0.3, 3.6]} rotation={1.15} color="#a14f36" />
      <Canoe position={[-2.8, 0.28, 2.9]} rotation={0.92} color="#c99b45" />
      <ReedCluster position={[-5.2, 0.12, 3.8]} rotation={0.4} />
      <ReedCluster position={[3.9, 0.12, 4.4]} rotation={-0.3} />
      <ReedCluster position={[-4.8, 0.12, -3.6]} />
      <Campfire active={!isNight} />
      <FlyingMail active={!isNight} />
      {!emergency && (
        <Sparkles
          count={isNight ? 42 : 22}
          position={[-5.8, 1.2, -0.2]}
          scale={[4.5, 2.2, 3.5]}
          size={isNight ? 2.2 : 1.2}
          speed={0.18}
          color={isNight ? '#ffd46d' : '#cce6a4'}
          opacity={isNight ? 0.8 : 0.35}
        />
      )}
      <LanternPost position={[-6.4, 0.08, -4.7]} lit={isNight} />
      <LanternPost position={[6.2, 0.08, -4.9]} lit={isNight} flicker={emergency} />
      <LanternPost position={[6.9, 0.08, 1.5]} lit={isNight && !emergency} />
      {!isNight && (
        <>
          <StudentFigure position={[-6.9, 0.08, -1.8]} coat="#8b413a" />
          <StudentFigure position={[-5.9, 0.08, -1.9]} coat="#315f68" scale={0.9} />
          <StudentFigure position={[-2.2, 0.16, 4.3]} coat="#6c4f79" scale={0.85} />
        </>
      )}
      {emergency && (
        <>
          <StudentFigure position={[5.9, 0.1, 2.2]} coat="#2e596d" />
          <StudentFigure position={[6.6, 0.1, 2.8]} coat="#40506e" scale={0.92} />
          <StudentFigure position={[7.2, 0.1, 1.9]} coat="#59445f" scale={0.88} />
        </>
      )}
    </group>
  );
}

function MagicalIncident({ active }) {
  const markerRef = useRef();
  const rippleOne = useRef();
  const rippleTwo = useRef();

  useFrame(({ clock }) => {
    if (!active) return;
    const t = clock.elapsedTime;
    if (markerRef.current) {
      const pulse = 1 + Math.sin(t * 4.5) * 0.22;
      markerRef.current.scale.setScalar(pulse);
      markerRef.current.rotation.y = t * 0.7;
    }
    [rippleOne, rippleTwo].forEach((ref, index) => {
      if (!ref.current) return;
      const cycle = ((t * 0.45 + index * 0.5) % 1);
      ref.current.scale.setScalar(0.5 + cycle * 2.4);
      ref.current.material.opacity = 0.65 * (1 - cycle);
    });
  });

  if (!active) return null;
  return (
    <group position={[3.3, 0.48, 2.8]}>
      <group ref={markerRef} position={[0, 1.1, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.78, 0.1, 12, 36]} />
          <meshBasicMaterial color="#60d9ff" toneMapped={false} />
        </mesh>
        <mesh>
          <octahedronGeometry args={[0.38]} />
          <meshBasicMaterial color="#b5f2ff" toneMapped={false} />
        </mesh>
        <mesh position={[0, 1.25, 0]}>
          <cylinderGeometry args={[0.12, 0.5, 3.2, 12, 1, true]} />
          <meshBasicMaterial
            color="#4ed7ff"
            transparent
            opacity={0.18}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
        <pointLight color="#39bfff" intensity={48} distance={11} decay={2} />
      </group>
      {[rippleOne, rippleTwo].map((ref, index) => (
        <mesh key={index} ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.76, 40]} />
          <meshBasicMaterial color="#48cfff" transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function Trails({ dark }) {
  const trailColor = dark ? '#151d1b' : '#9a8158';
  return (
    <group position={[0, 0.09, 0]}>
      <mesh position={[-8.2, 0, -5.9]} rotation={[0, -0.08, 0]} receiveShadow>
        <boxGeometry args={[0.58, 0.035, 4.2]} />
        <meshStandardMaterial color={trailColor} roughness={1} />
      </mesh>
      <mesh position={[-7.1, 0, -1.7]} rotation={[0, -0.58, 0]} receiveShadow>
        <boxGeometry args={[0.5, 0.035, 3.4]} />
        <meshStandardMaterial color={trailColor} roughness={1} />
      </mesh>
      <mesh position={[7.8, 0, -6.0]} rotation={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[0.52, 0.035, 4]} />
        <meshStandardMaterial color={trailColor} roughness={1} />
      </mesh>
      {[-7.2, -6.2, 6.9, 7.8].map((x, index) => (
        <mesh key={`${x}-${index}`} position={[x, 0.03, index < 2 ? -5.8 : -5.9]} rotation={[-Math.PI / 2, 0, index * 0.4]}>
          <circleGeometry args={[0.16 + (index % 2) * 0.05, 10]} />
          <meshStandardMaterial color="#74705a" roughness={1} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function DioramaScene({ sceneState, selectedLodgeId, onSelectLodge }) {
  const emergency = sceneState.id === 'emergency';
  const curfew = sceneState.id === 'curfew';
  const isNight = sceneState.timeOfDay === 'night';
  const heavyFog = sceneState.weather === 'heavy_fog';
  const palette = emergency ? COLORS.emergency : curfew ? COLORS.curfew : COLORS.day;
  const fogRange = emergency ? [11, 38] : heavyFog ? [8, 34] : [22, 48];

  return (
    <>
      <color attach="background" args={[palette.background]} />
      <fog attach="fog" args={[palette.fog, fogRange[0], fogRange[1]]} />
      <ambientLight color={palette.ambient} intensity={emergency ? 0.92 : isNight ? 0.76 : 1.45} />
      <hemisphereLight args={[palette.ambient, '#18201c', isNight ? 0.55 : 1.15]} />
      <directionalLight
        castShadow
        color={palette.sun}
        intensity={emergency ? 1.85 : isNight ? 1.35 : 3.2}
        position={isNight ? [-8, 12, -5] : [-7, 15, 8]}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />
      {emergency && <pointLight position={[0, 7, 0]} color="#4a7dac" intensity={16} distance={28} />}

      <group onClick={() => onSelectLodge(null)}>
        <Terrain palette={palette} stormy={emergency} />
        <Trails dark={isNight} />
        <Dock />
        <CampusDetails sceneId={sceneState.id} />
        {TREE_POSITIONS.map((position, index) => (
          <PineTree key={`${position[0]}-${position[2]}`} position={position} color={palette.pine} index={index} />
        ))}

        <OneWoodLodge
          lodge={LODGES[0]}
          locationState={getLocationState(sceneState, LODGES[0].id)}
          selected={selectedLodgeId === LODGES[0].id}
          onSelect={onSelectLodge}
          isNight={isNight}
        />
        <DriftwoodHouseboat
          lodge={LODGES[1]}
          locationState={getLocationState(sceneState, LODGES[1].id)}
          selected={selectedLodgeId === LODGES[1].id}
          onSelect={onSelectLodge}
          isNight={isNight}
        />
        <WhitePineTreefort
          lodge={LODGES[2]}
          locationState={getLocationState(sceneState, LODGES[2].id)}
          selected={selectedLodgeId === LODGES[2].id}
          onSelect={onSelectLodge}
          isNight={isNight}
        />

        <FogWisps active={heavyFog} />
        <MagicalIncident active={emergency} />
        {!isNight && (
          <Sparkles count={35} scale={[18, 5, 18]} size={2.2} speed={0.15} color="#f4d68d" opacity={0.32} />
        )}
        {emergency && (
          <Sparkles count={55} position={[3.3, 1.8, 2.8]} scale={[4, 3, 4]} size={4} speed={1.1} color="#55d9ff" />
        )}
        <ContactShadows position={[0, 0.14, 0]} scale={30} opacity={isNight ? 0.42 : 0.58} blur={2.6} far={8} />
      </group>

      <OrbitControls
        makeDefault
        target={[0, 1.1, 0]}
        enablePan={false}
        minZoom={27}
        maxZoom={62}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 2.35}
      />
    </>
  );
}

export default function LivingMap({ sceneState, selectedLodgeId, onSelectLodge }) {
  return (
    <Canvas
      orthographic
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [17, 17, 20], zoom: 34, near: 0.1, far: 120 }}
      gl={{
        antialias: true,
        preserveDrawingBuffer: true,
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
    >
      <DioramaScene
        sceneState={sceneState}
        selectedLodgeId={selectedLodgeId}
        onSelectLodge={onSelectLodge}
      />
    </Canvas>
  );
}
