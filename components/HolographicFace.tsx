
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Sparkles, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Fix: Add a global indexer to IntrinsicElements to ensure standard HTML tags (div, span, etc.)
// and R3F tags (group, mesh, etc.) are recognized by TypeScript across the entire project.
// This resolves the shadowing/missing type definition issue causing broad JSX errors.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

interface HolographicFaceProps {
    state: 'idle' | 'listening' | 'speaking' | 'processing' | 'poisoned';
    analyser?: AnalyserNode | null;
}

const NeuralCore = ({ state, analyser }: { state: string, analyser?: AnalyserNode | null }) => {
    const groupRef = useRef<THREE.Group>(null);
    const leftEyeRef = useRef<THREE.Group>(null);
    const rightEyeRef = useRef<THREE.Group>(null);
    const brainRingsRef = useRef<THREE.Group>(null);
    const jawRef = useRef<THREE.Mesh>(null);
    
    const freqData = useMemo(() => new Uint8Array(analyser?.frequencyBinCount || 1024), [analyser]);

    useFrame((stateThree) => {
        const time = stateThree.clock.getElapsedTime();
        let volume = 0;
        let highFreq = 0;

        if (analyser) {
            analyser.getByteFrequencyData(freqData);
            let sum = 0;
            let hSum = 0;
            const split = Math.floor(freqData.length / 2);
            for (let i = 0; i < freqData.length; i++) {
                sum += freqData[i];
                if (i > split) hSum += freqData[i];
            }
            volume = (sum / freqData.length) / 255;
            highFreq = (hSum / (freqData.length - split)) / 255;
        }

        if (groupRef.current) {
            // Subtle breathing and rotation
            const baseRotationY = Math.sin(time * 0.4) * 0.08;
            const tiltZ = state === 'speaking' ? Math.sin(time * 10) * volume * 0.05 : 0;
            const tiltX = state === 'speaking' ? Math.cos(time * 8) * volume * 0.03 : 0;

            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, baseRotationY, 0.1);
            groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, tiltZ, 0.1);
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, tiltX, 0.1);
            groupRef.current.position.y = Math.sin(time * 1.5) * 0.04;
            
            if (state === 'poisoned') {
                groupRef.current.position.x = Math.sin(time * 30) * 0.02;
                groupRef.current.rotation.z += Math.sin(time * 20) * 0.05;
            } else if (state === 'processing') {
                groupRef.current.rotation.y += Math.sin(time * 10) * 0.01;
            }
        }

        if (brainRingsRef.current) {
            // Live-sync: higher frequencies accelerate cortical rings
            const ringBaseSpeed = state === 'processing' ? 8 : (state === 'speaking' ? 1.5 + highFreq * 12 : 1);
            brainRingsRef.current.children.forEach((child, i) => {
                child.rotation.y += 0.015 * ringBaseSpeed * (i + 1) * (i % 2 === 0 ? 1 : -1);
                if (state === 'speaking') {
                    const scale = 1 + highFreq * 0.5 + volume * 0.2;
                    child.scale.set(scale, scale, scale);
                } else {
                    const scale = 1 + Math.sin(time + i) * 0.05;
                    child.scale.set(scale, scale, scale);
                }
            });
        }

        if (jawRef.current) {
            // OPTIMIZATION: High-speed robotic jaw tracking for lip-sync accuracy
            // Increased interpolation factor from 0.4 to 0.85 for <50ms visual latency
            const jawOpen = state === 'speaking' ? volume * 1.8 : 0;
            const jawJitter = state === 'speaking' ? (Math.random() - 0.5) * volume * 0.08 : 0;
            
            jawRef.current.position.y = THREE.MathUtils.lerp(jawRef.current.position.y, -0.8 - jawOpen, 0.85);
            jawRef.current.position.x = THREE.MathUtils.lerp(jawRef.current.position.x, jawJitter, 0.75);
            jawRef.current.scale.x = 1 + (state === 'speaking' ? volume * 0.3 : 0);
        }

        if (leftEyeRef.current && rightEyeRef.current) {
            const dilate = state === 'idle' ? 1 : (1.1 + volume * 0.9);
            // Faster eye response for lifelike engagement
            const lerpFactor = state === 'speaking' ? 0.6 : 0.2;
            
            // Subtle eye tracking / focus shift
            const focalShift = state === 'speaking' ? volume * 0.15 : 0;
            
            leftEyeRef.current.scale.setScalar(THREE.MathUtils.lerp(leftEyeRef.current.scale.x, dilate, lerpFactor));
            rightEyeRef.current.scale.setScalar(THREE.MathUtils.lerp(rightEyeRef.current.scale.x, dilate, lerpFactor));
            
            leftEyeRef.current.position.x = THREE.MathUtils.lerp(leftEyeRef.current.position.x, -0.45 + focalShift, 0.3);
            rightEyeRef.current.position.x = THREE.MathUtils.lerp(rightEyeRef.current.position.x, 0.45 - focalShift, 0.3);
            
            // Optical intensity shift: Glows brighter on higher frequencies
            const intensity = state === 'speaking' ? 3.0 + highFreq * 15 : (state === 'listening' ? 2 : 1.5);
            if ((leftEyeRef.current.children[0] as any).material) {
                (leftEyeRef.current.children[0] as any).material.emissiveIntensity = intensity;
            }
            if ((rightEyeRef.current.children[0] as any).material) {
                (rightEyeRef.current.children[0] as any).material.emissiveIntensity = intensity;
            }
        }
    });

    const signalColor = state === 'listening' ? '#00FF94' : (state === 'poisoned' ? '#FF3E00' : '#00F0FF');

    return (
        <group ref={groupRef}>
            {/* Glass Outer Shell */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[1.5, 64, 64]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.98}
                    thickness={2}
                    roughness={0.02}
                    metalness={0.05}
                    ior={1.5}
                    transparent
                    opacity={0.85}
                />
            </mesh>

            {/* Neural Matrix Wireframe */}
            <mesh position={[0, -0.1, 0]} scale={[0.8, 1.05, 0.8]}>
                <sphereGeometry args={[1.2, 24, 24]} />
                <meshStandardMaterial 
                    color="#050505" 
                    wireframe 
                    emissive={signalColor}
                    emissiveIntensity={state === 'speaking' || state === 'poisoned' || state === 'processing' ? 4 : 0.5}
                />
            </mesh>

            {/* Optical Sensor Array (Eyes) */}
            <group position={[-0.45, 0.35, 1.1]} ref={leftEyeRef}>
                <mesh>
                    <sphereGeometry args={[0.12, 32, 32]} />
                    <meshStandardMaterial color={signalColor} emissive={signalColor} emissiveIntensity={1} />
                </mesh>
                <pointLight intensity={4} color={signalColor} distance={1.5} />
            </group>

            <group position={[0.45, 0.35, 1.1]} ref={rightEyeRef}>
                <mesh>
                    <sphereGeometry args={[0.12, 32, 32]} />
                    <meshStandardMaterial color={signalColor} emissive={signalColor} emissiveIntensity={1} />
                </mesh>
                <pointLight intensity={4} color={signalColor} distance={1.5} />
            </group>

            {/* Cortical Rings (Brain) */}
            <group position={[0, 1.5, 0]} ref={brainRingsRef}>
                {[0.7, 1.0, 1.3, 1.6].map((radius, i) => (
                    <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
                        <torusGeometry args={[radius, 0.006, 16, 100]} />
                        <meshBasicMaterial color={signalColor} transparent opacity={0.3 + (i * 0.1)} />
                    </mesh>
                ))}
            </group>

            {/* Vocal Actuator (Jaw) */}
            <mesh ref={jawRef} position={[0, -0.8, 1.05]}>
                <boxGeometry args={[0.8, 0.08, 0.15]} />
                <meshBasicMaterial color={signalColor} transparent opacity={0.8} />
            </mesh>

            <Sparkles count={120} scale={4} size={2.5} speed={state === 'processing' ? 10 : 2} color={signalColor} />
        </group>
    );
};

const HolographicFace: React.FC<HolographicFaceProps> = ({ state, analyser }) => {
    const [contextLost, setContextLost] = useState(false);

    useEffect(() => {
        const handleContextLost = (e: Event) => {
            e.preventDefault();
            setContextLost(true);
        };
        const handleContextRestored = () => setContextLost(false);

        const canvas = document.querySelector('canvas');
        if (canvas) {
            canvas.addEventListener('webglcontextlost', handleContextLost, false);
            canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
        }

        return () => {
            if (canvas) {
                canvas.removeEventListener('webglcontextlost', handleContextLost);
                canvas.removeEventListener('webglcontextrestored', handleContextRestored);
            }
        };
    }, []);

    if (contextLost) {
        return (
            <div className="relative w-[500px] h-[500px] flex items-center justify-center border-2 border-red-500/20 rounded-full bg-red-900/10 animate-pulse">
                <div className="text-center font-mono-data">
                    <h3 className="text-red-500 font-bold text-xl mb-2">VISUAL_SYSTEM_CRITICAL</h3>
                    <p className="text-[10px] text-red-400/60 uppercase tracking-widest">GPU Context Lost</p>
                    <p className="text-[10px] text-red-400/60 uppercase tracking-widest">Neural Link Latency Minimized</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-[500px] h-[500px]">
            <Canvas 
                dpr={[1, 1.5]} 
                gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
            >
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={35} />
                <ambientLight intensity={0.4} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} />
                <Environment preset="night" />
                <NeuralCore state={state} analyser={analyser} />
            </Canvas>
            
            <div className={`absolute inset-0 rounded-full border-2 transition-all duration-1000 ${state === 'processing' ? 'border-gem-blue opacity-40 animate-pulse' : (state === 'speaking' ? 'border-gem-blue/20 opacity-30 shadow-[0_0_20px_rgba(0,240,255,0.2)]' : (state === 'poisoned' ? 'border-red-500 opacity-60' : 'border-gem-blue/5 opacity-10'))}`}></div>
        </div>
    );
};

export default HolographicFace;
