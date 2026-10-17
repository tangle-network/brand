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

/** Prove the packed presentation entry's graph, not the workspace import alias. */
export async function provePresentationPackage(out, published) {
 const [{build},{gzipSync},{resolve,join},{default:assert}]=await Promise.all([import("esbuild"),import("node:zlib"),import("node:path"),import("node:assert/strict")]);
 const packed=await mkdtemp(`${tmpdir()}/brand-ui-proof-`),repo=process.cwd();
 try {
  let integrity;
  if(published){
   assert.match(published.sourceSha??"",/^[a-f0-9]{40}$/, "DESIGN_UI_RELEASE_SHA must pin the released source");
   const response=await fetch(published.registry.dist.tarball);assert.ok(response.ok,`UI tarball response ${response.status}`);
   const bytes=Buffer.from(await response.arrayBuffer());integrity=`sha512-${createHash("sha512").update(bytes).digest("base64")}`;
   assert.equal(integrity,published.registry.dist.integrity);await writeFile(join(packed,"published-ui.tgz"),bytes);
  }else execFileSync("pnpm",["--filter","@tangle-network/ui","pack","--pack-destination",packed],{stdio:"inherit"});
  const tarballs=(await readdir(packed)).filter(name=>name.endsWith(".tgz"));assert.equal(tarballs.length,1);
  const packageRoot=join(packed,"node_modules/@tangle-network/ui");await mkdir(packageRoot,{recursive:true});
  execFileSync("tar",["-xzf",join(packed,tarballs[0]),"-C",packageRoot,"--strip-components=1"]);
  const manifest=JSON.parse(await readFile(join(packageRoot,"package.json"),"utf8"));
  let sources;
  if(published){
   assert.equal(manifest.name,published.registry.name);assert.equal(manifest.version,published.registry.version);
   assert.ok(manifest.exports["./presentation"],"Published UI presentation export missing");
   const releasedManifest=JSON.parse(execFileSync("git",["show",`${published.sourceSha}:packages/ui/package.json`],{encoding:"utf8"}));
   assert.equal(manifest.version,releasedManifest.version,"Published UI version differs from released source");
   assert.deepEqual(manifest.dependencies,releasedManifest.dependencies,"Published UI dependency declarations differ from released source");
   sources=["src/presentation.ts","src/lib/surface-motion.tsx","src/lib/motion.ts","src/primitives/button.tsx","src/primitives/popover.tsx","src/primitives/tooltip.tsx","src/styles/presentation.css","src/styles/compat.css",
    ...(manifest.exports["./code-presentation"]?["src/code-presentation.ts","src/lib/code-presentation.ts","src/markdown/code-block.tsx","src/markdown/api-schema.tsx"]:[])];
   for(const path of sources)assert.deepEqual(await readFile(join(packageRoot,path)),execFileSync("git",["show",`${published.sourceSha}:packages/ui/${path}`]),`Published UI source differs: ${path}`);
  }
  const nodePaths=[resolve("packages/ui/node_modules"),resolve("node_modules")],entries=[];
  const forbidden=/\/node_modules\/(?:react(?:-dom)?|@radix-ui\/react[^/]*|framer-motion|motion(?:-dom|-utils)?)\//;
  const graphPath=path=>path.includes("node_modules/")?path.slice(path.indexOf("node_modules/")):path.replace(packed,"packed-consumer").replace(repo,"workspace");
  for(const entry of ["presentation",...(manifest.exports["./code-presentation"]?["code-presentation"]:[])]) {
   const input=join(packed,`${entry}-entry.mjs`);await writeFile(input,`export * from "@tangle-network/ui/${entry}";`);
   const bundle=await build({entryPoints:[input],bundle:true,write:false,metafile:true,minify:true,platform:"node",format:"esm",nodePaths,treeShaking:true,logLevel:"silent"});
   const inputs=Object.keys(bundle.metafile.inputs);assert.ok(!inputs.some(path=>forbidden.test(`/${path}`)),`React/motion entered pure ${entry} graph`);
   const file=join(packed,`${entry}.mjs`);await writeFile(file,bundle.outputFiles[0].contents);
   const smoke=execFileSync(process.execPath,["--input-type=module","-e",`
    import assert from "node:assert/strict";
    assert.throws(()=>import.meta.resolve("react"),{code:"ERR_MODULE_NOT_FOUND"});
    const api=await import(${JSON.stringify(file)});
    ${entry==="presentation"?'assert.equal(typeof api.bindDialog,"function");assert.ok(api.buttonVariants({variant:"outline",size:"lg"}).includes("inline-flex"));assert.ok(api.inputVariants().includes("w-full"));assert.ok(api.tablePresentation.cell);':'assert.equal(typeof api.createCopyFeedback,"function");assert.equal((await api.highlightCode("line\\n","text")).length,2);'}
    console.log(${JSON.stringify(`Packed ${entry} bundle imports with React unavailable`)});
   `],{cwd:packed,encoding:"utf8"}).trim();
   await readFile(join(packageRoot,manifest.exports[`./${entry}`].types));
   entries.push({entry,bytes:bundle.outputFiles[0].contents.length,gzipBytes:gzipSync(bundle.outputFiles[0].contents).length,inputs:inputs.map(graphPath),smoke});
  }
  const surface=join(packed,"surface-entry.mjs");await writeFile(surface,'export {DialogContent,SheetContent,TooltipContent} from "@tangle-network/ui/primitives";');
  const bundle=await build({entryPoints:[surface],bundle:true,write:false,metafile:true,minify:true,platform:"browser",format:"esm",nodePaths,treeShaking:true,logLevel:"silent"});
  const motion=/\/node_modules\/(?:motion(?:-dom|-utils)?|framer-motion)\//;
  const motionBytes=Object.values(bundle.metafile.outputs).flatMap(output=>Object.entries(output.inputs)).filter(([path])=>motion.test(`/${path}`)).reduce((sum,[,input])=>sum+input.bytesInOutput,0);
  assert.ok(motionBytes>0,"Surface bundle did not include the motion adapter runtime");
  for(const asset of ["./styles/presentation.css","./styles/compat.css"])assert.ok((await readFile(join(packageRoot,manifest.exports[asset]))).length);
  const receipt={sha:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),at:new Date().toISOString(),name:manifest.name,version:manifest.version,tarball:tarballs[0],dependencySource:"frozen workspace graph; actual packed exports bundled by esbuild",published:!!published,motionDependency:manifest.dependencies.motion,integrity,sourceSha:published?.sourceSha,sources,registryGitHead:published?.registry.gitHead??null,entries,surfaces:{bytes:bundle.outputFiles[0].contents.length,gzipBytes:gzipSync(bundle.outputFiles[0].contents).length,motionBytes,meaning:"Motion-attributed minified bytes; not a before/after gzip delta"}};
  await writeFile(join(out,tarballs[0]),await readFile(join(packed,tarballs[0])));await writeFile(join(out,"presentation-package.json"),JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
  return receipt;
 } finally {await rm(packed,{recursive:true,force:true});}
}
