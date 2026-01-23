import { motion } from "motion/react";
import { Upload, FolderOpen } from "lucide-react";

interface GetStartedProps {
  onBack: () => void;
  onUploadFiles: () => void;
  onAccessFiles: () => void;
}

export function GetStarted({ onBack, onUploadFiles, onAccessFiles }: GetStartedProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full"
      >
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="px-5 py-2 bg-white/60 dark:bg-white/10 backdrop-blur-lg text-gray-800 dark:text-white rounded-full font-semibold border border-white/20 shadow-lg"
          >
            ← Back
          </motion.button>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Get Started</h2>
          <div className="w-24" /> {/* Spacer */}
        </div>

        {/* Options */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {/* Upload Files */}
          <motion.button
            whileHover={{ scale: 1.05, y: -10 }}
            whileTap={{ scale: 0.95 }}
            onClick={onUploadFiles}
            className="group relative p-10 bg-white/60 dark:bg-white/5 backdrop-blur-lg rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            
            <div className="relative z-10">
              <div className="mb-6 flex justify-center">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="p-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-lg"
                >
                  <Upload className="w-16 h-16 text-white" />
                </motion.div>
              </div>
              
              <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                Upload Files
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Share your files quickly and securely with drag & drop or file selection
              </p>
            </div>
          </motion.button>

          {/* Access Files */}
          <motion.button
            whileHover={{ scale: 1.05, y: -10 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAccessFiles}
            className="group relative p-10 bg-white/60 dark:bg-white/5 backdrop-blur-lg rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            
            <div className="relative z-10">
              <div className="mb-6 flex justify-center">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="p-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl shadow-lg"
                >
                  <FolderOpen className="w-16 h-16 text-white" />
                </motion.div>
              </div>
              
              <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                Access Files
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Retrieve shared files using a URL or access code provided by the sender
              </p>
            </div>
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
