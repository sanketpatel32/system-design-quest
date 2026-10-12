import type { Region, Topic, Boss } from './types';
import { T, O } from './helpers';
import { r1 } from './r1'; import { r2 } from './r2'; import { r3 } from './r3'; import { r4 } from './r4'; import { r5 } from './r5';
import { r6 } from './r6'; import { r7 } from './r7'; import { r8 } from './r8'; import { r9 } from './r9'; import { r10 } from './r10';
import { bosses } from './bosses';

const playbook = T('boss')(74, 'Interview Playbook: Boss Arena Tutorial', 'Every boss runs the same four stages: scope, estimate, build the architecture, then defend it against a 100-point rubric.',
 'Stage 1 asks which features are in scope. Stage 2 asks for peak QPS: DAU × actions ÷ 86,400 × peak factor. Stage 3 is the canvas: add components and draw directed edges for how requests flow. Stage 4 grades you and shows the reference design.',
 'The bosses are Indian-market systems: UPI, Tatkal, IPL streaming, quick commerce. Their peaks are sharper than most textbook examples, so the peak factor matters.',
 'Drawing a client straight into a database. The grader deducts hygiene points for that, and for components you leave unconnected.',
 ['Scope (15 pts)', 'Estimate (15 pts)', 'Components (30 pts)', 'Data flow (30 pts)', 'Hygiene (10 pts)'],
 ['How is peak QPS estimated in a boss?', ['DAU ÷ 24', 'DAU × actions ÷ 86,400 × peak factor', 'Number of servers × 1,000', 'Storage ÷ latency'], 1, 'Daily volume spread over a day, then multiplied for the peak.'],
 O('Order the boss stages.', ['Pick the in-scope requirements', 'Estimate peak QPS', 'Assemble and connect the architecture', 'Review rubric and reference design'], 'The same order as a real interview.'),
 [['Boss rubric total?', '100: scope 15, estimate 15, components 30, flow 30, hygiene 10.'], ['Boss pass mark?', '70 points.']]);

const bossTopic = (b: Boss): Topic => ({
  id: b.id, region: 'boss', title: b.title, summary: b.context,
  cards: [
    { kind: 'concept', title: 'The brief', body: `${b.context} Must do: ${b.functional.join('; ')}.` },
    { kind: 'example', title: 'Quality bar', body: b.nonFunctional.join('. ') + '.' },
  ],
  questions: [], flashcards: [{ id: `${b.id}-f0`, front: `Key idea for ${b.title}?`, back: b.reference[0] }],
  cheat: b.reference,
});

export const learningTopics: Topic[] = [...r1, ...r2, ...r3, ...r4, ...r5, ...r6, ...r7, ...r8, ...r9, ...r10];
export const topics: Topic[] = [...learningTopics, playbook, ...bosses.map(bossTopic)].sort((a, b) => a.id - b.id);
export const topicById = new Map(topics.map((t) => [t.id, t]));
export { bosses };
export const bossById = new Map(bosses.map((b) => [b.id, b]));

const ids = (region: string) => learningTopics.filter((t) => t.region === region).map((t) => t.id);
export const regions: Region[] = [
  { id: 'foundations', order: 1, name: 'Foundations', theme: 'Launchpad', color: '#F2B33D', topicIds: ids('foundations') },
  { id: 'networking', order: 2, name: 'Networking & APIs', theme: 'Neon Network City', color: '#38C6E8', topicIds: ids('networking') },
  { id: 'loadbalancing', order: 3, name: 'Load Balancing & Proxies', theme: 'Traffic Control District', color: '#F2643D', topicIds: ids('loadbalancing') },
  { id: 'caching', order: 4, name: 'Caching', theme: 'Frost Cache Caverns', color: '#9FE3F5', topicIds: ids('caching') },
  { id: 'databases', order: 5, name: 'Databases', theme: 'Data Citadel', color: '#5C8DF2', topicIds: ids('databases') },
  { id: 'messaging', order: 6, name: 'Messaging & Reliability', theme: 'Queue Railways', color: '#E85DA8', topicIds: ids('messaging') },
  { id: 'coordination', order: 7, name: 'Distributed Coordination', theme: 'Consensus Peaks', color: '#B9A6F7', topicIds: ids('coordination') },
  { id: 'ops', order: 8, name: 'Microservices & Ops', theme: 'Operations Spaceport', color: '#6FD38B', topicIds: ids('ops') },
  { id: 'security', order: 9, name: 'Security, Storage & Data', theme: 'Vault & Archive', color: '#D9A55B', topicIds: ids('security') },
  { id: 'strategy', order: 10, name: 'Strategy', theme: 'Interview Summit', color: '#F27FA0', topicIds: ids('strategy') },
];
export const bossRegion: Region = { id: 'boss', order: 11, name: 'Boss Arena', theme: 'Architecture Colosseum', color: '#FF4D4D', topicIds: [74, ...bosses.map((b) => b.id)] };
export const allRegions = [...regions, bossRegion];
