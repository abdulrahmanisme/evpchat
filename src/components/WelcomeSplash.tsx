import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Award, Target, TrendingUp } from "lucide-react";

interface WelcomeSplashProps {
  onComplete: () => void;
}

export const WelcomeSplash = ({ onComplete }: WelcomeSplashProps) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Stage 0: Initial entry animation (1.5s)
    const timer1 = setTimeout(() => setStage(1), 1500);
    
    // Stage 1: Show main content (2s)
    const timer2 = setTimeout(() => setStage(2), 3500);
    
    // Stage 3: Fade out and navigate (3s)
    const timer3 = setTimeout(() => {
      onComplete();
    }, 6500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: Math.random() > 0.5 ? '#50C8E8' : '#9ACD32',
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-4">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: stage >= 1 ? 1 : 0, rotate: stage >= 1 ? 0 : -180 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="relative inline-block">
            <motion.div
              className="absolute inset-0 blur-3xl rounded-full"
              style={{ backgroundColor: '#50C8E8' }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="relative bg-black/80 backdrop-blur-sm rounded-full p-6 border-2 border-gray-600">
              <Sparkles className="h-16 w-16" style={{ color: '#50C8E8' }} />
            </div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: stage >= 1 ? 1 : 0, y: stage >= 1 ? 0 : 50 }}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="text-6xl md:text-7xl font-bold mb-4"
        >
          <span className="block" style={{ color: '#50C8E8' }}>Welcome</span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: stage >= 1 ? 1 : 0 }}
            transition={{ duration: 1.2, delay: 1 }}
            className="bg-gradient-to-r from-[#50C8E8] to-[#9ACD32] bg-clip-text text-transparent"
          >
            Campus Lead
          </motion.span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: stage >= 2 ? 1 : 0, y: stage >= 2 ? 0 : 30 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="flex justify-center gap-6 mt-12"
        >
          {[
            { Icon: Award, color: "#50C8E8", label: "Achieve" },
            { Icon: Target, color: "#9ACD32", label: "Track" },
            { Icon: TrendingUp, color: "#50C8E8", label: "Grow" },
          ].map(({ Icon, color, label }, index) => (
            <motion.div
              key={label}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 2 + index * 0.2, type: "spring", stiffness: 200, duration: 1 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="p-3 rounded-xl shadow-lg" style={{ backgroundColor: color }}>
                <Icon className="h-8 w-8 text-white" />
              </div>
              <span className="text-white text-sm font-medium">{label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: stage >= 2 ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 2.5 }}
          className="mt-8"
        >
          <div className="flex items-center justify-center gap-2">
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: '#50C8E8' }}
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: '#9ACD32' }}
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            />
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: '#50C8E8' }}
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
            />
          </div>
        </motion.div>
      </div>

      {/* Fade overlay for exit */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: stage >= 2 ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0 bg-white"
      />
    </div>
  );
};

export default WelcomeSplash;

