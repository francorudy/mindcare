import { execSync } from "node:child_process";

const port = process.argv[2] ?? "3000";

function freePortWindows(targetPort) {
  try {
    const output = execSync(`netstat -ano | findstr :${targetPort}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    const pids = new Set();
    for (const line of output.split(/\r?\n/)) {
      if (!line.includes("LISTENING")) continue;
      const match = line.trim().match(/(\d+)\s*$/);
      if (match) pids.add(match[1]);
    }

    for (const pid of pids) {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      console.log(`Puerto ${targetPort} liberado (PID ${pid}).`);
    }
  } catch {
    // Puerto libre o sin procesos escuchando.
  }
}

function freePortUnix(targetPort) {
  try {
    const output = execSync(`lsof -ti :${targetPort}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    for (const pid of output.split(/\r?\n/).filter(Boolean)) {
      execSync(`kill -9 ${pid}`, { stdio: "ignore" });
      console.log(`Puerto ${targetPort} liberado (PID ${pid}).`);
    }
  } catch {
    // Puerto libre.
  }
}

if (process.platform === "win32") {
  freePortWindows(port);
} else {
  freePortUnix(port);
}
