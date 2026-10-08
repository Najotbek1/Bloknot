import { createContext, useContext } from 'react'

/** Where the Bloknot tab is: the list, one notebook, or one note inside it. */
export type NotebooksView =
  | { view: 'list' }
  | { view: 'notebook'; notebookId: string }
  | { view: 'note'; notebookId: string; noteId: string; isNew?: boolean }

export interface NavigationApi {
  /** Switches to the Bloknot tab and opens a note. */
  openNote: (note: { notebookId: string; noteId: string; isNew?: boolean }) => void
}

export const NavigationContext = createContext<NavigationApi>({ openNote: () => {} })

export function useNavigation(): NavigationApi {
  return useContext(NavigationContext)
}
