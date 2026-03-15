export interface VoiceSettings {
  language: string
  rate: number
  pitch: number
  volume: number
}

export class VoiceManager {
  private static instance: VoiceManager
  private recognition: any | null = null
  private synthesis: SpeechSynthesis
  private isListening = false
  private settings: VoiceSettings = {
    language: "en-US",
    rate: 1,
    pitch: 1,
    volume: 0.8,
  }

  private constructor() {
    this.synthesis = window.speechSynthesis
    this.initializeSpeechRecognition()
  }

  public static getInstance(): VoiceManager {
    if (!VoiceManager.instance) {
      VoiceManager.instance = new VoiceManager()
    }
    return VoiceManager.instance
  }

  private initializeSpeechRecognition() {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      this.recognition = new SpeechRecognition()

      this.recognition.continuous = false
      this.recognition.interimResults = true
      this.recognition.lang = this.settings.language
      this.recognition.maxAlternatives = 1
    }
  }

  public isSupported(): boolean {
    return !!(this.recognition && this.synthesis)
  }

  public isSpeechRecognitionSupported(): boolean {
    return !!this.recognition
  }

  public isSpeechSynthesisSupported(): boolean {
    return !!this.synthesis
  }

  public async startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onStart?: () => void,
    onEnd?: () => void,
  ): Promise<void> {
    if (!this.recognition) {
      onError("Speech recognition is not supported in this browser")
      return
    }

    if (this.isListening) {
      this.stopListening()
    }

    return new Promise((resolve, reject) => {
      if (!this.recognition) return reject("Speech recognition not available")

      this.recognition.onstart = () => {
        this.isListening = true
        onStart?.()
        resolve()
      }

      this.recognition.onresult = (event) => {
        let transcript = ""
        let isFinal = false

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          transcript += result[0].transcript

          if (result.isFinal) {
            isFinal = true
          }
        }

        onResult(transcript, isFinal)
      }

      this.recognition.onerror = (event) => {
        this.isListening = false
        let errorMessage = "Speech recognition error"

        switch (event.error) {
          case "no-speech":
            errorMessage = "No speech detected. Please try again."
            break
          case "audio-capture":
            errorMessage = "Microphone access denied or not available."
            break
          case "not-allowed":
            errorMessage = "Microphone permission denied. Please allow microphone access."
            break
          case "network":
            errorMessage = "Network error occurred during speech recognition."
            break
          default:
            errorMessage = `Speech recognition error: ${event.error}`
        }

        onError(errorMessage)
      }

      this.recognition.onend = () => {
        this.isListening = false
        onEnd?.()
      }

      try {
        this.recognition.start()
      } catch (error) {
        this.isListening = false
        reject(error)
      }
    })
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }

  public speak(text: string, onStart?: () => void, onEnd?: () => void, onError?: (error: string) => void): void {
    if (!this.synthesis) {
      onError?.("Speech synthesis is not supported in this browser")
      return
    }

    // Cancel any ongoing speech
    this.synthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = this.settings.language
    utterance.rate = this.settings.rate
    utterance.pitch = this.settings.pitch
    utterance.volume = this.settings.volume

    utterance.onstart = () => {
      onStart?.()
    }

    utterance.onend = () => {
      onEnd?.()
    }

    utterance.onerror = (event) => {
      onError?.(`Speech synthesis error: ${event.error}`)
    }

    this.synthesis.speak(utterance)
  }

  public stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel()
    }
  }

  public isSpeaking(): boolean {
    return this.synthesis ? this.synthesis.speaking : false
  }

  public getIsListening(): boolean {
    return this.isListening
  }

  public updateSettings(settings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...settings }

    if (this.recognition) {
      this.recognition.lang = this.settings.language
    }
  }

  public getSettings(): VoiceSettings {
    return { ...this.settings }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis ? this.synthesis.getVoices() : []
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export const voiceManager = VoiceManager.getInstance()
