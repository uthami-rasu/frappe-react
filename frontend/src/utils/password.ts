// Client-side guidance only. Frappe enforces the real rules when the password is saved
// (minimum length in bossco/account.py, plus the System Settings password policy).

export const MIN_PASSWORD_LENGTH = 8

export type PasswordCheck = { score: 0 | 1 | 2 | 3 | 4; label: string; problems: string[]; acceptable: boolean }

const LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong']
const COMMON = ['password', '123456', 'qwerty', 'letmein', 'welcome', 'iloveyou', 'admin', 'abc123', '111111']

export function checkPassword(password: string, personal: string[] = []): PasswordCheck {
  const problems: string[] = []
  if (password.length < MIN_PASSWORD_LENGTH) problems.push(`Use at least ${MIN_PASSWORD_LENGTH} characters`)

  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(password)).length
  if (password.length && kinds < 2) problems.push('Mix letters with numbers or symbols')

  const lower = password.toLowerCase()
  if (COMMON.some((word) => lower.includes(word))) problems.push('Avoid common passwords')
  const personalParts = personal
    .flatMap((value) => value.toLowerCase().split(/[@.\s_-]+/))
    .filter((part) => part.length >= 3)
  if (personalParts.some((part) => lower.includes(part))) problems.push("Don't include your name or email")
  if (/(.)\1{3,}/.test(password)) problems.push('Avoid repeated characters')

  let score = 0
  if (password.length >= MIN_PASSWORD_LENGTH) score += 1
  if (password.length >= 12) score += 1
  if (kinds >= 3) score += 1
  if (kinds === 4 || password.length >= 16) score += 1
  if (problems.length) score = Math.min(score, 1)
  const clamped = Math.max(0, Math.min(4, score)) as PasswordCheck['score']
  return { score: clamped, label: LABELS[clamped], problems, acceptable: problems.length === 0 }
}

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
