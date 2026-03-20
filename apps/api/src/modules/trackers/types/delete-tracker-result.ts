export type DeleteTrackerResult =
  | { ok: true }
  | { ok: false; reason: 'USER_NOT_FOUND' | 'TRACKER_NOT_FOUND' }
