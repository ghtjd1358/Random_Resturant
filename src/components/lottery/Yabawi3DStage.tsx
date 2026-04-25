"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";

/**
 * Yabawi 3D Stage — Three.js + React-Three-Fiber rendering of the 3-bowl
 * shell game. Replaces the SVG cylinder/cup approach with actual 3D meshes,
 * proper lighting, and contact shadows so the bowls have real material feel.
 *
 * Why R3F over more SVG iterations:
 *   - Real depth perception (bowls visibly cast shadows on the table as
 *     they lift/swap)
 *   - Real material (rough ceramic glaze via MeshStandardMaterial roughness +
 *     metalness, not painted gradients)
 *   - True 3D rotation during shuffle — bowls tilt in the direction of
 *     motion with proper y-axis spin, no fake CSS perspective
 *
 * Bundle cost: ~150KB for three + R3F + drei minimal helpers. Lazy-loaded
 * only when YabawiModal mounts so the home page stays light.
 */

const SLOT_X = [-2.2, 0, 2.2] as const;
const SWAP_SEQUENCE: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [0, 2],
  [0, 1],
];

const SHUFFLE_DURATION = 2.6;
const SETTLED_DURATION = 0.32;
const REVEAL_DURATION = 1.0;
const SWAP_DURATION = SHUFFLE_DURATION / SWAP_SEQUENCE.length;

interface StageProps {
  phase: "ready" | "shuffling" | "settled" | "revealing";
  winnerIdx: number | null;
  onStart: () => void;
}

export function Yabawi3DStage({ phase, winnerIdx, onStart }: StageProps) {
  // Bowl trajectories — each bowl's slot index after each swap.
  const slotTrajectory = useMemo(() => buildTrajectory(3), []);

  return (
    <div
      className="relative h-full w-full"
      onClick={phase === "ready" ? onStart : undefined}
      role="button"
      tabIndex={phase === "ready" ? 0 : undefined}
      aria-label="야바위 시작"
      style={{ cursor: phase === "ready" ? "pointer" : "default" }}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 3.2, 5.5], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        {/* Lighting — soft ambient + warm key + cool rim */}
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

        {/* Subtle environment for ceramic reflections */}
        <Environment preset="apartment" />

        {/* Wooden table surface */}
        <Table />

        {/* Soft contact shadow under all bowls */}
        <ContactShadows
          position={[0, -0.49, 0]}
          opacity={0.45}
          scale={10}
          blur={2.4}
          far={2}
          color="#1C1815"
        />

        {/* Reveal mark — 朱 dot under the winner's slot */}
        {winnerIdx !== null && (
          <RevealMark
            x={SLOT_X[slotTrajectory[winnerIdx][SWAP_SEQUENCE.length]]}
            visible={phase === "revealing"}
          />
        )}

        {/* Three bowls */}
        {[0, 1, 2].map((idx) => (
          <Bowl
            key={idx}
            idx={idx}
            trajectory={slotTrajectory[idx]}
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
 * Wooden table — large plane with subtle radial darkening at the edges
 * (vignette). Material is rough wood-tone, no metalness.
 */
function Table() {
  return (
    <mesh receiveShadow rotation-x={-Math.PI / 2} position-y={-0.5}>
      <planeGeometry args={[14, 14]} />
      <meshStandardMaterial
        color="#5d4f37"
        roughness={0.85}
        metalness={0.05}
      />
    </mesh>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

interface BowlProps {
  idx: number;
  trajectory: number[];
  phase: "ready" | "shuffling" | "settled" | "revealing";
  isWinner: boolean;
}

/**
 * Single 3D bowl. Phase-driven manual interpolation in useFrame for
 * precise control over the shell-shuffle arc + cross-over + reveal lift.
 *
 * react-spring would handle simple springs but not the multi-swap chained
 * arc with mid-swap rotation, so we hand-roll the timeline.
 */
function Bowl({ idx, trajectory, phase, isWinner }: BowlProps) {
  const groupRef = useRef<THREE.Group>(null);
  const phaseStartRef = useRef<number | null>(null);
  const lastPhaseRef = useRef(phase);
  const restingPosRef = useRef<[number, number, number]>([SLOT_X[idx], 0, 0]);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Reset phaseStart when phase changes
    if (lastPhaseRef.current !== phase) {
      phaseStartRef.current = state.clock.elapsedTime;
      lastPhaseRef.current = phase;
    }

    const elapsed =
      phaseStartRef.current === null
        ? 0
        : state.clock.elapsedTime - phaseStartRef.current;

    let x = restingPosRef.current[0];
    let y = restingPosRef.current[1];
    const z = restingPosRef.current[2];
    let rotZ = 0;
    let rotX = 0;

    if (phase === "ready") {
      x = SLOT_X[idx];
      y = 0;
      restingPosRef.current = [x, y, z];
    } else if (phase === "shuffling") {
      // Determine which swap we're in
      const swapIdx = Math.min(
        Math.floor(elapsed / SWAP_DURATION),
        SWAP_SEQUENCE.length - 1,
      );
      const localT = (elapsed - swapIdx * SWAP_DURATION) / SWAP_DURATION;
      const eased = easeInOutCubic(Math.min(1, Math.max(0, localT)));

      const fromSlot = trajectory[swapIdx];
      const toSlot = trajectory[swapIdx + 1] ?? trajectory[swapIdx];
      const fromX = SLOT_X[fromSlot];
      const toX = SLOT_X[toSlot];
      const direction = toX > fromX ? 1 : toX < fromX ? -1 : 0;

      x = lerp(fromX, toX, eased);

      // Arc on y — sin curve so y peaks at mid-swap
      const goesOver = idx === SWAP_SEQUENCE[swapIdx][0] === (swapIdx % 2 === 0);
      const arcHeight = goesOver ? 1.0 : 0.35;
      const ySign = goesOver ? 1 : -0.4;
      y = ySign * arcHeight * Math.sin(eased * Math.PI);

      // Rolling tilt: bowl tips forward in direction of motion
      rotZ = -direction * 0.35 * Math.sin(eased * Math.PI);

      // After last swap completes, snap to resting position
      if (swapIdx === SWAP_SEQUENCE.length - 1 && eased >= 1) {
        const finalSlot = trajectory[trajectory.length - 1];
        restingPosRef.current = [SLOT_X[finalSlot], 0, 0];
      }
    } else if (phase === "settled") {
      // Bounce — small dip then return
      const bounceT = Math.min(1, elapsed / SETTLED_DURATION);
      const eased = easeOutCubic(bounceT);
      const finalSlot = trajectory[trajectory.length - 1];
      x = SLOT_X[finalSlot];
      y = -0.04 * Math.sin(eased * Math.PI);
      restingPosRef.current = [x, 0, z];
    } else if (phase === "revealing") {
      const t = Math.min(1, elapsed / REVEAL_DURATION);
      const eased = easeOutBack(t);
      const finalSlot = trajectory[trajectory.length - 1];
      x = SLOT_X[finalSlot];

      if (isWinner) {
        // 3-stage rise: tiny dip → high lift → tilt back to show underside
        if (t < 0.12) {
          y = lerp(0, -0.08, t / 0.12);
        } else {
          const liftT = (t - 0.12) / 0.88;
          y = lerp(-0.08, 1.6, easeOutCubic(liftT));
          rotX = -liftT * 0.5; // tilts toward camera, showing underside
        }
      } else {
        // Losers stay still
        y = 0;
      }
    }

    groupRef.current.position.x = x;
    groupRef.current.position.y = y;
    groupRef.current.position.z = z;
    groupRef.current.rotation.z = rotZ;
    groupRef.current.rotation.x = rotX;
  });

  return (
    <group ref={groupRef} position={[SLOT_X[idx], 0, 0]}>
      <BowlMesh dim={phase === "revealing" && !isWinner} />
    </group>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

/**
 * Bowl 3D mesh — chawan shape via a sphere with thetaLength for hemisphere
 * + a small cylinder for the foot ring. Glazed ceramic material.
 */
function BowlMesh({ dim }: { dim: boolean }) {
  const color = dim ? "#9d8f70" : "#dac9a4";

  return (
    <group>
      {/* Body — hemisphere (upside down) */}
      <mesh castShadow receiveShadow scale={[0.65, 0.55, 0.65]}>
        <sphereGeometry args={[1, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.45}
          metalness={0.05}
          clearcoat={0.4}
          clearcoatRoughness={0.55}
        />
      </mesh>
      {/* Inside cavity — slight darkness on the underside (visible only
          when the bowl tilts during reveal) */}
      <mesh castShadow scale={[0.6, 0.5, 0.6]} position-y={0.001}>
        <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#3d2f22"
          roughness={0.85}
          side={THREE.BackSide}
        />
      </mesh>
      {/* Foot ring — small disc the bowl rests on */}
      <mesh castShadow position-y={-0.005} scale={[0.42, 0.04, 0.42]}>
        <cylinderGeometry args={[1, 1, 1, 24]} />
        <meshStandardMaterial color="#7a6d52" roughness={0.7} />
      </mesh>
      {/* 朱 dot at top crown */}
      <mesh position-y={0.555} scale={0.04}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial
          color="#B3321D"
          emissive="#B3321D"
          emissiveIntensity={0.15}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

/**
 * 朱 reveal mark — small glowing disc on the table where the winner
 * bowl was sitting. Visible during the revealing phase.
 */
function RevealMark({ x, visible }: { x: number; visible: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startRef = useRef<number | null>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    if (!visible) {
      meshRef.current.scale.setScalar(0);
      startRef.current = null;
      return;
    }
    if (startRef.current === null) {
      startRef.current = state.clock.elapsedTime;
    }
    const elapsed = state.clock.elapsedTime - startRef.current;
    const t = Math.min(1, elapsed / 0.55);
    const eased = easeOutBack(t);
    meshRef.current.scale.setScalar(eased * 0.32);
    // Subtle pulse after entry
    const pulse = 1 + Math.sin(elapsed * 4) * 0.08;
    meshRef.current.scale.setScalar(eased * 0.32 * pulse);
  });

  return (
    <mesh ref={meshRef} position={[x, -0.48, 0]} rotation-x={-Math.PI / 2}>
      <circleGeometry args={[1, 32]} />
      <meshBasicMaterial color="#B3321D" transparent opacity={0.8} />
    </mesh>
  );
}

/* ───────────────────────────────────────────────────────────────────── */
/* Helpers                                                              */
/* ───────────────────────────────────────────────────────────────────── */

function buildTrajectory(numBowls: number): number[][] {
  const traj: number[][] = Array.from({ length: numBowls }, (_, i) => [i]);
  const slotOf = Array.from({ length: numBowls }, (_, i) => i);
  for (const [a, b] of SWAP_SEQUENCE) {
    const bowlAtA = slotOf.findIndex((s) => s === a);
    const bowlAtB = slotOf.findIndex((s) => s === b);
    if (bowlAtA >= 0) slotOf[bowlAtA] = b;
    if (bowlAtB >= 0) slotOf[bowlAtB] = a;
    for (let i = 0; i < numBowls; i++) {
      traj[i].push(slotOf[i]);
    }
  }
  return traj;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutBack(t: number): number {
  const c = 1.70158;
  const c1 = c + 1;
  return 1 + c1 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}
