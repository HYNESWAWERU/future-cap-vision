import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  streak: number;
  onTap?: () => void;
}

interface Spark {
  id: number;
  x: number;
  y: number;
  angle: number;
  distance: number;
  color: string;
  size: number;
}

/**
 * LiveFlame — GPU-accelerated SVG flame with flickering layers,
 * embers, smoke, heat distortion and tap-to-burst sparks.
 * Intensity scales with streak length.
 */
export default function LiveFlame({ streak, onTap }: Props) {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const sparkId = useRef(0);

  // Tier resolution
  const tier = useMemo(() => {
    if (streak >= 365) return 5; // legendary inferno
    if (streak >= 100) return 4; // intense aura
    if (streak >= 60) return 3;  // blue/orange mix
    if (streak >= 30) return 2;  // larger glow
    if (streak >= 7) return 1;   // medium
    return streak > 0 ? 0 : -1;  // small / dead
  }, [streak]);

  const intensity = Math.min(streak / 100, 1.4);
  const size = 80 + intensity * 70; // px container
  const isDead = tier === -1;

  // Color palette per tier
  const palette = useMemo(() => {
    switch (tier) {
      case -1:
        return { core: "#555", mid: "#777", outer: "#999", glow: "rgba(120,120,120,0.3)" };
      case 0:
        return { core: "#FFE27A", mid: "#FFA53B", outer: "#FF5A1F", glow: "rgba(255,120,40,0.55)" };
      case 1:
        return { core: "#FFE27A", mid: "#FF8A24", outer: "#E63A12", glow: "rgba(255,90,30,0.65)" };
      case 2:
        return { core: "#FFF1B0", mid: "#FF7E2C", outer: "#D81E0E", glow: "rgba(255,80,20,0.75)" };
      case 3:
        return { core: "#CFE9FF", mid: "#FF8A24", outer: "#1E6BFF", glow: "rgba(80,140,255,0.75)" };
      case 4:
        return { core: "#FFFFFF", mid: "#FF6A1A", outer: "#7A1AFF", glow: "rgba(180,80,255,0.85)" };
      case 5:
      default:
        return { core: "#FFFFFF", mid: "#FFD24A", outer: "#FF1E6B", glow: "rgba(255,40,120,0.95)" };
    }
  }, [tier]);

  // Ember particles
  const embers = useMemo(
    () =>
      Array.from({ length: isDead ? 0 : 6 + tier * 3 }, (_, i) => ({
        id: i,
        delay: Math.random() * 2,
        x: (Math.random() - 0.5) * 50,
        duration: 1.6 + Math.random() * 1.8,
        size: 1.5 + Math.random() * 2.5,
      })),
    [tier, isDead]
  );

  // Smoke puffs
  const smoke = useMemo(
    () =>
      Array.from({ length: isDead ? 0 : 3 + tier }, (_, i) => ({
        id: i,
        delay: Math.random() * 3,
        x: (Math.random() - 0.5) * 30,
        duration: 3 + Math.random() * 2,
      })),
    [tier, isDead]
  );

  const handleTap = () => {
    if (isDead) {
      onTap?.();
      return;
    }
    if ("vibrate" in navigator) navigator.vibrate?.(30);
    const newSparks: Spark[] = Array.from({ length: 14 }, () => ({
      id: sparkId.current++,
      x: 0,
      y: 0,
      angle: Math.random() * Math.PI * 2,
      distance: 40 + Math.random() * 50,
      color: [palette.core, palette.mid, palette.outer][Math.floor(Math.random() * 3)],
      size: 2 + Math.random() * 3,
    }));
    setSparks((s) => [...s, ...newSparks]);
    setTimeout(() => {
      setSparks((s) => s.filter((sp) => !newSparks.find((n) => n.id === sp.id)));
    }, 900);
    onTap?.();
  };

  // Auto-burst on milestone changes
  const prevTier = useRef(tier);
  useEffect(() => {
    if (tier > prevTier.current && tier > 0) {
      handleTap();
      setTimeout(handleTap, 150);
    }
    prevTier.current = tier;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier]);

  const flickerDuration = Math.max(0.35, 0.8 - tier * 0.08);

  return (
    <div
      className="relative flex items-end justify-center cursor-pointer select-none"
      style={{ width: size, height: size }}
      onClick={handleTap}
      onTouchStart={(e) => {
        e.preventDefault();
        handleTap();
      }}
    >
      {/* Outer glow aura */}
      {!isDead && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${palette.glow} 0%, transparent 65%)`,
            filter: `blur(${8 + tier * 4}px)`,
          }}
          animate={{
            scale: [1, 1.15, 0.95, 1.1, 1],
            opacity: [0.7, 1, 0.6, 0.95, 0.7],
          }}
          transition={{
            duration: flickerDuration * 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Heat distortion ring (legendary only) */}
      {tier >= 4 && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            border: `1px solid ${palette.glow}`,
            backdropFilter: "blur(0.5px)",
          }}
          animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
      )}

      {/* Smoke */}
      {smoke.map((s) => (
        <motion.div
          key={`smoke-${s.id}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 14,
            height: 14,
            background: "rgba(180,180,200,0.25)",
            filter: "blur(8px)",
            bottom: "70%",
            left: `calc(50% + ${s.x}px)`,
          }}
          animate={{
            y: [-10, -size * 0.9],
            x: [s.x, s.x + (Math.random() - 0.5) * 30],
            opacity: [0, 0.5, 0],
            scale: [0.5, 1.4, 1.8],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Flame SVG stack */}
      {!isDead && (
        <div
          className="absolute left-1/2 bottom-2 -translate-x-1/2"
          style={{
            width: size * 0.7,
            height: size * 0.85,
            filter: `drop-shadow(0 0 ${6 + tier * 3}px ${palette.outer})`,
          }}
        >
          {/* Outer flame (largest, slowest flicker) */}
          <motion.svg
            viewBox="0 0 100 130"
            className="absolute inset-0 w-full h-full"
            animate={{
              scaleY: [1, 1.08, 0.94, 1.05, 1],
              scaleX: [1, 0.96, 1.04, 0.98, 1],
            }}
            transition={{
              duration: flickerDuration * 1.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ transformOrigin: "50% 100%" }}
          >
            <path
              d="M50 5 C 25 35, 10 60, 15 85 C 18 110, 35 125, 50 125 C 65 125, 82 110, 85 85 C 90 60, 75 35, 50 5 Z"
              fill={palette.outer}
              opacity={0.9}
            />
          </motion.svg>

          {/* Mid flame */}
          <motion.svg
            viewBox="0 0 100 130"
            className="absolute inset-0 w-full h-full"
            animate={{
              scaleY: [1, 1.12, 0.9, 1.08, 1],
              scaleX: [1, 0.92, 1.06, 0.96, 1],
              x: [0, 1, -1, 0.5, 0],
            }}
            transition={{
              duration: flickerDuration * 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ transformOrigin: "50% 100%" }}
          >
            <path
              d="M50 25 C 32 50, 25 70, 30 90 C 33 110, 42 122, 50 122 C 58 122, 67 110, 70 90 C 75 70, 68 50, 50 25 Z"
              fill={palette.mid}
            />
          </motion.svg>

          {/* Inner core (fastest flicker) */}
          <motion.svg
            viewBox="0 0 100 130"
            className="absolute inset-0 w-full h-full"
            animate={{
              scaleY: [1, 1.18, 0.85, 1.12, 1],
              scaleX: [1, 0.88, 1.1, 0.94, 1],
              x: [0, -1.5, 1.5, -0.5, 0],
            }}
            transition={{
              duration: flickerDuration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ transformOrigin: "50% 100%" }}
          >
            <path
              d="M50 50 C 40 65, 36 80, 40 95 C 43 110, 47 118, 50 118 C 53 118, 57 110, 60 95 C 64 80, 60 65, 50 50 Z"
              fill={palette.core}
            />
          </motion.svg>

          {/* Hot white tip */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{
              bottom: "18%",
              width: size * 0.12,
              height: size * 0.18,
              background: "white",
              filter: "blur(3px)",
            }}
            animate={{
              opacity: [0.7, 1, 0.5, 0.95, 0.7],
              scaleY: [1, 1.2, 0.8, 1.1, 1],
            }}
            transition={{
              duration: flickerDuration * 0.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      )}

      {/* Dead state — small smoldering ember */}
      {isDead && (
        <div
          className="absolute left-1/2 bottom-4 -translate-x-1/2 rounded-full"
          style={{
            width: 14,
            height: 14,
            background: "radial-gradient(circle, #555, transparent 70%)",
            filter: "blur(2px)",
          }}
        />
      )}

      {/* Floating embers */}
      {embers.map((e) => (
        <motion.div
          key={`ember-${e.id}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: e.size,
            height: e.size,
            background: palette.core,
            boxShadow: `0 0 ${e.size * 3}px ${palette.mid}`,
            bottom: "30%",
            left: `calc(50% + ${e.x}px)`,
          }}
          animate={{
            y: [0, -size * 0.8],
            x: [e.x, e.x + (Math.random() - 0.5) * 20],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.3],
          }}
          transition={{
            duration: e.duration,
            delay: e.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Tap sparks */}
      <AnimatePresence>
        {sparks.map((s) => (
          <motion.div
            key={s.id}
            className="absolute left-1/2 top-1/2 rounded-full pointer-events-none"
            style={{
              width: s.size,
              height: s.size,
              background: s.color,
              boxShadow: `0 0 ${s.size * 4}px ${s.color}`,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(s.angle) * s.distance,
              y: Math.sin(s.angle) * s.distance,
              opacity: 0,
              scale: 0.2,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
