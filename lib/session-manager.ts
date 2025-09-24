import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CodeSession {
  id: string
  name: string
  code: string
  timestamp: number
  description?: string
}

export interface LearningProgress {
  completedChallenges: string[]
  totalRuntime: number
  successfulRuns: number
  totalRuns: number
  bestScore: number
  achievements: string[]
}

export interface SessionState {
  currentSession: CodeSession | null
  savedSessions: CodeSession[]
  learningProgress: LearningProgress
  isDebugging: boolean
  debugHistory: Array<{
    timestamp: number
    state: any
    action: string
  }>
}

export const useSessionStore = create<
  SessionState & {
    saveCurrentSession: (name: string, code: string, description?: string) => void
    loadSession: (sessionId: string) => CodeSession | null
    deleteSession: (sessionId: string) => void
    updateProgress: (update: Partial<LearningProgress>) => void
    addDebugSnapshot: (state: any, action: string) => void
    clearDebugHistory: () => void
    toggleDebugging: () => void
  }
>()(
  persist(
    (set, get) => ({
      currentSession: null,
      savedSessions: [],
      learningProgress: {
        completedChallenges: [],
        totalRuntime: 0,
        successfulRuns: 0,
        totalRuns: 0,
        bestScore: 0,
        achievements: [],
      },
      isDebugging: false,
      debugHistory: [],

      saveCurrentSession: (name, code, description) => {
        const session: CodeSession = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          code,
          timestamp: Date.now(),
          description,
        }

        set((state) => ({
          currentSession: session,
          savedSessions: [session, ...state.savedSessions.slice(0, 9)], // Keep last 10
        }))
      },

      loadSession: (sessionId) => {
        const session = get().savedSessions.find((s) => s.id === sessionId)
        if (session) {
          set({ currentSession: session })
          return session
        }
        return null
      },

      deleteSession: (sessionId) => {
        set((state) => ({
          savedSessions: state.savedSessions.filter((s) => s.id !== sessionId),
          currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
        }))
      },

      updateProgress: (update) => {
        set((state) => ({
          learningProgress: { ...state.learningProgress, ...update },
        }))
      },

      addDebugSnapshot: (state, action) => {
        set((prevState) => ({
          debugHistory: [
            ...prevState.debugHistory.slice(-19), // Keep last 20
            {
              timestamp: Date.now(),
              state,
              action,
            },
          ],
        }))
      },

      clearDebugHistory: () => set({ debugHistory: [] }),

      toggleDebugging: () => set((state) => ({ isDebugging: !state.isDebugging })),
    }),
    {
      name: "obo-playground-session",
      partialize: (state) => ({
        savedSessions: state.savedSessions,
        learningProgress: state.learningProgress,
      }),
    },
  ),
)

// Predefined challenges for educational progression
export const challenges = [
  {
    id: "basic-movement",
    title: "Basic Movement",
    description: "Move the car forward 5 units and turn right 90 degrees",
    difficulty: "Beginner",
    template: `# Challenge: Basic Movement
# Move forward 5 units, then turn right 90 degrees

async def main():
    print("Starting basic movement challenge!")
    # Your code here
    
import asyncio
asyncio.run(main())`,
    solution: `async def main():
    await car.move_forward(5)
    await car.turn_right(90)`,
  },
  {
    id: "obstacle-avoidance",
    title: "Obstacle Avoidance",
    description: "Navigate around obstacles using sensor readings",
    difficulty: "Intermediate",
    template: `# Challenge: Obstacle Avoidance
# Use sensors to detect and avoid obstacles

async def main():
    print("Starting obstacle avoidance challenge!")
    
    while True:
        front_distance = car.get_sensor_reading('front')
        
        if front_distance < 3:
            # Obstacle detected! Your avoidance code here
            break
        else:
            await car.move_forward(1)
            await car.wait(0.2)
    
import asyncio
asyncio.run(main())`,
  },
  {
    id: "navigation",
    title: "Point Navigation",
    description: "Navigate to specific coordinates efficiently",
    difficulty: "Advanced",
    template: `# Challenge: Point Navigation
# Navigate to point (5, 5) then return to start (0, 0)

async def main():
    print("Starting navigation challenge!")
    
    # Navigate to target
    await car.navigate_to_point(5, 5)
    print("Reached target!")
    
    # Return to start
    await car.navigate_to_point(0, 0)
    print("Returned to start!")
    
import asyncio
asyncio.run(main())`,
  },
]
