export type RegionId = 'foundations' | 'networking' | 'loadbalancing' | 'caching' | 'databases' | 'messaging' | 'coordination' | 'ops' | 'security' | 'strategy' | 'boss';

export interface LessonCard { title: string; body: string; kind: 'concept' | 'example' | 'pitfall' | 'visual'; visual?: string[] }

export type UnitKey = 'per_s' | 'k_per_s' | 'm_per_s' | 'mb' | 'gb' | 'tb' | 'pb' | 'hours' | 'count';

export type Question =
  | { id: string; type: 'mcq'; prompt: string; options: string[]; answer: number; explanation: string }
  | { id: string; type: 'multi'; prompt: string; options: string[]; answers: number[]; explanation: string }
  | { id: string; type: 'order'; prompt: string; items: string[]; explanation: string } // items in correct order; UI shuffles
  | { id: string; type: 'match'; prompt: string; pairs: [string, string][]; explanation: string }
  | { id: string; type: 'estimate'; prompt: string; answer: number; unit: UnitKey; tolerance: number; explanation: string; acceptAlso?: number[] };

export interface Flashcard { id: string; front: string; back: string }

export interface Topic {
  id: number; region: RegionId; title: string; summary: string;
  cards: LessonCard[]; questions: Question[]; flashcards: Flashcard[]; cheat: string[];
}

export type ComponentKind = 'client' | 'cdn' | 'dns' | 'lb' | 'gateway' | 'service' | 'cache' | 'sql' | 'nosql' | 'queue' | 'worker' | 'blob' | 'search' | 'websocket' | 'ratelimiter' | 'notify' | 'stream' | 'scheduler' | 'analytics';

export interface Boss {
  id: number; title: string; context: string; prereqs: number[];
  functional: string[]; nonFunctional: string[];
  requirementQ: { prompt: string; options: string[]; answers: number[]; explanation: string };
  estimate: { dau: number; actionsPerUser: number; peakFactor: number; label: string };
  required: ComponentKind[]; bonus: ComponentKind[];
  paths: [ComponentKind, ComponentKind][]; // directed reachability requirements
  reference: string[];
}

export interface Region { id: RegionId; order: number; name: string; theme: string; color: string; topicIds: number[] }
