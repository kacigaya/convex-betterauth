const pagePaths = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/email-verified",
] as const;
const sessionPath = "/api/auth/get-session";

type Fetch = typeof fetch;

export function parseDeploymentOrigin(value: string | undefined) {
  if (!value) {
    throw new Error(
      "Usage: bun run verify:deployment -- https://app.example.com",
    );
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Deployment origin must be a valid HTTPS URL.");
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "Deployment origin must be a bare HTTPS origin without credentials, a path, query, or fragment.",
    );
  }

  return url.origin;
}

async function get(
  origin: string,
  path: string,
  accept: string,
  fetchImpl: Fetch,
  timeoutMs: number,
) {
  const response = await fetchImpl(new URL(path, origin), {
    method: "GET",
    headers: { Accept: accept },
    credentials: "omit",
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (response.status !== 200) {
    if (response.body) {
      await response.body.cancel().catch(() => {});
    }
    throw new Error(`${path} returned HTTP ${response.status}.`);
  }

  return response;
}

export async function verifyDeployment(
  origin: string,
  options: {
    fetchImpl?: Fetch;
    timeoutMs?: number;
    log?: (message: string) => void;
  } = {},
) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const log = options.log ?? console.log;

  for (const path of pagePaths) {
    await get(origin, path, "text/html", fetchImpl, timeoutMs);
    log(`PASS ${path}`);
  }

  const sessionResponse = await get(
    origin,
    sessionPath,
    "application/json",
    fetchImpl,
    timeoutMs,
  );
  let session: unknown;
  try {
    session = await sessionResponse.json();
  } catch {
    throw new Error(`${sessionPath} returned invalid JSON.`);
  }
  if (session !== null) {
    throw new Error(`${sessionPath} returned an authenticated session.`);
  }
  log(`PASS ${sessionPath} (anonymous)`);
}

if (import.meta.main) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 1) {
      throw new Error(
        "Usage: bun run verify:deployment -- https://app.example.com",
      );
    }

    const origin = parseDeploymentOrigin(args[0]);
    await verifyDeployment(origin);
    console.log(`Deployment smoke checks passed for ${origin}.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Smoke check failed.");
    process.exitCode = 1;
  }
}
