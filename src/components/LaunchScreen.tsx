import { motion, AnimatePresence } from "framer-motion";
import { Activity, TrendingUp, Shield, BarChart3 } from "lucide-react";

interface Props {
  show: boolean;
  onComplete: () => void;
}

export default function LaunchScreen({ show, onComplete }: Props) {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          style={{ background: "hsl(220, 20%, 97%)" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Animated background grid */}
          <div className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `
                linear-gradient(hsl(217 91% 60%) 1px, transparent 1px),
                linear-gradient(90deg, hsl(217 91% 60%) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
            }}
          />

          {/* Radial glow */}
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(217 91% 60% / 0.1) 0%, transparent 70%)",
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative z-10 flex flex-col items-center gap-8">
            {/* Animated logo */}
            <motion.div
              className="relative"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
            >
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-gold-muted flex items-center justify-center glow-blue shadow-lg">
                <Activity className="h-10 w-10 text-primary-foreground" />
              </div>
              <motion.div
                className="absolute -inset-2 rounded-2xl border border-primary/30"
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>

            {/* Title */}
            <motion.div
              className="text-center space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient-gold">
                Trading Performance
              </h1>
              <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase">
                Compound Growth Engine
              </p>
            </motion.div>

            {/* Feature pills */}
            <motion.div
              className="flex flex-wrap justify-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              {[
                { icon: TrendingUp, label: "Real-time P/L" },
                { icon: Shield, label: "PIN Protected" },
                { icon: BarChart3, label: "Multi-year Analytics" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-xs text-primary font-medium"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + i * 0.15 }}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </motion.div>
              ))}
            </motion.div>

            {/* Loading bar */}
            <motion.div
              className="w-48 h-1 rounded-full bg-muted overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-blue-400 to-primary rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ delay: 1.4, duration: 1.5, ease: "easeInOut" }}
                onAnimationComplete={() => {
                  setTimeout(onComplete, 200);
                }}
              />
            </motion.div>

            <motion.p
              className="text-xs text-muted-foreground font-mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.5, 1] }}
              transition={{ delay: 1.5, duration: 1.5 }}
            >
              Initializing trading systems...
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
