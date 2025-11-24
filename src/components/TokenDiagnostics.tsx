import React, { useEffect, useState } from 'react'

interface RefreshStatus {
  ok: boolean
  at: number
  error?: any
}

function decode(token: string | null) {
  if (!token) return null
  try {
    const [, payload] = token.split('.')
    const json = JSON.parse(atob(payload))
    return json
  } catch {
    return null
  }
}

const formatTs = (ts: number) => new Date(ts).toLocaleTimeString()

export const TokenDiagnostics: React.FC = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const load = () => {
      setAccessToken(localStorage.getItem('authToken'))
      setRefreshToken(localStorage.getItem('refreshToken'))
    }
    load()
    const id = setInterval(() => setNow(Date.now()), 1000)
    window.addEventListener('storage', load)
    const handler = (e: Event) => {
      const detail: any = (e as CustomEvent).detail
      setRefreshStatus(detail)
      load()
    }
    window.addEventListener('token:refresh-status', handler as EventListener)
    return () => {
      clearInterval(id)
      window.removeEventListener('storage', load)
      window.removeEventListener('token:refresh-status', handler as EventListener)
    }
  }, [])

  const accessPayload = decode(accessToken)
  const refreshPayload = decode(refreshToken)
  const secondsRemaining = accessPayload?.exp ? accessPayload.exp - Math.floor(Date.now() / 1000) : null

  return (
    <div className="p-4 rounded-lg border border-blue-300 bg-blue-50 text-sm space-y-2">
      <div className="font-semibold text-blue-800">Token Diagnostics</div>
      <div>Current Time: {formatTs(now)}</div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="font-medium">Access Token</div>
          <div className="truncate max-w-full text-xs">{accessToken || '—'}</div>
          {accessPayload && (
            <ul className="mt-1 text-xs space-y-0.5">
              <li>exp: {accessPayload.exp} ({accessPayload.exp ? formatTs(accessPayload.exp * 1000) : ''})</li>
              <li>iat: {accessPayload.iat}</li>
              <li>remaining: {secondsRemaining != null ? secondsRemaining + 's' : '—'}</li>
            </ul>
          )}
        </div>
        <div>
          <div className="font-medium">Refresh Token</div>
          <div className="truncate max-w-full text-xs">{refreshToken || '—'}</div>
          {refreshPayload && (
            <ul className="mt-1 text-xs space-y-0.5">
              <li>exp: {refreshPayload.exp} ({refreshPayload.exp ? formatTs(refreshPayload.exp * 1000) : ''})</li>
              <li>iat: {refreshPayload.iat}</li>
              <li>type: {refreshPayload.token_type || 'refresh'}</li>
            </ul>
          )}
        </div>
      </div>
      <div className="pt-2 border-t border-blue-200">
        <div className="font-medium">Last Refresh Attempt</div>
        {refreshStatus ? (
          <div className={refreshStatus.ok ? 'text-yellow-700' : 'text-red-700'}>
            {refreshStatus.ok ? 'SUCCESS' : 'FAILED'} at {formatTs(refreshStatus.at)} {refreshStatus.error && `(status: ${refreshStatus.error})`}
          </div>
        ) : <div className="text-gray-500">None recorded</div>}
      </div>
      <div className="text-xs text-blue-700 pt-2">
        If network errors persist while access token is valid, inspect backend CORS configuration.
      </div>
    </div>
  )
}

export default TokenDiagnostics