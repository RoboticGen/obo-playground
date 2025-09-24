"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Save, FolderOpen, Trash2, Download, Upload, Clock } from "lucide-react"
import { useSessionStore, type CodeSession } from "@/lib/session-manager"

interface SessionManagerProps {
  currentCode: string
  onLoadCode: (code: string) => void
}

export function SessionManager({ currentCode, onLoadCode }: SessionManagerProps) {
  const { savedSessions, saveCurrentSession, loadSession, deleteSession } = useSessionStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [sessionName, setSessionName] = useState("")
  const [sessionDescription, setSessionDescription] = useState("")

  const handleSaveSession = () => {
    if (sessionName.trim()) {
      saveCurrentSession(sessionName.trim(), currentCode, sessionDescription.trim() || undefined)
      setSessionName("")
      setSessionDescription("")
      setIsDialogOpen(false)
    }
  }

  const handleLoadSession = (sessionId: string) => {
    const session = loadSession(sessionId)
    if (session) {
      onLoadCode(session.code)
    }
  }

  const handleExportSession = (session: CodeSession) => {
    const dataStr = JSON.stringify(session, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${session.name.replace(/\s+/g, "_")}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FolderOpen className="w-5 h-5" />
          Session Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Save Current Session */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2">
              <Save className="w-4 h-4" />
              Save Current Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Code Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Session Name</label>
                <Input
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="My Awesome Car Program"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (Optional)</label>
                <Textarea
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  placeholder="What does this program do?"
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveSession} disabled={!sessionName.trim()} className="flex-1">
                  Save Session
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Saved Sessions List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Saved Sessions</h3>
            <Badge variant="secondary">{savedSessions.length}</Badge>
          </div>

          {savedSessions.length > 0 ? (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {savedSessions.map((session) => (
                  <Card key={session.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{session.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{formatDate(session.timestamp)}</span>
                          </div>
                        </div>
                      </div>

                      {session.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{session.description}</p>
                      )}

                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLoadSession(session.id)}
                          className="flex-1 text-xs bg-transparent"
                        >
                          Load
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportSession(session)}
                          className="text-xs bg-transparent"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteSession(session.id)}
                          className="text-xs text-destructive hover:text-destructive bg-transparent"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No saved sessions yet</p>
              <p className="text-xs">Save your code to access it later</p>
            </div>
          )}
        </div>

        {/* Import Session */}
        <div className="pt-2 border-t">
          <Button variant="outline" className="w-full gap-2 bg-transparent">
            <Upload className="w-4 h-4" />
            Import Session
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
