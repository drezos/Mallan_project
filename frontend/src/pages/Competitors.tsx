import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Trash2, ExternalLink, Loader2, AlertCircle } from 'lucide-react'

const API_BASE_URL = 'https://mallanproject-production.up.railway.app'

interface Competitor {
  id: number
  name: string
  url: string | null
  created_at: string
  updated_at: string
}

interface CompetitorsResponse {
  success: boolean
  data: {
    competitors: Competitor[]
    count: number
    maxAllowed: number
  }
  error?: string
}

async function fetchCompetitors(): Promise<CompetitorsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/user/competitors`)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

async function addCompetitor(data: { name: string; url: string }): Promise<{ success: boolean; data?: Competitor; error?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/user/competitors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return response.json()
}

async function deleteCompetitor(id: number): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/user/competitors/${id}`, {
    method: 'DELETE',
  })
  return response.json()
}

export function Competitors() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['user-competitors'],
    queryFn: fetchCompetitors,
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
  })

  const addMutation = useMutation({
    mutationFn: addCompetitor,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['user-competitors'] })
        setName('')
        setUrl('')
        setError(null)
      } else {
        setError(result.error || 'Failed to add competitor')
      }
    },
    onError: () => {
      setError('Failed to add competitor')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCompetitor,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['user-competitors'] })
        setDeleteConfirmId(null)
      } else {
        setError(result.error || 'Failed to delete competitor')
      }
    },
    onError: () => {
      setError('Failed to delete competitor')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Competitor name is required')
      return
    }
    setError(null)
    addMutation.mutate({ name: name.trim(), url: url.trim() })
  }

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id)
  }

  const competitors = data?.data?.competitors || []
  const count = data?.data?.count || 0
  const maxAllowed = data?.data?.maxAllowed || 10
  const canAdd = count < maxAllowed

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-forest-500 mx-auto mb-3" />
          <p className="text-slate-500">Loading competitors...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-display font-semibold text-slate-900">
          Unable to load competitors
        </h2>
        <p className="text-slate-500 mt-2 max-w-md">
          Please try again later or check your connection.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-forest-600" />
          </div>
          <div>
            <h2 className="text-lg font-display font-semibold text-slate-900">
              Your Competitors
            </h2>
            <p className="text-sm text-slate-500">
              Track and manage your competitive landscape
            </p>
          </div>
        </div>
        <div className="bg-slate-100 px-4 py-2 rounded-lg">
          <span className="text-lg font-semibold text-slate-700">{count}</span>
          <span className="text-slate-400 mx-1">/</span>
          <span className="text-slate-500">{maxAllowed}</span>
        </div>
      </div>

      {/* Add Competitor Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-medium text-slate-700 mb-4">Add New Competitor</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Competitor name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent text-slate-900 placeholder-slate-400"
            disabled={!canAdd || addMutation.isPending}
          />
          <input
            type="url"
            placeholder="https://example.com (optional)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent text-slate-900 placeholder-slate-400"
            disabled={!canAdd || addMutation.isPending}
          />
          <button
            type="submit"
            disabled={!canAdd || addMutation.isPending}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-forest-600 text-white rounded-lg font-medium hover:bg-forest-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add
          </button>
        </form>

        {!canAdd && (
          <p className="mt-3 text-sm text-amber-600">
            Maximum of {maxAllowed} competitors reached. Remove one to add another.
          </p>
        )}
      </div>

      {/* Competitors List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {competitors.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500">No competitors added yet</p>
            <p className="text-sm text-slate-400 mt-1">Add your first competitor above</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {competitors.map((competitor) => (
              <li
                key={competitor.id}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-forest-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-forest-700 font-semibold text-sm">
                      {competitor.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {competitor.name}
                    </p>
                    {competitor.url && (
                      <a
                        href={competitor.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-forest-600 hover:text-forest-700 flex items-center gap-1 truncate"
                      >
                        <span className="truncate">{competitor.url}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {deleteConfirmId === competitor.id ? (
                    <>
                      <button
                        onClick={() => handleDelete(competitor.id)}
                        disabled={deleteMutation.isPending}
                        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {deleteMutation.isPending ? 'Deleting...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-3 py-1.5 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(competitor.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete competitor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
