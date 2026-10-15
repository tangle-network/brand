import { mkdir, writeFile, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";

// Unpack the actual tarball outside the workspace dependency tree.
export async function proveKnotPackage(out) {
 const packed = await mkdtemp(`${tmpdir()}/brand-knot-proof-`);
 try {
  execFileSync("pnpm",["--filter","@tangle-network/brand","pack","--pack-destination",packed],{stdio:"inherit"});
  const tarballs=(await readdir(packed)).filter(name=>name.endsWith(".tgz"));
  if(tarballs.length!==1)throw Error("Expected one Brand tarball");
  const packageRoot=`${packed}/node_modules/@tangle-network/brand`;
  await mkdir(packageRoot,{recursive:true});
  execFileSync("tar",["-xzf",`${packed}/${tarballs[0]}`,"-C",packageRoot,"--strip-components=1"]);
  const smoke=execFileSync(process.execPath,["--input-type=module","-e",`
   import assert from "node:assert/strict";
   import {knot,knotSvg} from "@tangle-network/brand/knot";
   assert.throws(()=>import.meta.resolve("react"),{code:"ERR_MODULE_NOT_FOUND"});
   assert.ok(knot.paths.length>0);
   assert.ok(knotSvg({id:"packed-proof"}).includes(knot.paths[0].d));
   console.log("packed knot import passes without React");
  `],{cwd:packed,encoding:"utf8"}).trim();
  const manifest=JSON.parse(await readFile(`${packageRoot}/package.json`,"utf8"));
  await writeFile(`${out}/${tarballs[0]}`,await readFile(`${packed}/${tarballs[0]}`));
  await writeFile(`${out}/package.json`,JSON.stringify({sha:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),at:new Date().toISOString(),name:manifest.name,version:manifest.version,tarball:tarballs[0],smoke},null,2));
  console.log(smoke);
 } finally {await rm(packed,{recursive:true,force:true});}
}
