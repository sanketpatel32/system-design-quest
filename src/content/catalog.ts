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
    topicIds: [1, 2, 507, 3],
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
    topicIds: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 502, 32, 33, 34, 35],
  },
  {
    id: 'r6-messaging',
    name: 'Messaging & Reliability',
    subtitle: 'Queue Railways',
    theme: 'orange',
    topicIds: [36, 37, 38, 39, 40, 504, 41, 42, 43, 44, 503],
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
    topicIds: [50, 51, 52, 53, 54, 501, 55, 56, 69, 505, 506, 508, 70],
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
  // Fundamentals track: language-agnostic foundations, IDs 200+ so system-design progress (1–120) never moves
  { id: 'f1-frontend', name: 'Frontend', subtitle: 'How the browser works', theme: 'sky', topicIds: [...range(201, 220), ...range(341, 346), ...range(521, 530)], track: 'fundamentals' },
  { id: 'f2-backend', name: 'Backend', subtitle: 'How servers handle work', theme: 'green', topicIds: [...range(221, 240), ...range(351, 356), 531, 711, 712, 713, ...range(535, 540)], track: 'fundamentals' },
  { id: 'f3-networking', name: 'Networking', subtitle: 'How packets get there', theme: 'violet', topicIds: [...range(241, 260), ...range(541, 550), ...range(601, 620)], track: 'fundamentals' },
  { id: 'f4-databases', name: 'Databases', subtitle: 'How data is stored and queried', theme: 'emerald', topicIds: [...range(261, 275), 559, 552, 560, 553, 555, 557, 551, 558, 625, 621, 624, 626, 622, 554, 556, 623], track: 'fundamentals' },
  { id: 'f5-os', name: 'Operating Systems & Concurrency', subtitle: 'How programs share one machine', theme: 'teal', topicIds: [281, 282, 283, 561, 562, 563, 645, 646, 284, 647, 566, 285, 568, 644, 286, 641, 642, 564, 287, 643, 288, 567, 289, 648, 570, 290, 649, 565, 569, 650], track: 'fundamentals' },
  { id: 'f6-security', name: 'Security', subtitle: 'How systems are attacked and defended', theme: 'red', topicIds: [...range(301, 320), ...range(571, 580), ...range(661, 680)], track: 'fundamentals' },
  { id: 'f7-cloud', name: 'Cloud & DevOps', subtitle: 'How software is shipped and run', theme: 'amber', topicIds: [...range(321, 340), 581, 582, 589, 590, 588, 681, 682, 583, 683, 684, 584, 685, 686, 688, 585, 687, 690, 689, 586, 587], track: 'fundamentals' },
]

function range(from: number, to: number) {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}

export function orderedTopicsInRegion(regionId: RegionMeta['id']): Topic[] {
  const region = regions.find((r) => r.id === regionId)
  if (!region) return []
  return region.topicIds
    .map((id) => topicsById.get(id))
    .filter((t): t is Topic => Boolean(t))
}
