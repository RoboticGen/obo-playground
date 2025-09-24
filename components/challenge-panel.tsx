"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trophy, Target, BookOpen, Star, Clock, CheckCircle } from "lucide-react"
import { challenges } from "@/lib/session-manager"
import { useSessionStore } from "@/lib/session-manager"

interface ChallengePanelProps {
  onLoadChallenge: (code: string) => void
}

export function ChallengePanel({ onLoadChallenge }: ChallengePanelProps) {
  const { learningProgress, updateProgress } = useSessionStore()
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800"
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "Advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const isCompleted = (challengeId: string) => {
    return learningProgress.completedChallenges.includes(challengeId)
  }

  const handleLoadChallenge = (challenge: any) => {
    onLoadChallenge(challenge.template)
    setSelectedChallenge(challenge.id)
  }

  const completionRate = (learningProgress.completedChallenges.length / challenges.length) * 100

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Learning Challenges
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${completionRate}%` }} />
          </div>
          <span className="text-sm text-muted-foreground">{completionRate.toFixed(0)}%</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="challenges" className="h-full">
          <TabsList className="grid w-full grid-cols-3 mx-4 mb-4">
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="achievements">Rewards</TabsTrigger>
          </TabsList>

          <TabsContent value="challenges" className="px-4 pb-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {challenges.map((challenge) => (
                  <Card
                    key={challenge.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedChallenge === challenge.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => handleLoadChallenge(challenge)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{challenge.title}</h3>
                          {isCompleted(challenge.id) && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </div>
                        <Badge className={`text-xs ${getDifficultyColor(challenge.difficulty)}`}>
                          {challenge.difficulty}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{challenge.description}</p>
                      <Button size="sm" variant="outline" className="w-full text-xs bg-transparent">
                        {isCompleted(challenge.id) ? "Retry Challenge" : "Start Challenge"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="progress" className="px-4 pb-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">{learningProgress.completedChallenges.length}</div>
                  <div className="text-xs text-muted-foreground">of {challenges.length} challenges</div>
                </Card>

                <Card className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium">Runtime</span>
                  </div>
                  <div className="text-2xl font-bold text-accent">{learningProgress.totalRuntime.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">minutes coding</div>
                </Card>
              </div>

              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-chart-3" />
                  <span className="text-sm font-medium">Success Rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-chart-3 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          learningProgress.totalRuns > 0
                            ? (learningProgress.successfulRuns / learningProgress.totalRuns) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {learningProgress.totalRuns > 0
                      ? ((learningProgress.successfulRuns / learningProgress.totalRuns) * 100).toFixed(0)
                      : 0}
                    %
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {learningProgress.successfulRuns} successful runs out of {learningProgress.totalRuns} total
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="px-4 pb-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {[
                  {
                    id: "first-steps",
                    title: "First Steps",
                    description: "Complete your first challenge",
                    icon: "🚗",
                    unlocked: learningProgress.completedChallenges.length > 0,
                  },
                  {
                    id: "navigator",
                    title: "Navigator",
                    description: "Complete all navigation challenges",
                    icon: "🧭",
                    unlocked: learningProgress.completedChallenges.includes("navigation"),
                  },
                  {
                    id: "obstacle-master",
                    title: "Obstacle Master",
                    description: "Master obstacle avoidance",
                    icon: "🛡️",
                    unlocked: learningProgress.completedChallenges.includes("obstacle-avoidance"),
                  },
                  {
                    id: "speed-demon",
                    title: "Speed Demon",
                    description: "Complete a challenge in under 30 seconds",
                    icon: "⚡",
                    unlocked: learningProgress.bestScore < 30 && learningProgress.bestScore > 0,
                  },
                  {
                    id: "perfectionist",
                    title: "Perfectionist",
                    description: "Achieve 100% success rate with 10+ runs",
                    icon: "💎",
                    unlocked:
                      learningProgress.totalRuns >= 10 &&
                      learningProgress.successfulRuns === learningProgress.totalRuns,
                  },
                ].map((achievement) => (
                  <Card
                    key={achievement.id}
                    className={`p-4 ${achievement.unlocked ? "bg-accent/10 border-accent/20" : "opacity-50"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{achievement.title}</h3>
                          {achievement.unlocked && <Star className="w-4 h-4 text-accent fill-current" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
