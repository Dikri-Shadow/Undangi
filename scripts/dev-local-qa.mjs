import { execSync, spawn } from "node:child_process";

const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
if (process.platform === "win32") {
  const dockerDir = "C:\\Users\\USER\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin";
  process.env.Path = `${dockerDir};${process.env.Path || ""}`;
}
const output = execSync(`${npxCommand} supabase status -o env`, { encoding: "utf8" });
const values = {};
for (const line of output.split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match) values[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
}
if (values.API_URL !== "http://127.0.0.1:54321" && values.API_URL !== "http://localhost:54321") {
  throw new Error("Local QA dibatalkan: API_URL bukan Supabase lokal port 54321.");
}
if (!values.ANON_KEY || !values.SERVICE_ROLE_KEY) {
  throw new Error("Local QA dibatalkan: key Supabase lokal tidak tersedia.");
}

const env = {
  ...process.env,
  UNDANGI_LOCAL_QA: "1",
  SUPABASE_URL: values.API_URL,
  NEXT_PUBLIC_SUPABASE_URL: values.API_URL,
  SUPABASE_SERVICE_ROLE_KEY: values.SERVICE_ROLE_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: values.ANON_KEY,
};
const port = process.argv[2] || "5174";
const child = process.platform === "win32"
  ? spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", `${npxCommand} vinext dev --port ${port}`], { stdio: "inherit", env })
  : spawn(npxCommand, ["vinext", "dev", "--port", port], { stdio: "inherit", env });
child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
