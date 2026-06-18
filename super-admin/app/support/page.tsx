'use client'
import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/utils'
import { encryptId } from '@/lib/idCrypto'
import type { SupportTicket } from '@/types'

const STATUS_COLORS = {
  open:        'bg-red-100 text-red-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved:    'bg-green-100 text-green-700',
  closed:      'bg-gray-100 text-gray-500',
}

const PRIORITY_COLORS = {
  high:   'bg-red-50 text-red-600',
  medium: 'bg-yellow-50 text-yellow-600',
  low:    'bg-gray-50 text-gray-500',
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [filter, setFilter]   = useState('')
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    const p = new URLSearchParams()
    if (filter) p.set('status', filter)
    fetch(`/api/support?${p}`).then(r => r.json())
      .then(d => setTickets(d.tickets || []))
      .finally(() => setLoading(false))
  }
  useEffect(load, [filter])

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/support/${encryptId(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    load()
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">Manage user support requests</p>
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading...</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-100">No tickets found</div>
        ) : tickets.map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[t.status]}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[t.priority]}`}>
                    {t.priority} priority
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">{t.subject}</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{t.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {t.user_name} ({t.user_email}) · {formatDate(t.created_at)}
                </p>
              </div>
              <select
                value={t.status}
                onChange={e => updateStatus(t.id, e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none shrink-0"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
