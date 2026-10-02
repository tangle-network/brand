import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'

it('keeps the generated light-default contract and all canonical mutations checked', () => {
  const output = execFileSync(process.execPath, [
    '--test',
    resolve(process.cwd(), 'packages/brand/scripts/gen-compat.test.mjs'),
  ], { encoding: 'utf8' })
  expect(output).toContain('fail 0')
})
