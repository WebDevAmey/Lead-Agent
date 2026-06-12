import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";

type Listener = (chunk: string) => void;

interface AgentState {
  process: ChildProcess | null;
  listeners: Set<Listener>;
}

const globalForAgent = globalThis as unknown as { __agentState?: AgentState };

export function getAgentState(): AgentState {
  if (!globalForAgent.__agentState) {
    globalForAgent.__agentState = { process: null, listeners: new Set() };
  }
  return globalForAgent.__agentState;
}

export function broadcast(text: string) {
  const state = getAgentState();
  for (const listener of state.listeners) listener(text);
}

export function isRunning() {
  return getAgentState().process !== null;
}

export function startAgent(): { started: boolean; error?: string } {
  const state = getAgentState();
  if (state.process) {
    return { started: false, error: "A run is already in progress" };
  }

  const cwd = path.join(process.cwd(), "..");
  const child = spawn("npm", ["start"], { cwd });
  state.process = child;
  broadcast("__START__");

  child.stdout?.on("data", (d) => broadcast(d.toString()));
  child.stderr?.on("data", (d) => broadcast(d.toString()));
  child.on("close", (code) => {
    broadcast(`__EXIT__${code}`);
    state.process = null;
  });

  return { started: true };
}
