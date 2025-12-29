import { createContext, useContext, useState, ReactNode } from 'react'

export type VolumeView = 'total' | 'priority'

interface VolumeViewContextType {
  volumeView: VolumeView
  setVolumeView: (view: VolumeView) => void
}

const VolumeViewContext = createContext<VolumeViewContextType | undefined>(undefined)

export function VolumeViewProvider({ children }: { children: ReactNode }) {
  const [volumeView, setVolumeView] = useState<VolumeView>('total')

  return (
    <VolumeViewContext.Provider value={{ volumeView, setVolumeView }}>
      {children}
    </VolumeViewContext.Provider>
  )
}

export function useVolumeView() {
  const context = useContext(VolumeViewContext)
  if (context === undefined) {
    throw new Error('useVolumeView must be used within a VolumeViewProvider')
  }
  return context
}
