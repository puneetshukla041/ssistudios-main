'use client'

import { useState } from 'react'
import PreloaderEditor from '@/components/preloadereditor' // Make sure this path is correct
import PosterEditor from './page' // Assuming poster1editor is in the same folder

export default function PosterEditorWrapper() {
  const [showPreloader, setShowPreloader] = useState(true)

  return (
    <>
      {showPreloader ? (
        <PreloaderEditor onFinish={() => setShowPreloader(false)} />
      ) : (
        <PosterEditor />
      )}
    </>
  )
}
