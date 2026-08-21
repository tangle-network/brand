import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { build as esbuildBuild } from "esbuild";
import { build } from "vite";

const root = resolve(import.meta.dirname, "..");
const packageArgument = process.argv[2];
if (!packageArgument) {
  throw new Error("Usage: node scripts/package-smoke.mjs <package-directory>");
}

const packageDirectory = resolve(root, packageArgument);
const sourceManifest = JSON.parse(
  readFileSync(join(packageDirectory, "package.json"), "utf8"),
);
const workDirectory = mkdtempSync(join(tmpdir(), "tangle-package-smoke-"));
const packDirectory = join(workDirectory, "pack");
const consumerDirectory = join(workDirectory, "consumer");

function packedManifest(tarballPath) {
  return JSON.parse(
    execFileSync("tar", ["-xOf", tarballPath, "package/package.json"], {
      encoding: "utf8",
    }),
  );
}

function exportTarget(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof value.import === "string") {
    return value.import;
  }
  return undefined;
}

function packageSpecifier(packageName, subpath) {
  return subpath === "." ? packageName : `${packageName}/${subpath.slice(2)}`;
}

// Map every package in this pnpm workspace (name → directory) by scanning the
// packages globs in pnpm-workspace.yaml. Only "<dir>/*" style globs are
// understood, which covers this repo's layout.
function workspacePackageDirectories() {
  const directories = new Map();
  const workspaceFile = join(root, "pnpm-workspace.yaml");
  if (!existsSync(workspaceFile)) return directories;
  const parents = [];
  let inPackages = false;
  for (const line of readFileSync(workspaceFile, "utf8").split("\n")) {
    if (/^packages:/.test(line)) {
      inPackages = true;
      continue;
    }
    if (!inPackages) continue;
    const entry = line.match(/^\s+-\s*["']?([^"'\s]+)["']?\s*$/);
    if (entry) {
      parents.push(entry[1].replace(/\/\*.*$/, ""));
    } else if (line.trim() !== "") {
      break;
    }
  }
  for (const parent of parents) {
    const parentDirectory = resolve(root, parent);
    if (!existsSync(parentDirectory)) continue;
    for (const child of readdirSync(parentDirectory, { withFileTypes: true })) {
      if (!child.isDirectory()) continue;
      const manifestPath = join(parentDirectory, child.name, "package.json");
      if (!existsSync(manifestPath)) continue;
      const name = JSON.parse(readFileSync(manifestPath, "utf8")).name;
      if (typeof name === "string") {
        directories.set(name, join(parentDirectory, child.name));
      }
    }
  }
  return directories;
}

function packWorkspacePackage(workspacePackageDirectory) {
  const path = execFileSync(
    "pnpm",
    ["pack", "--pack-destination", packDirectory],
    { cwd: workspacePackageDirectory, encoding: "utf8" },
  )
    .trim()
    .split("\n")
    .at(-1);
  if (!path || !existsSync(path) || !path.endsWith(".tgz")) {
    throw new Error(
      `workspace peer tarball is missing: ${path ?? "no path returned"}`,
    );
  }
  return path;
}

try {
  mkdirSync(join(consumerDirectory, "src"), { recursive: true });
  mkdirSync(packDirectory, { recursive: true });

  const tarballPath = process.env.PACKAGE_TARBALL
    ? resolve(process.env.PACKAGE_TARBALL)
    : execFileSync("pnpm", ["pack", "--pack-destination", packDirectory], {
        cwd: packageDirectory,
        encoding: "utf8",
      })
        .trim()
        .split("\n")
        .at(-1);
  if (!tarballPath || !existsSync(tarballPath) || !tarballPath.endsWith(".tgz")) {
    throw new Error(`package tarball is missing: ${tarballPath ?? "no path returned"}`);
  }

  const manifest = packedManifest(tarballPath);
  if (manifest.name !== sourceManifest.name || typeof manifest.version !== "string") {
    throw new Error(`unexpected packed manifest in ${basename(tarballPath)}`);
  }

  const peerOverrides = JSON.parse(process.env.PACKAGE_PEER_OVERRIDES ?? "{}");
  if (!peerOverrides || typeof peerOverrides !== "object" || Array.isArray(peerOverrides)) {
    throw new Error("PACKAGE_PEER_OVERRIDES must be a JSON object");
  }
  const invalidPeerOverrides = Object.entries(peerOverrides).filter(
    ([name, version]) => !manifest.peerDependencies?.[name] || typeof version !== "string",
  );
  if (invalidPeerOverrides.length > 0) {
    throw new Error(
      `invalid peer overrides: ${invalidPeerOverrides.map(([name]) => name).join(", ")}`,
    );
  }

  const declaredOptionalPeers = Object.entries(manifest.peerDependenciesMeta ?? {})
    .filter(([, metadata]) => metadata?.optional === true)
    .map(([name]) => name);

  // The peers to leave uninstalled. An optional peer only earns the name when
  // a consumer without it still builds, so this run proves the promise the
  // manifest makes. The package reaches such a peer through a dynamic
  // import(), which a bundler resolves to a stub it never evaluates.
  const omittedOptionalPeers = JSON.parse(process.env.PACKAGE_OMIT_OPTIONAL_PEERS ?? "[]");
  if (
    !Array.isArray(omittedOptionalPeers) ||
    omittedOptionalPeers.some((name) => typeof name !== "string")
  ) {
    throw new Error("PACKAGE_OMIT_OPTIONAL_PEERS must be a JSON array of package names");
  }
  const notOptionalOmissions = omittedOptionalPeers.filter(
    (name) => !declaredOptionalPeers.includes(name),
  );
  if (notOptionalOmissions.length > 0) {
    throw new Error(
      `cannot omit peers that the packed manifest does not declare optional: ${notOptionalOmissions.join(", ")}`,
    );
  }
  const contradictedOmissions = omittedOptionalPeers.filter(
    (name) => peerOverrides[name] !== undefined,
  );
  if (contradictedOmissions.length > 0) {
    throw new Error(
      `a peer cannot be both omitted and overridden: ${contradictedOmissions.join(", ")}`,
    );
  }

  const invalidOptionalPeers = Object.keys(manifest.peerDependenciesMeta ?? {}).filter(
    (name) => !manifest.peerDependencies?.[name],
  );
  if (invalidOptionalPeers.length > 0) {
    throw new Error(
      `optional peer metadata is missing peer declarations: ${invalidOptionalPeers.join(", ")}`,
    );
  }

  const workspacePackages = workspacePackageDirectories();
  const workspacePeerTarballs = new Map();
  // A peer that is another package in this workspace must be installed from a
  // local tarball, never from the registry. The release PR bumps versions
  // before publish, so the repo version does not exist on npm yet — asking
  // npm for it fails with ETARGET, which fails this validation, which blocks
  // the publish that would put the version on npm: a chicken-and-egg deadlock
  // on every release. Packing the workspace package and installing the
  // tarball breaks the cycle. Requires `pnpm build` to have run first (the
  // release workflow builds before test:package) so the tarball contains
  // dist/. Prefer the tarball even when npm already carries the repo version,
  // so the smoke test always exercises the exact code being released.
  function workspacePeerTarball(name) {
    if (!workspacePeerTarballs.has(name)) {
      workspacePeerTarballs.set(
        name,
        packWorkspacePackage(workspacePackages.get(name)),
      );
    }
    return workspacePeerTarballs.get(name);
  }

  const optionalPeers = declaredOptionalPeers
    .filter((name) => !omittedOptionalPeers.includes(name))
    .map((name) => {
      // An explicit override always wins over the workspace tarball.
      if (peerOverrides[name] !== undefined) {
        return `${name}@${peerOverrides[name]}`;
      }
      if (workspacePackages.has(name)) return workspacePeerTarball(name);
      const version =
        manifest.devDependencies?.[name] ?? manifest.peerDependencies[name];
      return `${name}@${version}`;
    });

  // Required peers are not in the list above — npm auto-installs them from
  // the registry using the packed manifest's range, which hits the same
  // ETARGET deadlock for workspace packages. Install their tarballs
  // explicitly so npm satisfies the peer from disk instead.
  const requiredWorkspacePeerTarballs = Object.keys(manifest.peerDependencies ?? {})
    .filter(
      (name) =>
        manifest.peerDependenciesMeta?.[name]?.optional !== true &&
        workspacePackages.has(name),
    )
    .map((name) => workspacePeerTarball(name));

  writeFileSync(
    join(consumerDirectory, "package.json"),
    JSON.stringify({ name: "tangle-ui-clean-consumer", private: true, type: "module" }),
  );
  writeFileSync(
    join(consumerDirectory, "index.html"),
    '<main id="root"></main><script type="module" src="/src/main.js"></script>',
  );

  execFileSync(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      tarballPath,
      "react@19",
      "react-dom@19",
      ...requiredWorkspacePeerTarballs,
      ...optionalPeers,
    ],
    { cwd: consumerDirectory, stdio: "inherit" },
  );

  // Smoke the gauge: a peer that npm still installs through another
  // dependency would make this run a false green.
  const leakedOmissions = omittedOptionalPeers.filter((name) =>
    existsSync(join(consumerDirectory, "node_modules", ...name.split("/"))),
  );
  if (leakedOmissions.length > 0) {
    throw new Error(
      `omitted optional peers reached the consumer anyway: ${leakedOmissions.join(", ")}`,
    );
  }

  const installedDirectory = join(
    consumerDirectory,
    "node_modules",
    ...manifest.name.split("/"),
  );
  const installedManifest = JSON.parse(
    readFileSync(join(installedDirectory, "package.json"), "utf8"),
  );
  if (installedManifest.version !== manifest.version) {
    throw new Error(
      `installed ${installedManifest.version}, expected packed version ${manifest.version}`,
    );
  }

  for (const [subpath, value] of Object.entries(manifest.exports ?? {})) {
    const targets = typeof value === "string" ? [value] : Object.values(value);
    for (const target of targets) {
      if (typeof target === "string" && !existsSync(resolve(installedDirectory, target))) {
        throw new Error(`packed export ${subpath} points to missing file ${target}`);
      }
    }
  }

  const specifiers = Object.entries(manifest.exports ?? {})
    .filter(([, value]) => exportTarget(value)?.endsWith(".js"))
    .map(([subpath]) => packageSpecifier(manifest.name, subpath));
  const imports = specifiers.map(
    (specifier, index) => `import * as publicEntry${index} from ${JSON.stringify(specifier)};`,
  );
  const entries = specifiers.map((_, index) => `publicEntry${index}`).join(", ");
  writeFileSync(
    join(consumerDirectory, "src/main.js"),
    `${imports.join("\n")}
console.log([${entries}].map((entry) => Object.keys(entry).length));
`,
  );

  const consumerDistDirectory = join(consumerDirectory, "dist");
  await build({
    root: consumerDirectory,
    logLevel: "error",
    build: {
      emptyOutDir: true,
      outDir: consumerDistDirectory,
    },
  });

  // A dynamic import of an uninstalled optional peer builds green: the peer
  // becomes its own chunk that throws when it loads. That is the wanted
  // behaviour, and it also means a green build no longer proves that an
  // INSTALLED peer resolved. Read the emitted chunks and say which peers the
  // bundle stubbed.
  //
  // The text below is Vite's own wording for that stub, verified against Vite
  // 8.1.5. A Vite upgrade that rewords it must update this marker: the
  // `stubbedPeers.size === 0` guard further down turns a stale marker into a
  // failing run rather than a silent pass, and the omit-every-peer run in
  // `test:package` reaches that guard on every CI run.
  const stubMarker = (name) => `Could not resolve "${name}"`;
  const stubbedPeers = new Set();
  for (const entry of readdirSync(consumerDistDirectory, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (!entry.isFile() || !entry.name.endsWith(".js")) continue;
    const code = readFileSync(join(entry.parentPath, entry.name), "utf8");
    for (const name of declaredOptionalPeers) {
      if (code.includes(stubMarker(name))) stubbedPeers.add(name);
    }
  }

  const unresolvedInstalledPeers = declaredOptionalPeers.filter(
    (name) => !omittedOptionalPeers.includes(name) && stubbedPeers.has(name),
  );
  if (unresolvedInstalledPeers.length > 0) {
    throw new Error(
      `installed optional peers did not resolve in the consumer: ${unresolvedInstalledPeers.join(", ")}`,
    );
  }

  // Not every omitted peer leaves a stub — a peer the package reaches only
  // through types never reaches the bundle at all. One stub is enough to
  // prove the run exercised the uninstalled path, and it pins the marker
  // string that the check above reads.
  if (omittedOptionalPeers.length > 0 && stubbedPeers.size === 0) {
    throw new Error(
      `no omitted optional peer was stubbed; either the build never reached ` +
        `${omittedOptionalPeers.join(", ")}, or Vite reworded the stub this script reads`,
    );
  }

  // Vite and Rollup leave an unresolved literal `import()` to run time on
  // their own. esbuild does so only when the call carries a `.catch()`, and
  // reports a build error otherwise, so a consumer that installs no peers
  // needs its own bundle to prove the promise the README makes. Building the
  // same entry a second time is what catches a dropped handler end to end.
  await esbuildBuild({
    entryPoints: [join(consumerDirectory, "src/main.js")],
    bundle: true,
    format: "esm",
    platform: "browser",
    outfile: join(consumerDirectory, "dist-esbuild/out.js"),
    logLevel: "error",
    absWorkingDir: consumerDirectory,
  });

  const omissionNote =
    omittedOptionalPeers.length > 0
      ? ` without ${omittedOptionalPeers.join(", ")}`
      : "";
  console.log(
    `Packed ${manifest.name}@${manifest.version} passed a clean Vite and esbuild consumer build ` +
      `across ${specifiers.length} JS exports${omissionNote}`,
  );
} finally {
  rmSync(workDirectory, { force: true, recursive: true });
}
