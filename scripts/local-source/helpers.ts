import type { Question, Topic, RegionId, UnitKey } from './types';

type Mcq = [string, string[], number, string];
export const M = (prompt: string, options: string[], answers: number[], explanation: string) => ({ type: 'multi' as const, prompt, options, answers, explanation });
export const O = (prompt: string, items: string[], explanation: string) => ({ type: 'order' as const, prompt, items, explanation });
export const X = (prompt: string, pairs: [string, string][], explanation: string) => ({ type: 'match' as const, prompt, pairs, explanation });
export const E = (prompt: string, answer: number, unit: UnitKey, tolerance: number, explanation: string, acceptAlso?: number[]) => ({ type: 'estimate' as const, prompt, answer, unit, tolerance, explanation, acceptAlso });
type Q2 = ReturnType<typeof M> | ReturnType<typeof O> | ReturnType<typeof X> | ReturnType<typeof E>;

export function T(region: RegionId) {
  return (id: number, title: string, summary: string, concept: string, example: string, pitfall: string, flow: string[], mcq: Mcq, q2: Q2, flash: [string, string][]): Topic => {
    const questions: Question[] = [
      { id: `${id}-q1`, type: 'mcq', prompt: mcq[0], options: mcq[1], answer: mcq[2], explanation: mcq[3] },
      { id: `${id}-q2`, ...q2 } as Question,
    ];
    return {
      id, region, title, summary,
      cards: [
        { kind: 'concept', title: 'The core idea', body: concept },
        { kind: 'visual', title: 'See it flow', body: 'Step through how a request moves.', visual: flow },
        { kind: 'example', title: 'In the Indian market', body: example },
        { kind: 'pitfall', title: 'Interview trap', body: pitfall },
      ],
      questions,
      flashcards: flash.map(([front, back], i) => ({ id: `${id}-f${i}`, front, back })),
      cheat: [summary, pitfall],
    };
  };
}
