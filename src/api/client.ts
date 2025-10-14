import axios from 'axios'
import { env } from '../env'

const http = axios.create({ baseURL: env.apiUrl })

export type HealthResponse = { status: string; db?: string }

async function getHealthHttp(): Promise<HealthResponse> {
  const { data } = await http.get('/healthz')
  // Map backend shape { ok: boolean, db: boolean } to UI-friendly strings
  const status = data?.ok ? 'ok' : 'error'
  const db = typeof data?.db === 'boolean' ? (data.db ? 'connected' : 'disconnected') : undefined
  return { status, db }
}

async function getHealthMock(): Promise<HealthResponse> {
  return Promise.resolve({ status: 'ok', db: 'connected (mock)' })
}

export const api = {
  health: env.useMock ? getHealthMock : getHealthHttp,
}