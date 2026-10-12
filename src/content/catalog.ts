import type { RegionMeta, Topic } from './types'
import topicsJson from './generated/topics.json'

export const allTopics = topicsJson as Topic[]

export const topicsById = new Map<number, Topic>(
  allTopics.map((t) => [t.id, t]),
)

export const regions: RegionMeta[] = [
  {
    id: 'r1-foundations',
    name: 'Foundations',
    subtitle: 'Launchpad',
    theme: 'cyan',
    topicIds: [1, 2, 3],
  },
  {
    id: 'r2-networking',
    name: 'Networking & APIs',
    subtitle: 'Neon Network City',
    theme: 'violet',
    topicIds: [4, 5, 6, 7, 8, 9, 10],
  },
  {
    id: 'r3-load-balancing',
    name: 'Load Balancing & Proxies',
    subtitle: 'Traffic Control District',
    theme: 'amber',
    topicIds: [11, 12, 13, 14],
  },
  {
    id: 'r4-caching',
    name: 'Caching',
    subtitle: 'Frost Cache Caverns',
    theme: 'sky',
    topicIds: [15, 16, 17, 18, 19, 20],
  },
  {
    id: 'r5-databases',
    name: 'Databases',
    subtitle: 'Data Citadel',
    theme: 'emerald',
    topicIds: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
  },
  {
    id: 'r6-messaging',
    name: 'Messaging & Reliability',
    subtitle: 'Queue Railways',
    theme: 'orange',
    topicIds: [36, 37, 38, 39, 40, 41, 42, 43, 44],
  },
  {
    id: 'r7-coordination',
    name: 'Distributed Coordination',
    subtitle: 'Consensus Peaks',
    theme: 'rose',
    topicIds: [45, 46, 47, 48, 49],
  },
  {
    id: 'r8-microservices',
    name: 'Microservices & Ops',
    subtitle: 'Operations Spaceport',
    theme: 'indigo',
    topicIds: [50, 51, 52, 53, 54, 55, 56, 69, 70],
  },
  {
    id: 'r9-security-storage',
    name: 'Security, Storage & Data',
    subtitle: 'Vault & Archive',
    theme: 'fuchsia',
    topicIds: [57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 71, 72, 73],
  },
  {
    id: 'boss-arena',
    name: 'Boss Arena',
    subtitle: 'Architecture Colosseum',
    theme: 'red',
    topicIds: [...Array.from({ length: 41 }, (_, i) => 74 + i)],
  },
  {
    id: 'r10-strategy',
    name: 'Strategy',
    subtitle: 'Interview Summit',
    theme: 'lime',
    topicIds: [115, 116, 117, 118, 119, 120],
  },
]

export function orderedTopicsInRegion(regionId: RegionMeta['id']): Topic[] {
  const region = regions.find((r) => r.id === regionId)
  if (!region) return []
  return region.topicIds
    .map((id) => topicsById.get(id))
    .filter((t): t is Topic => Boolean(t))
}
