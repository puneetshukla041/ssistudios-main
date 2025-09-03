'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from "next/image"

import Logo from './Logo'
import {
  Home,
  FileText,
  Layers,
  Palette,
  Settings,
  ChevronDown,
  ChevronRight,
  FileImage,
  HardDrive,
  LayoutTemplate,
  LogOut,
  Layout,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation' // 1. Import Next.js navigation hooks

// --- Menu Data ---
type MenuItem = {
  name: string
  icon: React.ElementType
  path?: string
  children?: { name: string; path: string }[]
  onClick?: () => void
  mobileOnly?: boolean
}

// (Menu data remains the same)
const menu: MenuItem[] = [
  
  
  { name: 'Dashboard', icon: Home, path: '/dashboard' },

    {
    name: 'Bg Remover',
    icon: FileImage,
    path: "/bgremover",

  },


  {
    name: 'Posters',
    icon: Layout,
    children: [
      { name: 'Single Logo Editor', path: '/selector/posters/single' },
      { name: 'Multiple Logos Editor', path: '/selector/posters/multiple' },
    ],
  },
  {
    name: 'Visiting Cards',
    icon: FileText,
    children: [
      { name: 'Dark Theme', path: '/selector/visitingcard/dark' },
      { name: 'Light Theme', path: '/selector/visitingcard/light' },
    ],
  },
  {
    name: 'Certificates',
    icon: Layers,
    children: [
      { name: 'Certificate Generator', path: '/selector/certificate' },
      { name: 'Saved Certificates', path: '/certificates/saved' },
    ],
  },
  {
    name: 'Branding Assets',
    icon: Palette,
    children: [
      { name: 'Logo Library', path: '/logo' },
      { name: 'Fonts & Colors', path: '/theme' },
    ],
  },
  {
    name: 'Settings',
    icon: Settings,
    children: [
      { name: 'Theme', path: '/theme' },
      { name: 'Profile & Preferences', path: '/userprofile' },
    ],
  },
  { name: 'Logout', icon: LogOut, mobileOnly: true },
]



// --- Sidebar Component ---
type SidebarProps = {
  forceActive?: string
  isOpen: boolean
  toggleSidebar: () => void
}
interface MenuItemProps {
  name: string;
  icon: any;
  path: string;
  isNew?: boolean;
}

export default function Sidebar({ forceActive, isOpen, toggleSidebar }: SidebarProps) {
  const { logout } = useAuth()
  const router = useRouter() // 2. Initialize the router
  const pathname = usePathname() // 3. Get the current path reliably
  const [expanded, setExpanded] = useState<string[]>([])
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    // Automatically expand the parent of the active page
    const expandedParents = menu
      .filter(
        (item) =>
          item.children && item.children.some((child) => pathname.startsWith(child.path))
      )
      .map((item) => item.name)
    setExpanded(expandedParents)
  }, [pathname])

  const toggle = (name: string) =>
    setExpanded((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]))

  const isParentActive = (item: MenuItem) => {
    if (forceActive) return item.name === forceActive
    if (item.path && pathname.startsWith(item.path)) return true
    if (item.children) return item.children.some((c) => pathname.startsWith(c.path))
    return false
  }

  const isChildActive = (path: string) => pathname.startsWith(path)

  const handleLogout = () => logout()

  const isEditingEnvironment =
    pathname.includes('/poster/new/single-logo/editor') ||
    pathname.includes('/poster/new/multiple-logo/editor')

  const renderSidebarContent = (isMobile: boolean, isDesktopHovered = false) => (
    <aside
      className={`h-screen bg-[#111214] text-white flex flex-col font-nunito border-r-2 border-white/5 shadow-xl transition-all duration-300 ease-in-out relative
        ${isMobile ? 'w-[85%] max-w-sm' : isDesktopHovered ? 'w-64' : 'w-20'}
      `}
    >
      <div className="p-5 h-[72px] border-b border-gray-800/50 flex items-center justify-between overflow-hidden">
<div className="flex items-center justify-center w-full relative">
  {/* Full Logo */}
  <div
    className={`absolute transition-all duration-300 ${
      isMobile || isDesktopHovered
        ? "opacity-100 scale-100"
        : "opacity-0 scale-95"
    }`}
  >
    <Logo />
  </div>

  {/* Compact Icon Logo */}
  <div
    className={`absolute transition-all duration-300 ${
      !isMobile && !isDesktopHovered
        ? "opacity-100 scale-100"
        : "opacity-0 scale-95"
    }`}
  >
    <Image
      src="/ssilogo.png"
      alt="SSI Logo"
      width={32}
      height={32}
      className="transition-all duration-300"
      priority
    />
  </div>
</div>
</div>
      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        {menu.map((item) => {
          
          if (item.mobileOnly && !isMobile) return null

          const Icon = item.icon
          const isOpenMenuItem = expanded.includes(item.name)
          const active = isParentActive(item)

          return (
            
            <div key={item.name} className="mb-1.5">
              <button
                // 4. Update the onClick handler for navigation
                onClick={() => {
                  if (item.name === 'Logout') {
                    handleLogout()
                    return
                  }
                  if (item.children) {
                    toggle(item.name)
                  } else if (item.path && item.path !== pathname) {
                    router.push(item.path) // Use router for navigation
                    if (isOpen) toggleSidebar() // Close mobile sidebar on navigate
                  }
                }}
                className={`group flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 relative
                  ${active ? 'text-white font-medium' : 'text-gray-400 hover:text-white'}
                  ${
                    item.name === 'Logout'
                      ? 'text-red-500 hover:bg-red-500/10 hover:text-red-400'
                      : 'hover:bg-white/5 active:scale-[0.98] cursor-pointer'
                  }
                `}
                type="button"
              >
                <div className="relative flex items-center gap-3 overflow-hidden">
                  <Icon
                    size={18}
                    className={`transition-colors flex-shrink-0 ${
                      active ? 'text-white' : 'text-gray-400 group-hover:text-white'
                    }`}
                  />
                  <span
                    className={`text-sm whitespace-nowrap transition-opacity duration-200 ${
                      isMobile || isDesktopHovered ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {item.name}
                  </span>




                </div>


                <div
                  className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full transition-opacity duration-300 ${
                    active ? 'opacity-100 bg-white shadow-glow' : 'opacity-0'
                  }`}
                />

                {item.children &&
                  (isMobile || isDesktopHovered ? (
                    isOpenMenuItem ? (
                      <ChevronDown
                        size={16}
                        className="text-gray-500 group-hover:text-gray-300 transition-transform duration-200 flex-shrink-0 rotate-180"
                      />
                    ) : (
                      <ChevronRight
                        size={16}
                        className="text-gray-500 group-hover:text-gray-300 transition-transform duration-200 flex-shrink-0"
                      />
                    )
                  ) : null)}
              </button>

              {item.children && (
                <motion.div
                  initial={false}
                  animate={{ height: isOpenMenuItem ? 'auto' : 0, opacity: isOpenMenuItem ? 1 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.3 }}
                  className="ml-5 border-l border-gray-700 pl-4 overflow-hidden mt-2"
                >
                  {item.children.map((child) => {
                    const childIsActive = isChildActive(child.path)
                    return (
                      <button
                        key={child.path}
                        onClick={() => {
                          if (child.path !== pathname) {
                            router.push(child.path) // Use router for child navigation too
                            if (isOpen) toggleSidebar()
                          }
                        }}
                        className={`block w-full text-left px-3 py-2 text-sm rounded-md transition-colors duration-200 mb-1
                          ${
                            childIsActive
                              ? 'text-white font-medium'
                              : 'text-gray-400 hover:text-white'
                          }
                          hover:bg-white/5 active:scale-[0.98] cursor-pointer
                        `}
                        type="button"
                      >
                        {child.name}
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </div>
          )
        })}
        
{/* Storage Card - Compact */}
{(isMobile || isDesktopHovered) && (
  <div className="mx-2 mt-2 mb-1 p-2.5 rounded-lg border border-gray-700/40 bg-gray-900/30 shadow-sm backdrop-blur-sm">
    {/* Title and Icon */}
    <div className="flex items-center gap-1.5">
      <HardDrive size={14} className="text-blue-400/90 flex-shrink-0" />
      <h3 className="text-[11px] font-medium text-gray-200">Storage Used</h3>
    </div>
    
    {/* Progress Bar and Values */}
    <div className="mt-1.5">
      <div className="flex justify-between items-baseline mb-0.5">
        <span className="text-sm font-semibold text-white">44MB</span>
        <span className="text-[9px] text-gray-400">of 500MB</span>
      </div>
      <div className="w-full h-1 bg-gray-700/60 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: '8.8%' }}
        />
      </div>
    </div>

    {/* Trend Information */}
    <div className="mt-1 text-[9px] font-medium flex items-center gap-1 text-green-400/90">
      <span>+3 from last month</span>
    </div>
  </div>
)}

{/* Templates Card - Compact */}
{(isMobile || isDesktopHovered) && (
  <div className="mx-2 mt-2 mb-1 p-2.5 rounded-lg border border-gray-700/40 bg-gray-900/30 shadow-sm backdrop-blur-sm">
    {/* Header: Icon + Title */}
    <div className="flex items-center gap-1.5">
      <LayoutTemplate size={14} className="text-green-500/90 flex-shrink-0" />
      <span className="text-[11px] font-medium text-gray-200">Templates</span>
    </div>

    {/* Progress Bar and Values */}
    <div className="mt-1.5">
      <div className="flex justify-between items-baseline mb-0.5">
        <span className="text-sm font-semibold text-white">3</span>
        <span className="text-[9px] text-gray-400">This month</span>
      </div>
      <div className="w-full h-1 bg-gray-700/60 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: '45%' }}
        />
      </div>
    </div>

    {/* Trend Information */}
    <div className="mt-1 text-[9px] font-medium flex items-center gap-1 text-green-400/90">
      +12 from last month
    </div>
  </div>
)}





      </nav>

      <div
        className={`p-4 border-t border-gray-800/50 w-full mt-auto hidden lg:block transition-opacity duration-300 ${
          isDesktopHovered ? "opacity-100" : "opacity-0"
        }`}
      >
        
{/* Download Android App Button */}
<a
  href="https://drive.google.com/file/d/1AgSWuLtwlhmCxMTsDuHLxvmA8MuKDbTL/view?usp=sharing" // Replace with your actual link
  target="_blank"
  rel="noopener noreferrer"
  className="w-full mb-3 flex items-center justify-center gap-2 rounded-lg 
              bg-gradient-to-r from-green-600 via-green-700 to-green-800 
              hover:from-green-500 hover:via-green-600 hover:to-green-700
              text-white font-medium text-sm py-2.5 
              shadow-md shadow-black/30 backdrop-blur-md
              transition-all cursor-pointer active:scale-[0.97]"
>

  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8Zm-1-13h2v6h-2Zm0 8h2v2h-2Z"/>
  </svg>
  Download Android App
</a>

{/* Download Desktop App Button */}
<a
  href="https://drive.google.com/uc?export=download&id=1wsR2aYD_iW_dFCKuP-f2IwOusziUHQiK"
  download
  className="w-full mb-3 flex items-center justify-center gap-2 rounded-lg 
              bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 
              hover:from-gray-600 hover:via-gray-700 hover:to-gray-800
              text-gray-200 font-medium text-sm py-2.5 
              shadow-md shadow-black/30 backdrop-blur-md
              transition-all cursor-pointer active:scale-[0.97]"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
    />
  </svg>
  Download Desktop App
</a>


        <div className="text-gray-500 text-xs text-center select-none">
          SSI STUDIOS v.1.08.25
        </div>
        <div className="text-green-500 text-xs text-center select-none">
          Beta Version
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 text-sm text-red-500 hover:text-red-400 transition-colors w-full py-2 rounded-lg hover:bg-red-500/10 cursor-pointer mt-3"
          type="button"
        >
          Logout
        </button>
      </div>

    </aside>
  )

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Desktop Sidebar */}
      <div
        className="hidden lg:block fixed top-0 left-0 h-screen z-30"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {renderSidebarContent(false, isHovered)}
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 lg:hidden"
            aria-hidden={!isOpen}
          >
            <div
              className="absolute inset-0 bg-black/60"
              onClick={toggleSidebar}
              aria-label="Close sidebar overlay"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 250, damping: 35 }}
              className="relative w-[85%] max-w-sm h-full"
            >
              {renderSidebarContent(true)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .font-nunito {
          font-family: 'Nunito', sans-serif;
        }
        .shadow-glow {
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </>
  )
}