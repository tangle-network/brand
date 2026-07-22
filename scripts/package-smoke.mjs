import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
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

  const invalidOptionalPeers = Object.keys(manifest.peerDependenciesMeta ?? {}).filter(
    (name) => !manifest.peerDependencies?.[name],
  );
  if (invalidOptionalPeers.length > 0) {
    throw new Error(
      `optional peer metadata is missing peer declarations: ${invalidOptionalPeers.join(", ")}`,
    );
  }

  const optionalPeers = Object.entries(manifest.peerDependenciesMeta ?? {})
    .filter(([, metadata]) => metadata?.optional === true)
    .map(([name]) => {
      const version = manifest.devDependencies?.[name] ?? manifest.peerDependencies[name];
      return `${name}@${version}`;
    });

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
      ...optionalPeers,
    ],
    { cwd: consumerDirectory, stdio: "inherit" },
  );

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

  await build({
    root: consumerDirectory,
    logLevel: "error",
    build: {
      emptyOutDir: true,
      outDir: join(consumerDirectory, "dist"),
    },
  });

  console.log(
    `Packed ${manifest.name}@${manifest.version} passed a clean consumer build across ${specifiers.length} JS exports`,
  );
} finally {
  rmSync(workDirectory, { force: true, recursive: true });
}
