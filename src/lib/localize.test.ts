import { describe, expect, it } from 'vitest'
import { localize, overlayProblems, textPaths } from './localize'

const scene = {
  id: 'school',
  title: 'The School',
  intro: 'intro',
  hotspots: [{ id: 'ravi', x: 100, label: 'Talk to Ravi', node: 'ravi-hello' }],
  nodes: {
    'ravi-hello': { id: 'ravi-hello', speaker: 'ravi', text: 'Hi, {name}!', next: 'ravi-2', choices: [{ label: 'Yes', to: 'a', kind: 'good' }] },
  },
  card: { id: 'right-to-education', title: 'The right to go to school', law: 'Article 21A ...', source: 'Constitution of India', review: { note: 'x' } },
  games: [{ kind: 'quiz', id: 'q', questions: [{ id: 'age', text: 'How old?', options: ['6', '14'], answer: 1 }] }],
}

describe('P6 Hindi over English (D-054)', () => {
  it('finds every text by a stable path, and nothing that is wiring, the law or a source', () => {
    expect([...textPaths(scene).keys()]).toEqual([
      'title',
      'hotspots.ravi.label',
      'nodes.ravi-hello.text',
      'nodes.ravi-hello.choices.0.label',
      'card.title',
      'games.q.questions.age.text',
      'games.q.questions.age.options.0',
      'games.q.questions.age.options.1',
    ])
  })

  it('replaces only the texts it is given; ids, links, answers, the law and the source stay English', () => {
    const hi = localize(scene, {
      title: 'स्कूल',
      'nodes.ravi-hello.text': 'नमस्ते, {name}!',
      'games.q.questions.age.options.1': 'चौदह',
      // These are not text, so they are ignored even if someone writes them:
      'card.law': 'बदला हुआ कानून',
      'nodes.ravi-hello.next': 'kahin-aur',
      'hotspots.ravi.node': 'x',
    })
    expect(hi.title).toBe('स्कूल')
    expect(hi.nodes['ravi-hello']?.text).toBe('नमस्ते, {name}!')
    expect(hi.nodes['ravi-hello']?.next).toBe('ravi-2')
    expect(hi.nodes['ravi-hello']?.choices[0]).toEqual({ label: 'Yes', to: 'a', kind: 'good' })
    expect(hi.games[0]?.questions[0]?.options).toEqual(['6', 'चौदह'])
    expect(hi.games[0]?.questions[0]?.answer).toBe(1)
    expect(hi.card.law).toBe('Article 21A ...')
    expect(hi.card.source).toBe('Constitution of India')
    expect(hi.hotspots[0]?.node).toBe('ravi-hello')
    expect(scene.title).toBe('The School') // the English is never changed
  })

  it('without an overlay, it is the English as it is', () => {
    expect(localize(scene, undefined)).toBe(scene)
  })

  it('a field can be text in one file only (the Help Centre intro), when asked for', () => {
    const help = { intro: 'You are not alone.' }
    expect(textPaths(help).size).toBe(0)
    expect(localize(help, { intro: 'तुम अकेले नहीं हो।' }, ['intro']).intro).toBe('तुम अकेले नहीं हो।')
  })

  it('reports paths that are not text, empty words and changed placeholders', () => {
    expect(
      overlayProblems(scene, { 'card.law': 'x', title: ' ', 'nodes.ravi-hello.text': 'नमस्ते!', 'hotspots.ravi.label': 'रवि से बात करो' }),
    ).toEqual([
      '"card.law" is not English text that can be translated',
      '"title" is empty',
      '"nodes.ravi-hello.text" must keep the placeholders name',
    ])
  })
})
