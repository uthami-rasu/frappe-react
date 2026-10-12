import { describe, expect, it } from 'vitest'
import { checkPassword, isValidEmail } from '../utils/password'

describe('checkPassword', () => {
  it('rejects short, single-kind, common and personal passwords', () => {
    expect(checkPassword('abc12').acceptable).toBe(false)
    expect(checkPassword('abcdefghij').acceptable).toBe(false)
    expect(checkPassword('Password123!').acceptable).toBe(false)
    expect(checkPassword('Priya2026!x', ['priya@example.com']).acceptable).toBe(false)
  })

  it('accepts and scores strong passwords', () => {
    const result = checkPassword('Tide-river-91-lamp')
    expect(result.acceptable).toBe(true)
    expect(result.score).toBeGreaterThanOrEqual(3)
  })
})

describe('isValidEmail', () => {
  it('validates the basic shape', () => {
    expect(isValidEmail('a@b.co')).toBe(true)
    expect(isValidEmail('a@b')).toBe(false)
    expect(isValidEmail('a b@c.com')).toBe(false)
  })
})
