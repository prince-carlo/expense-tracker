import { get, set } from 'idb-keyval'

const QUEUE_KEY = 'finance-tracker:queue'
const CACHE_KEY = 'finance-tracker:cache'

export async function getQueue() {
  return (await get(QUEUE_KEY)) || []
}

export async function setQueue(queue) {
  await set(QUEUE_KEY, queue)
}

export async function getCache() {
  return (await get(CACHE_KEY)) || null
}

export async function setCache(transactions) {
  await set(CACHE_KEY, transactions)
}

// Reconstructs what the list should look like by replaying queued,
// not-yet-synced mutations on top of the last known-good snapshot.
export function applyQueueToList(list, queue) {
  let result = list
  for (const op of queue) {
    if (op.type === 'create') {
      result = [{ ...op.payload, id: op.tempId, _pending: true }, ...result]
    } else if (op.type === 'delete') {
      result = result.filter((t) => t.id !== op.id)
    }
  }
  return result
}
