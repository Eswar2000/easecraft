import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const npmRegistry = "https://registry.npmjs.org";
const packageDirectories = ["packages/tokens", "packages/react", "packages/registry"];
const workspaceRoot = fileURLToPath(new URL("..", import.meta.url));
const dryRun = process.argv.includes("--dry-run");
const runningInGitHubActions = process.env.GITHUB_ACTIONS === "true";

if (process.argv.slice(2).some((argument) => argument !== "--dry-run")) {
  throw new Error("Usage: node scripts/publish-packages.mjs [--dry-run]");
}

async function readPackage(packageDirectory) {
  const packageJsonUrl = new URL(`../${packageDirectory}/package.json`, import.meta.url);
  const packageJson = JSON.parse(await readFile(packageJsonUrl, "utf8"));

  if (typeof packageJson.name !== "string" || typeof packageJson.version !== "string") {
    throw new Error(`${packageDirectory}/package.json must declare a name and version`);
  }

  if (packageJson.private) {
    throw new Error(`${packageJson.name} is private and cannot be published`);
  }

  return {
    directory: fileURLToPath(new URL(`../${packageDirectory}`, import.meta.url)),
    name: packageJson.name,
    version: packageJson.version,
  };
}

async function isPublished({ name, version }) {
  const packageUrl = new URL(
    `${encodeURIComponent(name)}/${encodeURIComponent(version)}`,
    `${npmRegistry}/`,
  );
  const response = await fetch(packageUrl, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });

  if (response.ok) {
    return true;
  }

  if (response.status === 404) {
    return false;
  }

  throw new Error(
    `Unable to check ${name}@${version} on npm: ${response.status} ${response.statusText}`,
  );
}

function runNpmPublish(packageDirectory) {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

  return new Promise((resolve, reject) => {
    const child = spawn(
      npmCommand,
      ["publish", packageDirectory, "--access", "public", "--registry", npmRegistry],
      {
        cwd: workspaceRoot,
        env: process.env,
        stdio: "inherit",
      },
    );

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          signal
            ? `npm publish was terminated by ${signal}`
            : `npm publish exited with code ${code ?? "unknown"}`,
        ),
      );
    });
  });
}

for (const packageDirectory of packageDirectories) {
  const packageInfo = await readPackage(packageDirectory);
  const packageId = `${packageInfo.name}@${packageInfo.version}`;

  if (await isPublished(packageInfo)) {
    console.log(`Already published: ${packageId}`);
    continue;
  }

  if (dryRun) {
    console.log(`Would publish: ${packageId}`);
    continue;
  }

  if (
    runningInGitHubActions &&
    (!process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN || !process.env.ACTIONS_ID_TOKEN_REQUEST_URL)
  ) {
    throw new Error("GitHub Actions must grant id-token: write before publishing");
  }

  console.log(`Publishing: ${packageId}`);
  await runNpmPublish(packageInfo.directory);
  console.log(runningInGitHubActions ? `New tag: ${packageId}` : `Published: ${packageId}`);
}
