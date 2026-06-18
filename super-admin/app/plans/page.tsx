'use client'
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Check } from 'lucide-react'
import { encryptId } from '@/lib/idCrypto'
import type { Plan } from '@/types'

const EMPTY_PLAN: Omit<Plan, 'id'> = {
  name: '', price_monthly: 0, price_yearly: 0,
  max_contacts: 1000, max_messages_per_month: 10000,
  max_agents: 1, features: [], is_active: true,
}

export default function PlansPage() {
  const [plans, setPlans]   = useState<Plan[]>([])
  const [editing, setEditing] = useState<Plan | null>(null)
  const [form, setForm]     = useState(EMPTY_PLAN)
  const [showForm, setShowForm] = useState(false)

  function load() {
    fetch('/api/plans').then(r => r.json()).then(d => setPlans(d.plans || []))
  }
  useEffect(load, [])

  function openCreate() { setForm(EMPTY_PLAN); setEditing(null); setShowForm(true) }
  function openEdit(p: Plan) { setForm(p); setEditing(p); setShowForm(true) }

  async function save() {
    const method = editing ? 'PUT' : 'POST'
    const url    = editing ? `/api/plans/${encryptId(editing.id)}` : '/api/plans'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setShowForm(false)
    load()
  }

  async function deletePlan(id: number) {
    if (!confirm('Delete this plan?')) return
    await fetch(`/api/plans/${encryptId(id)}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
          <p className="text-sm text-gray-500 mt-1">Manage subscription plans</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="font-bold text-gray-900 text-lg capitalize">{p.name}</h2>
                <p className="text-green-600 font-semibold mt-0.5">₹{p.price_monthly}/mo</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deletePlan(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <ul className="space-y-1.5 text-sm text-gray-600">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-500" />{p.max_contacts.toLocaleString()} contacts</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-500" />{p.max_messages_per_month.toLocaleString()} messages/mo</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-500" />{p.max_agents} agents</li>
              {(typeof p.features === 'string' ? JSON.parse(p.features) : p.features ?? []).map((f: string, i: number) => (
                <li key={i} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-500" />{f}</li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {p.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Plan Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold">{editing ? 'Edit Plan' : 'New Plan'}</h2>
            {[
              { label: 'Plan Name', key: 'name', type: 'text' },
              { label: 'Price Monthly (₹)', key: 'price_monthly', type: 'number' },
              { label: 'Price Yearly (₹)', key: 'price_yearly', type: 'number' },
              { label: 'Max Contacts', key: 'max_contacts', type: 'number' },
              { label: 'Max Messages/Month', key: 'max_messages_per_month', type: 'number' },
              { label: 'Max Agents', key: 'max_agents', type: 'number' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  type={type}
                  value={(form as any)[key]}
                  onChange={e => setForm(prev => ({ ...prev, [key]: type === 'number' ? +e.target.value : e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" checked={form.is_active}
                onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))} />
              <label htmlFor="active" className="text-sm text-gray-700">Active</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={save}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
