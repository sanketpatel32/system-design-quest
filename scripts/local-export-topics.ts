import { topics, bosses } from './local-source/index.ts'

const learning = topics.filter((t) => t.id < 74 || t.id > 114)
console.log(JSON.stringify({ learning, bosses }))
