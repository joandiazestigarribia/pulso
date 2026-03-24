"use client"

import { motion } from "framer-motion"

export function AuthFooter() {
  return (
    <motion.footer
      className="relative z-10 pb-2 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
    >
      <p className="text-xs font-semibold text-white/70">
        Tu progreso está seguro. Inicia sesión o registrate para continuar donde lo dejaste.
      </p>
    </motion.footer>
  )
}
