'use client'

import { motion } from 'framer-motion'

export default function Template({
    children
}: {
    children: React.ReactNode
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 0}}
            animate={{ y: 0, opacity: 1}}
            exit={{ opacity: 0 }}
            transition={{ ease: 'easeInOut', duration: 1.00 }}
        >
            {children}
        </motion.div>
    )
}