import { mkdir, writeFile, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";

// Resolve from the extracted package outside the workspace dependency tree.
async function inspectKnotTarball(packed, tarball) {
 const packageRoot=`${packed}/node_modules/@tangle-network/brand`;
 await mkdir(packageRoot,{recursive:true});
 execFileSync("tar",["-xzf",`${packed}/${tarball}`,"-C",packageRoot,"--strip-components=1"]);
 const smoke=execFileSync(process.execPath,["--input-type=module","-e",`
  import assert from "node:assert/strict";
  import {knot,knotSvg} from "@tangle-network/brand/knot";
  assert.throws(()=>import.meta.resolve("react"),{code:"ERR_MODULE_NOT_FOUND"});
  assert.ok(knot.paths.length>0);
  assert.ok(knotSvg({id:"packed-proof"}).includes(knot.paths[0].d));
  console.log("packed knot import passes without React");
 `],{cwd:packed,encoding:"utf8"}).trim();
 const manifest=JSON.parse(await readFile(`${packageRoot}/package.json`,"utf8"));
 return {packageRoot,manifest,smoke};
}

export async function proveKnotPackage(out) {
 const packed=await mkdtemp(`${tmpdir()}/brand-knot-proof-`);
 try {
  execFileSync("pnpm",["--filter","@tangle-network/brand","pack","--pack-destination",packed],{stdio:"inherit"});
  const tarballs=(await readdir(packed)).filter(name=>name.endsWith(".tgz"));
  assert.equal(tarballs.length,1);
  const {manifest,smoke}=await inspectKnotTarball(packed,tarballs[0]);
  await writeFile(`${out}/${tarballs[0]}`,await readFile(`${packed}/${tarballs[0]}`));
  await writeFile(`${out}/package.json`,JSON.stringify({sha:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),at:new Date().toISOString(),name:manifest.name,version:manifest.version,tarball:tarballs[0],smoke},null,2));
  console.log(smoke);
 } finally {await rm(packed,{recursive:true,force:true});}
}

export async function provePublishedKnot(out, registry, sourceSha) {
 assert.match(sourceSha ?? "",/^[a-f0-9]{40}$/, "DESIGN_RELEASE_SHA must pin the released source");
 const packed=await mkdtemp(`${tmpdir()}/brand-published-proof-`);
 try {
  const response=await fetch(registry.dist.tarball);
  assert.ok(response.ok,`Tarball response ${response.status}`);
  const bytes=Buffer.from(await response.arrayBuffer());
  const integrity=`sha512-${createHash("sha512").update(bytes).digest("base64")}`;
  assert.equal(integrity,registry.dist.integrity);
  const tarball="published-brand.tgz";
  await writeFile(`${packed}/${tarball}`,bytes);
  const {packageRoot,manifest,smoke}=await inspectKnotTarball(packed,tarball);
  assert.equal(manifest.name,registry.name);assert.equal(manifest.version,registry.version);
  const sources=["src/knot.ts","src/logo.tsx","src/styles/presentation.css","src/styles/tokens.css","src/styles/index.css","src/styles/legacy-light.css"];
  for(const path of sources) {
   const expected=execFileSync("git",["show",`${sourceSha}:packages/brand/${path}`]);
   assert.deepEqual(await readFile(`${packageRoot}/${path}`),expected,`Released source differs: ${path}`);
  }
  const tokens=await readFile(`${packageRoot}/src/styles/tokens.css`,"utf8");
  const roles=["--interaction-feedback-budget","--interaction-pending-delay","--interaction-long-work-delay","--interaction-mutation-budget","--motion-control","--motion-surface","--motion-dismiss","--motion-stream","--motion-arrive"];
  for(const role of roles)assert.ok(tokens.includes(`${role}:`),`Missing role ${role}`);
  const receipt={at:new Date().toISOString(),name:manifest.name,version:manifest.version,integrity,tarballUrl:registry.dist.tarball,sourceSha,registryGitHead:registry.gitHead ?? null,sources,roles,smoke};
  await writeFile(`${out}/${tarball}`,bytes);
  await writeFile(`${out}/published-knot.json`,JSON.stringify(receipt,null,2));
  console.log(JSON.stringify(receipt));return receipt;
 } finally {await rm(packed,{recursive:true,force:true});}
}
