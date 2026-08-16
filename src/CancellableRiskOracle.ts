import { RiskOracle } from './RiskOracle';

/**
 * A `RiskOracle` that can abandon an in-flight request when told to.
 *
 * This is an additive, optional extension of `RiskOracle` — not a
 * replacement — expressed as a distinctly-named second method
 * (`getScoreCancellable`) rather than an extra parameter on `getScore`
 * itself, mirroring how `DetailedRiskOracle` adds `getScoreDetailed` rather
 * than changing `getScore`'s signature. Existing `RiskOracle`
 * implementations remain completely unaffected: they don't have this
 * method, `isCancellable` reports `false` for them, and every wrapper in
 * this package falls back to plain `getScore` (today's reject-only-the-
 * caller behavior) when wrapping one.
 *
 * ## Cancellation contract
 *
 * An implementation of `getScoreCancellable` must, once `signal` fires:
 *
 * - Stop consuming the resource the call was using (abort the underlying
 *   HTTP/RPC request, clear pending timers, etc.) — not merely stop the
 *   caller from waiting on it.
 * - Reject with `OracleCancelledError` (see `OracleError.ts`), not with
 *   whatever error/value the abandoned request would otherwise have
 *   produced, so a cancellation is distinguishable from a real failure.
 *
 * `getScoreCancellable` must resolve to the same score `getScore` would for
 * the same destination when the signal never fires.
 */
export interface CancellableRiskOracle extends RiskOracle {
  /**
   * @param destination A Stellar address or asset identifier.
   * @param signal Aborting this cancels the request; see the interface doc
   * for the resulting contract.
   * @returns The same score `getScore` would resolve, unless cancelled.
   */
  getScoreCancellable(destination: string, signal: AbortSignal): Promise<number>;
}

/** Type guard: does `oracle` support cancellation via `getScoreCancellable`? */
export function isCancellable(oracle: RiskOracle): oracle is CancellableRiskOracle {
  return typeof (oracle as Partial<CancellableRiskOracle>).getScoreCancellable === 'function';
}
