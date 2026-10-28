// Pending changesets ship as patch unless they declare a major: on 1.x an addition is a patch
// (agent-runtime docs/release-versioning.md), and publication refuses a minor.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
for (const name of readdirSync('.changeset').filter((file) => file.endsWith('.md') && file !== 'README.md')) {
  const path = `.changeset/${name}`
  writeFileSync(path, readFileSync(path, 'utf8').replace(/^(\S.*?):\s*minor\s*$/gm, '$1: patch'))
}
