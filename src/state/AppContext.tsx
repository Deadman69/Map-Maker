import { createContext, useContext, useReducer, type ReactNode } from 'react'
import { appReducer, initialState, type AppAction } from './appReducer'
import type { AppState } from './types'
import { usePersistSession } from './usePersistSession'

const StateContext = createContext<AppState | null>(null)
const DispatchContext = createContext<((action: AppAction) => void) | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  usePersistSession(state)
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  )
}

export function useAppState(): AppState {
  const ctx = useContext(StateContext)
  if (!ctx) throw new Error('useAppState must be used within AppProvider')
  return ctx
}

export function useAppDispatch(): (action: AppAction) => void {
  const ctx = useContext(DispatchContext)
  if (!ctx) throw new Error('useAppDispatch must be used within AppProvider')
  return ctx
}
