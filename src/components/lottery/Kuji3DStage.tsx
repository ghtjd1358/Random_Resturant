"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";

/**
 * Kuji 3D Stage — 3D bamboo cylinder with sticks inside, the classic
 * omikuji draw. Sister component to Yabawi3DStage; same R3F+drei setup
 * so users can switch metaphors via toggle without reload.
 *
 * Phases:
 *   ready    → cylinder + sticks at rest (sticks visibly poke out top)
 *   shaking  → cylinder rotates back and forth + slight tilt; sticks
 *              jitter inside (compound shake on top of cylinder motion)
 *   settled  → small landing bounce
 *   revealing → winner stick rises out of the cylinder mouth, others fade
 *
 * Visual decisions:
 *   - Cylinder color is paper-tan (matches modal bg), not bamboo green
 *   - Sticks are wheat-toned with dusty-shu cap (no full saturation red)
 *   - Z-buffering means sticks INSIDE the cylinder are properly hidden
 *     by the cylinder body — finally a working omikuji visual
 */

const SHAKE_DURATION = 1.4;
const SETTLED_DURATION = 0.32;
const REVEAL_DURATION = 1.0;

// Stick top kanji rotation set (matches the SVG kuji we deprecated)
const STICK_LABELS = ["吉", "中", "末", "小", "凶"];

interface StageProps {
  phase: "ready" | "shuffling" | "settled" | "revealing";
  winnerIdx: number | null;
  count: number;
  onStart: () => void;
}

export function Kuji3DStage({ phase, winnerIdx, count, onStart }: StageProps) {
  // Stick angular positions inside the cylinder — evenly distributed in a
  // small fan so they read as "all dropped in".
  const stickRotations = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const offset = (i - (count - 1) / 2) * 0.12;
        return offset;
      }),
    [count],
  );

  return (
    <div
      className="relative h-full w-full"
      onClick={phase === "ready" ? onStart : undefined}
      role="button"
      tabIndex={phase === "ready" ? 0 : undefined}
      aria-label="제비뽑기 시작"
      style={{ cursor: phase === "ready" ? "pointer" : "default" }}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        // Camera bumped up + back so the winner stick doesn't clip when it
        // rises (was getting its top cut off). FOV widened for more headroom.
        camera={{ position: [0, 2.0, 6.2], fov: 44 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        {/* Lighting — same setup as Yabawi for consistent material feel */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[3, 6, 4]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={15}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
          color="#FFF4DC"
        />
        <pointLight position={[-3, 4, -2]} intensity={0.4} color="#B3321D" />
        <Environment preset="apartment" />

        {/* Contact shadow under the cylinder */}
        <ContactShadows
          position={[0, -1.0, 0]}
          opacity={0.5}
          scale={6}
          blur={2.2}
          far={2}
          color="#1C1815"
        />

        {/* Cylinder + sticks — all driven by phase via useFrame */}
        <Cylinder phase={phase} />
        {Array.from({ length: count }).map((_, idx) => (
          <Stick
            key={idx}
            idx={idx}
            angleOffset={stickRotations[idx]}
            label={STICK_LABELS[idx % STICK_LABELS.length]}
            phase={phase}
            isWinner={winnerIdx === idx}
          />
        ))}
      </Canvas>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

/**
 * Bamboo cylinder — CylinderGeometry with paper-tan material + visible
 * node bands (small ring meshes wrapped around the body). Open top (the
 * mouth that sticks emerge from) is achieved with openEnded geometry +
 * a separate dark inner mesh for the cavity.
 */
function Cylinder({ phase }: { phase: StageProps["phase"] }) {
  const groupRef = useRef<THREE.Group>(null);
  const phaseStartRef = useRef<number | null>(null);
  const lastPhaseRef = useRef(phase);

  useFrame((state) => {
    if (!groupRef.current) return;
    if (lastPhaseRef.current !== phase) {
      phaseStartRef.current = state.clock.elapsedTime;
      lastPhaseRef.current = phase;
    }
    const elapsed =
      phaseStartRef.current === null
        ? 0
        : state.clock.elapsedTime - phaseStartRef.current;

    if (phase === "shuffling") {
      // Sin-based oscillating shake with decaying amplitude
      const t = Math.min(1, elapsed / SHAKE_DURATION);
      const decay = 1 - t * 0.7;
      groupRef.current.rotation.z = Math.sin(elapsed * 16) * 0.18 * decay;
      groupRef.current.position.x = Math.sin(elapsed * 16) * 0.06 * decay;
    } else if (phase === "settled") {
      // Small wobble settling
      const t = Math.min(1, elapsed / SETTLED_DURATION);
      groupRef.current.rotation.z = Math.sin(t * Math.PI * 2) * 0.04 * (1 - t);
      groupRef.current.position.x = 0;
    } else if (phase === "revealing") {
      // Slight forward tip — like the kuji master is presenting
      const t = Math.min(1, elapsed / REVEAL_DURATION);
      const tip = easeOutCubic(Math.min(1, t * 2));
      groupRef.current.rotation.z = -tip * 0.05;
    } else {
      groupRef.current.rotation.z = 0;
      groupRef.current.position.x = 0;
    }
  });

  return (
    // Cylinder sits lower (position-y -0.85) so the visible composition
    // gives more headroom for the winner stick rise without clipping.
    <group ref={groupRef} position={[0, -0.85, 0]}>
      {/* Cylinder body — open at top, paper-tan with subtle taper.
          Slightly transparent (opacity 0.92) for a softer editorial feel
          per user request — the watermark mascot behind shows through
          a touch. */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.6, 1.6, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#dccfb0"
          roughness={0.55}
          metalness={0.05}
          clearcoat={0.2}
          clearcoatRoughness={0.7}
          side={THREE.DoubleSide}
          transparent
          opacity={0.92}
        />
      </mesh>
      {/* Inner cavity darkness — slightly smaller cylinder inside
          rendered on the back side, so the top opening reads as deep */}
      <mesh>
        <cylinderGeometry args={[0.51, 0.56, 1.55, 32, 1, true]} />
        <meshStandardMaterial
          color="#2a2218"
          roughness={0.9}
          side={THREE.BackSide}
        />
      </mesh>
      {/* Bottom cap — closes the cylinder so we don't see all the way through */}
      <mesh position-y={-0.78}>
        <circleGeometry args={[0.6, 32]} />
        <meshStandardMaterial color="#7a6d52" roughness={0.85} />
      </mesh>
      {/* Bamboo node bands — three thin rings around the body */}
      {[-0.45, 0, 0.45].map((y) => (
        <mesh key={y} position-y={y}>
          <torusGeometry args={[0.575, 0.012, 8, 48]} />
          <meshStandardMaterial color="#5a4f3a" roughness={0.7} />
        </mesh>
      ))}
      {/* Top rim — sumi-ink ring at the opening for depth */}
      <mesh position-y={0.8}>
        <torusGeometry args={[0.55, 0.018, 8, 48]} />
        <meshStandardMaterial color="#1C1815" roughness={0.6} />
      </mesh>
    </group>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

interface StickProps {
  idx: number;
  angleOffset: number;
  label: string;
  phase: StageProps["phase"];
  isWinner: boolean;
}

/**
 * Single bamboo stick — thin cylinder positioned inside the kuji can.
 * Resting position has the top tip visible above the cylinder mouth.
 * Compound jitter during shake; winner rises high during reveal.
 */
function Stick({ idx, angleOffset, phase, isWinner }: StickProps) {
  const groupRef = useRef<THREE.Group>(null);
  const phaseStartRef = useRef<number | null>(null);
  const lastPhaseRef = useRef(phase);

  // Resting tilt — sticks fan out slightly inside the cylinder
  const restTilt = angleOffset * 1.5;

  useFrame((state) => {
    if (!groupRef.current) return;
    if (lastPhaseRef.current !== phase) {
      phaseStartRef.current = state.clock.elapsedTime;
      lastPhaseRef.current = phase;
    }
    const elapsed =
      phaseStartRef.current === null
        ? 0
        : state.clock.elapsedTime - phaseStartRef.current;

    let y = 0;
    let rotZ = restTilt;
    let opacity = 1;
    let scale = 1;

    if (phase === "shuffling") {
      // Compound jitter on top of cylinder shake — each stick rattles
      // slightly differently based on its idx phase offset
      const jitter = Math.sin(elapsed * 14 + idx * 1.7) * 0.12;
      rotZ = restTilt + jitter;
      y = Math.sin(elapsed * 18 + idx * 0.9) * 0.04;
    } else if (phase === "settled") {
      // Settle wobble
      const t = Math.min(1, elapsed / SETTLED_DURATION);
      rotZ = restTilt * (1 - Math.sin(t * Math.PI) * 0.3);
    } else if (phase === "revealing") {
      const t = Math.min(1, elapsed / REVEAL_DURATION);
      if (isWinner) {
        // 3-stage rise: anticipation dip → high lift → settle slightly
        if (t < 0.12) {
          y = lerp(0, -0.05, t / 0.12);
        } else {
          const liftT = (t - 0.12) / 0.88;
          y = lerp(-0.05, 1.4, easeOutCubic(liftT));
          rotZ = lerp(restTilt, 0, easeOutCubic(liftT)); // straightens
          scale = lerp(1, 1.08, easeOutCubic(liftT));
        }
      } else {
        // Losers stay in place but fade
        opacity = lerp(1, 0.25, easeOutCubic(t));
      }
    }

    groupRef.current.position.y = y;
    groupRef.current.rotation.z = rotZ;
    groupRef.current.scale.setScalar(scale);

    // Apply opacity scaling to all child meshes — multiplies the
    // material's base opacity (0.92) by the phase-driven loser fade.
    groupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat.transparent !== true) mat.transparent = true;
        // Base opacity 0.92 (editorial soft) × phase opacity for losers
        mat.opacity = 0.92 * opacity;
      }
    });
  });

  // Position sticks slightly behind/in front of center for fan layout
  const xOffset = angleOffset * 0.7;

  // Sticks share the cylinder's lowered base — anchor them to the same
  // group offset so they sit inside the can naturally.
  return (
    <group ref={groupRef} position={[xOffset, -0.85, 0]}>
      {/* Stick body — thin cylinder, wheat-toned wood. Slight opacity
          for the same softer editorial feel as the cylinder. */}
      <mesh castShadow scale={[0.04, 1.1, 0.04]}>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshStandardMaterial
          color="#E6D6B0"
          roughness={0.6}
          transparent
          opacity={0.92}
        />
      </mesh>
      {/* Top cap — dusty-shu band at the very top */}
      <mesh position-y={0.55} scale={[0.045, 0.06, 0.045]}>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshStandardMaterial
          color="#C9817F"
          roughness={0.5}
          transparent
          opacity={0.92}
        />
      </mesh>
      {/* Cherry-blossom mark at the very tip — small 朱 sphere */}
      <mesh position-y={0.59} scale={0.025}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial
          color="#B3321D"
          emissive="#B3321D"
          emissiveIntensity={0.15}
          transparent
          opacity={0.95}
        />
      </mesh>
    </group>
  );
}

/* ───────────────────────────────────────────────────────────────────── */
/* Helpers                                                              */
/* ───────────────────────────────────────────────────────────────────── */

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
