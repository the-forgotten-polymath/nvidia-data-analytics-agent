"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, VolumeX } from "lucide-react"
import { voiceManager } from "@/lib/voice-manager"
import { useToast } from "@/hooks/use-toast"

interface VoiceControlsProps {
  onTranscript: (text: string) => void
  onSpeakResponse: (text: string) => void
  disabled?: boolean
}

export function VoiceControls({ onTranscript, onSpeakResponse, disabled = false }: VoiceControlsProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isSupported, setIsSupported] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Check if voice features are supported
    setIsSupported(voiceManager.isSupported())

    // Check microphone permission
    if (navigator.permissions) {
      navigator.permissions.query({ name: "microphone" as PermissionName }).then((result) => {
        setPermissionGranted(result.state === "granted")

        result.onchange = () => {
          setPermissionGranted(result.state === "granted")
        }
      })
    }

    // Load available voices
    if (voiceManager.isSpeechSynthesisSupported()) {
      const loadVoices = () => {
        const voices = voiceManager.getAvailableVoices()
        if (voices.length === 0) {
          // Voices might not be loaded yet, try again
          setTimeout(loadVoices, 100)
        }
      }
      loadVoices()
    }
  }, [])

  const startListening = async () => {
    if (!isSupported || disabled) return

    try {
      setTranscript("")
      await voiceManager.startListening(
        (text, isFinal) => {
          setTranscript(text)
          if (isFinal) {
            onTranscript(text)
            setTranscript("")
          }
        },
        (error) => {
          toast({
            title: "Voice Recognition Error",
            description: error,
            variant: "destructive",
          })
          setIsListening(false)
        },
        () => {
          setIsListening(true)
          toast({
            title: "Listening...",
            description: "Speak now. I'm listening to your question.",
          })
        },
        () => {
          setIsListening(false)
        },
      )
    } catch (error) {
      toast({
        title: "Voice Error",
        description: "Failed to start voice recognition. Please check your microphone permissions.",
        variant: "destructive",
      })
    }
  }

  const stopListening = () => {
    voiceManager.stopListening()
    setIsListening(false)
    setTranscript("")
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const speakText = (text: string) => {
    if (!voiceManager.isSpeechSynthesisSupported() || disabled) return

    voiceManager.speak(
      text,
      () => {
        setIsSpeaking(true)
        toast({
          title: "Speaking...",
          description: "Playing AI response audio.",
        })
      },
      () => {
        setIsSpeaking(false)
      },
      (error) => {
        toast({
          title: "Speech Error",
          description: error,
          variant: "destructive",
        })
        setIsSpeaking(false)
      },
    )
  }

  const stopSpeaking = () => {
    voiceManager.stopSpeaking()
    setIsSpeaking(false)
  }

  const toggleSpeaking = (text: string) => {
    if (isSpeaking) {
      stopSpeaking()
    } else {
      speakText(text)
    }
  }

  // Expose speak function to parent
  useEffect(() => {
    onSpeakResponse(speakText)
  }, [onSpeakResponse])

  if (!isSupported) {
    return (
      <Card className="p-3 bg-muted/50">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MicOff className="w-4 h-4" />
          <span>Voice features not supported in this browser</span>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {/* Voice Input Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant={isListening ? "destructive" : "outline"}
          size="sm"
          onClick={toggleListening}
          disabled={disabled || permissionGranted === false}
          className={isListening ? "nvidia-glow animate-pulse" : ""}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          {isListening ? "Stop" : "Voice"}
        </Button>

        {isListening && (
          <Badge variant="secondary" className="animate-pulse">
            Listening...
          </Badge>
        )}

        {isSpeaking && (
          <Button variant="outline" size="sm" onClick={stopSpeaking}>
            <VolumeX className="w-4 h-4" />
            Stop Audio
          </Button>
        )}
      </div>

      {/* Live Transcript */}
      {transcript && (
        <Card className="p-3 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-2">
            <Mic className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-primary mb-1">Live Transcript:</p>
              <p className="text-sm text-foreground">{transcript}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Permission Warning */}
      {permissionGranted === false && (
        <Card className="p-3 bg-destructive/5 border-destructive/20">
          <div className="flex items-start gap-2">
            <MicOff className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive mb-1">Microphone Access Required</p>
              <p className="text-xs text-muted-foreground">
                Please allow microphone access to use voice input features.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
