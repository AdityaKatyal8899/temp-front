import { motion } from "motion/react";
import { Cloud, Folder, ArrowRight, Zap, Shield, Rocket } from "lucide-react";
import { Background3D } from "./Background3D";

interface LandingPageProps {
  onGetStarted: () => void;
  onManage: () => void;
}

export function LandingPage({ onGetStarted, onManage }: LandingPageProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950 flex items-center justify-center p-6 overflow-hidden">
      <Background3D />
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl w-full text-center relative z-10"
      >
        {/* Logo/Icon */}
        <motion.div variants={itemVariants} className="mb-8 flex justify-center">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-2xl"
          >
            <Cloud className="w-16 h-16 text-white" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={itemVariants}
          className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-4"
        >
          Temp Share
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-12 max-w-2xl mx-auto"
        >
          Share files instantly with temporary access. Fast, secure, and simple.
        </motion.p>

        {/* Feature Cards */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="p-6 bg-white/60 dark:bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 shadow-lg"
          >
            <Zap className="w-10 h-10 text-yellow-500 mb-3 mx-auto" />
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Lightning Fast</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Upload and share in seconds</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="p-6 bg-white/60 dark:bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 shadow-lg"
          >
            <Shield className="w-10 h-10 text-green-500 mb-3 mx-auto" />
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Secure Access</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Code-protected sharing</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="p-6 bg-white/60 dark:bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 shadow-lg"
          >
            <Rocket className="w-10 h-10 text-blue-500 mb-3 mx-auto" />
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Easy to Use</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">No account required</p>
          </motion.div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-6 justify-center items-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onGetStarted}
            className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-semibold text-lg shadow-2xl overflow-hidden"
          >
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600"
              initial={{ x: "100%" }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
            <span className="relative flex items-center gap-2">
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onManage}
            className="px-8 py-4 bg-white/60 dark:bg-white/10 backdrop-blur-lg text-gray-800 dark:text-white rounded-full font-semibold text-lg border border-white/20 shadow-lg flex items-center gap-2"
          >
            <Folder className="w-5 h-5" />
            Manage Files
          </motion.button>
        </motion.div>

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-indigo-400 rounded-full"
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 20}%`,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
