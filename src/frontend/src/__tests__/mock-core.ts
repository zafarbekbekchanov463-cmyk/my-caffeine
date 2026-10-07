import type { MockActor } from "./test-utils";

export interface AuthState {
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  loginError?: Error;
  identity: { getPrincipal: () => { toString: () => string } } | undefined;
  login: () => void;
  clear: () => void;
}

export interface CoreState {
  actor: MockActor | null;
  isFetching: boolean;
  auth: AuthState;
}

function freshAuth(): AuthState {
  return {
    isAuthenticated: false,
    isLoggingIn: false,
    identity: undefined,
    login: () => {},
    clear: () => {},
  };
}

/**
 * The mocked `@caffeineai/core-infrastructure` module reads from this state.
 * It lives on `globalThis` so it survives `vi.resetModules()`, which tests use
 * to rebuild the app's singleton router with a fresh initial URL.
 */
const STATE_KEY = "__caffeineTestCoreState__";

function stateHolder(): { current: CoreState } {
  const global = globalThis as unknown as Record<string, unknown>;
  if (!global[STATE_KEY]) {
    global[STATE_KEY] = {
      current: { actor: null, isFetching: false, auth: freshAuth() },
    };
  }
  return global[STATE_KEY] as { current: CoreState };
}

export const coreState: CoreState = new Proxy({} as CoreState, {
  get(_target, prop) {
    return stateHolder().current[prop as keyof CoreState];
  },
  set(_target, prop, value) {
    stateHolder().current[prop as keyof CoreState] = value as never;
    return true;
  },
});

export function resetCoreState(): void {
  stateHolder().current = {
    actor: null,
    isFetching: false,
    auth: freshAuth(),
  };
}
