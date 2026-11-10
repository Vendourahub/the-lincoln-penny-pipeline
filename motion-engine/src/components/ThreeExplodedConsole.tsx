import React, { useRef } from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";

const Console3DScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Mechanical separation springs
  // Frame 0-45 (0-1.5s): Assemble & dramatic camera sweep
  // Frame 45-120 (1.5-4.0s): Explosive Teardown!
  // Frame 120-240 (4.0-8.0s): APU inspection & component spin
  // Frame 240-360 (8.0-12.0s): Slam onto scale & cash bleed
  // Frame 360-450 (12.0-15.0s): Tollbooth gate lock-in

  const explodeSpring = spring({
    frame: frame - 40,
    fps,
    config: { damping: 10, stiffness: 120, mass: 0.8 },
  });

  const chipFocusSpring = spring({
    frame: frame - 110,
    fps,
    config: { damping: 12, stiffness: 140 },
  });

  const slamSpring = spring({
    frame: frame - 230,
    fps,
    config: { damping: 14, stiffness: 180 },
  });

  // Base rotation
  const rotY = interpolate(frame, [0, 450], [-0.4, 1.2]);
  const rotX = interpolate(frame, [0, 100, 250, 450], [0.15, 0.35, -0.1, 0.2]);

  // Exploded displacements
  const plateSeparation = interpolate(explodeSpring, [0, 1], [0, 3.2]);
  const fanZ = interpolate(explodeSpring, [0, 1], [0, 2.6]);
  const heatsinkZ = interpolate(explodeSpring, [0, 1], [0, -2.4]);
  const apuZoom = interpolate(chipFocusSpring, [0, 1], [0, 2.2]);

  return (
    <group rotation={[rotX, rotY, 0]}>
      {/* 1. LEFT WHITE AERO WING (Faceplate) */}
      <mesh
        position={[-0.9 - plateSeparation, 0, 0]}
        rotation={[0, interpolate(explodeSpring, [0, 1], [0, 0.25]), 0]}
      >
        <boxGeometry args={[0.22, 6.2, 3.8]} />
        <meshStandardMaterial
          color="#F8FAFC"
          roughness={0.25}
          metalness={0.1}
          wireframe={false}
        />
      </mesh>

      {/* 2. RIGHT WHITE AERO WING (Faceplate) */}
      <mesh
        position={[0.9 + plateSeparation, 0, 0]}
        rotation={[0, interpolate(explodeSpring, [0, 1], [0, -0.25]), 0]}
      >
        <boxGeometry args={[0.22, 6.2, 3.8]} />
        <meshStandardMaterial
          color="#F8FAFC"
          roughness={0.25}
          metalness={0.1}
          wireframe={false}
        />
      </mesh>

      {/* 3. OBSIDIAN CENTRAL CHASSIS TOWER */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.3, 5.8, 3.4]} />
        <meshStandardMaterial
          color="#0B0F19"
          roughness={0.4}
          metalness={0.8}
        />
      </mesh>

      {/* 4. HIGH-SPEED INDUSTRIAL COOLING TURBINE FAN */}
      <group position={[0, 1.2, fanZ]}>
        <mesh rotation={[Math.PI / 2, 0, frame * 0.45]}>
          <cylinderGeometry args={[1.3, 1.3, 0.4, 24]} />
          <meshStandardMaterial
            color="#1E293B"
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>
        {/* Glowing Center Hub */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.45, 16]} />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#0284C7"
            emissiveIntensity={0.8}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* 5. COPPER HEAT SINK & THERMAL PIPES */}
      <group position={[0, -1.1, heatsinkZ]}>
        <mesh>
          <boxGeometry args={[1.1, 2.4, 2.6]} />
          <meshStandardMaterial
            color="#D97706"
            metalness={0.85}
            roughness={0.3}
          />
        </mesh>
        {/* Heat dissipation fins */}
        {[-0.8, -0.4, 0, 0.4, 0.8].map((yOff, i) => (
          <mesh key={i} position={[0, yOff, 0]}>
            <boxGeometry args={[1.2, 0.08, 2.7]} />
            <meshStandardMaterial
              color="#F59E0B"
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
        ))}
      </group>

      {/* 6. GREEN HIGH-DENSITY MOTHERBOARD PCB */}
      <mesh position={[0, 0, 0.3 + (explodeSpring * 0.5)]}>
        <boxGeometry args={[1.15, 5.2, 3.1]} />
        <meshStandardMaterial
          color="#064E3B"
          metalness={0.4}
          roughness={0.6}
        />
      </mesh>

      {/* 7. AMD CUSTOM ZEN 2 APU PROCESSOR (HERO CHIP) */}
      <group position={[0, 0.3, 0.5 + apuZoom]}>
        {/* Silver Heatspreader */}
        <mesh>
          <boxGeometry args={[0.9, 0.9, 0.22]} />
          <meshStandardMaterial
            color="#CBD5E1"
            metalness={0.95}
            roughness={0.15}
          />
        </mesh>
        {/* Glowing Silicon Die Core */}
        <mesh position={[0, 0, 0.12]}>
          <boxGeometry args={[0.6, 0.6, 0.05]} />
          <meshStandardMaterial
            color="#F43F5E"
            emissive="#E11D48"
            emissiveIntensity={1.4}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* 8. SURROUNDING GDDR6 MEMORY MODULES (8 Chips) */}
      {[-0.6, 0.6].map((x, xi) =>
        [-0.7, -0.2, 0.3, 0.8].map((y, yi) => (
          <mesh
            key={`${xi}-${yi}`}
            position={[x, y, 0.45 + (explodeSpring * 0.9)]}
          >
            <boxGeometry args={[0.26, 0.34, 0.1]} />
            <meshStandardMaterial
              color="#1E293B"
              emissive="#3B82F6"
              emissiveIntensity={0.6}
              roughness={0.3}
            />
          </mesh>
        ))
      )}

      {/* 9. FLOATING $100 CASH BURN BILL (Appears at Hook) */}
      <mesh
        position={[
          interpolate(explodeSpring, [0, 1], [0, 1.8]),
          interpolate(explodeSpring, [0, 1], [-0.5, 2.2]),
          interpolate(explodeSpring, [0, 1], [1.2, 3.0]),
        ]}
        rotation={[0.3, 0.4 + Math.sin(frame * 0.1) * 0.2, 0.1]}
      >
        <boxGeometry args={[2.2, 1.1, 0.02]} />
        <meshStandardMaterial
          color="#10B981"
          emissive="#059669"
          emissiveIntensity={0.5}
          roughness={0.6}
        />
      </mesh>
    </group>
  );
};

export const ThreeExplodedConsole: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => {
  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ position: [0, 0.2, 9.5], fov: 42 }}
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        inset: 0,
      }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 8, 6]} intensity={2.5} color="#FFFFFF" />
      <pointLight position={[-6, -4, 4]} intensity={2.0} color="#38BDF8" />
      <pointLight position={[6, -4, -4]} intensity={2.8} color="#F59E0B" />
      <pointLight position={[0, 4, 3]} intensity={1.8} color="#EF4444" />
      <Console3DScene />
    </ThreeCanvas>
  );
};
