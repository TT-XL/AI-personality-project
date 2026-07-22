// AI人格项目 - 类型定义

export interface Personality {
  name: string
  slug: string
  description: string
  createdAt: string
  updatedAt: string
  version: string
  metadata: PersonalityMetadata
  partA: RelationshipMemory
  partB: Persona
}

export interface PersonalityMetadata {
  togetherDuration?: string
  apartSince?: string
  occupation?: string
  gender?: string
  realName?: string
  mbti?: string
  zodiac?: string
  tags?: string[]
  attachmentStyle?: string
  loveLanguage?: string
}

export interface RelationshipMemory {
  overview: {
    type: string
    timeline: TimelineEvent[]
  }
  sharedMemories: SharedMemory[]
  dailyPatterns: string[]
  conflictPatterns: ConflictPattern[]
}

export interface TimelineEvent {
  date: string
  event: string
}

export interface SharedMemory {
  title: string
  description: string
  date?: string
  location?: string
}

export interface ConflictPattern {
  trigger: string
  response: string
  example?: string
}

export interface Persona {
  layer0: string[]
  layer1: Identity
  layer2: SpeechStyle
  layer3: EmotionalPattern
  layer4: RelationshipBehavior
}

export interface Identity {
  name: string
  gender?: string
  age?: number
  occupation?: string
  city?: string
  zodiac?: string
  mbti?: string
}

export interface SpeechStyle {
  catchphrases: string[]
  fillerWords: string[]
  punctuation: string
  emojiUsage: string
  sentenceStructure: string
 怼人Words: string[]
}

export interface EmotionalPattern {
  attachmentType: string
  whenHappy: string
  whenSad: string
  whenAngry: string
  whenJealous: string
  whenCoquettish: string
}

export interface RelationshipBehavior {
  whenBeingCared: string
  whenInConflict: string
  whenNeedComfort: string
  exitPatterns: string[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ChatSession {
  personalitySlug: string
  messages: ChatMessage[]
  createdAt: string
}
