import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ReflectionLeaderboard } from "@/components/reflection/ReflectionLeaderboard";
import { motion } from "framer-motion";

const Leaderboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <motion.div 
        className="container mx-auto px-4 py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>
            <p className="text-muted-foreground">Rankings based on reflection performance and growth</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <ReflectionLeaderboard />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Leaderboard;