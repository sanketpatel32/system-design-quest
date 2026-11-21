import '@testing-library/jest-dom/vitest'
import { initCatalog } from '../content/catalog'

// Vitest awaits setup files before importing each test module; several tests read
// allTopics/numbering at describe/module level, so the catalog must land here.
await initCatalog()
