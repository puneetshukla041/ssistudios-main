'use client'

import { useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { HiOutlineUser, HiOutlineUsers, HiOutlineSparkles } from 'react-icons/hi'
import { motion, AnimatePresence } from 'framer-motion'

// --- Mock Components for demonstration ---
// In your real app, you would import these from a central components folder,
// for example: import { Header } from '@/components/dashboard'
const Header = () => (
  <div>
    <h1 className="text-4xl font-bold text-white">Welcome Back!</h1>
    <p className="text-gray-400 mt-2">Ready to create something amazing today?</p>
  </div>
)

const RectangularCard = () => (
  <div className="p-6 rounded-2xl bg-transparent border border-white/10 backdrop-blur-lg shadow-lg hover:shadow-blue-500/20 transition">
    <div className="flex items-center gap-4">
      <div className="p-2 bg-blue-900/40 rounded-full">
        <HiOutlineSparkles size={24} className="text-blue-300" />
      </div>
      <div>
        <h3 className="font-bold text-white">Pro Tip of the Day</h3>
        <p className="text-sm text-gray-300">
          You can drag and drop images directly onto the logo uploaders to save time!
        </p>
      </div>
    </div>
  </div>
)

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex flex-col justify-center items-center gap-6 z-50">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 border-4 border-white border-t-transparent rounded-full"
      />
      <p className="text-white text-lg font-medium">
        Loading the editing environment...
      </p>
    </div>
  )
}

function ChoiceCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string
  description: string
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick()
      }}
      role="button"
      tabIndex={0}
      className="cursor-pointer rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md p-6 transition-all duration-300 group hover:border-blue-400/50 hover:bg-black/30"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-800/50 rounded-lg border border-white/10 group-hover:bg-blue-500/20">
            {icon}
          </div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
        <p className="text-gray-400 text-base leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}
// --- End of Mock Components ---

// ----------------- Main Page Component -----------------
export default function SelectorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSingleLogoClick = () => {
    setLoading(true)
    setTimeout(() => {
      router.push('/poster/new/single-logo/editor')
    }, 1000)
  }

  const handleMultipleLogosClick = () => {
    setLoading(true)
    setTimeout(() => {
      router.push('/poster/new/multiple-logo/editor')
    }, 1000)
  }

  return (
    <>
      <AnimatePresence>{loading && <LoadingScreen />}</AnimatePresence>

      {/* FIXED: This component now only renders its own content.
          The Sidebar is handled by the main layout file. */}
      <div className="relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-900/50 rounded-full blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-900/50 rounded-full blur-3xl opacity-20 animate-pulse delay-500" />
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <Header />
          </div>

          <div className="mb-14">
            <RectangularCard />
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6 text-white">
              Start a New Project
            </h2>
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ChoiceCard
                title="Single Logo"
                description="Upload and manage one logo per poster for focused branding."
                icon={<HiOutlineUser size={28} className="text-blue-400" />}
                onClick={handleSingleLogoClick}
              />
              <ChoiceCard
                title="Multiple Logos"
                description="Upload and arrange multiple logos to highlight collaborations."
                icon={<HiOutlineUsers size={28} className="text-purple-400" />}
                onClick={handleMultipleLogosClick}
              />
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
