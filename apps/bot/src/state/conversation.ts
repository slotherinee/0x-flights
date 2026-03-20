/**
 * Redis-based conversation state.
 */
import { Redis } from 'ioredis'
import { getRedisConfig } from '@0x-flights/config'

export type TrackStep =
  | 'AWAITING_ORIGIN'
  | 'AWAITING_DESTINATION'
  | 'AWAITING_DATE'
  | 'AWAITING_RETURN_DATE'
  | 'AWAITING_THRESHOLD'

export interface ConversationState {
  step: TrackStep
  origin?: string
  destination?: string
  departureDate?: string
  returnDate?: string
  isRoundTrip?: boolean
}

const TTL = 600 // 10 minutes

let _redis: Redis | null = null

function redis(): Redis {
  if (!_redis) _redis = new Redis(getRedisConfig())
  return _redis
}

const key = (chatId: number) => `conv:${chatId}`

export const getState = async (chatId: number): Promise<ConversationState | null> => {
  const raw = await redis().get(key(chatId))
  return raw ? (JSON.parse(raw) as ConversationState) : null
}

export const setState = async (chatId: number, state: ConversationState): Promise<void> => {
  await redis().setex(key(chatId), TTL, JSON.stringify(state))
}

export const clearState = async (chatId: number): Promise<void> => {
  await redis().del(key(chatId))
}

export const closeRedis = async (): Promise<void> => {
  if (_redis) { await _redis.quit(); _redis = null }
}
