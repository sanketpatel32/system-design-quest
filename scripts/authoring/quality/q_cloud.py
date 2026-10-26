"""Quality pass, Cloud: two definition questions become team and incident scenarios. Applied by apply.py."""

P = {
 323: {
  'q': {
   't323-a1': {'prompt': 'Team A’s passing builds wait for a release manager to click Deploy. Team B’s go to production automatically behind canaries. Which practice is each following?',
    'choices': [('a', 'A: continuous delivery; B: continuous deployment'), ('b', 'A: continuous deployment; B: continuous delivery'), ('c', 'A: continuous integration only; B: delivery'), ('d', 'Both continuous deployment, with other gates')],
    'correct': 'a',
    'explanation': 'Both keep main releasable; the difference is the manual approval before production. Team A has it (continuous delivery) and team B removed it (continuous deployment). A team that merges and tests but cannot release on demand is doing integration only, and a human click is exactly what continuous deployment removes.'},
  },
 },
 327: {
  'q': {
   't327-a2': {'prompt': 'During a payments outage, the incident commander starts logging into servers to try fixes. Why is that a problem?',
    'choices': [('a', 'Commanders lack production access by policy'), ('b', 'Nobody is coordinating or deciding meanwhile'), ('c', 'Fixes are allowed only after the postmortem'), ('d', 'Customers must be told before any change')],
    'correct': 'b',
    'explanation': 'The commander’s job is to coordinate people, hold the overall picture and make calls such as “roll back now”; with hands on the keyboard they lose that view and nobody is steering. Access policies vary, fixes do not wait for the postmortem, and customer updates run in parallel through the communications lead.'},
  },
 },
}
