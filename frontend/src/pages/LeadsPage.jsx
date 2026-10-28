import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Pencil, Plus, Search, SearchX, Trash2, Users, X } from 'lucide-react'
import clsx from 'clsx'
import { leadsApi, parseApiError } from '../lib/api'
import { useAsync, useDebounced } from '../lib/useAsync'
import { STAGES } from '../lib/constants'
import { formatBudget, initials } from '../lib/format'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { EmptyState, ErrorState, TableSkeleton } from '../components/ui/States'

const stageSelectStyle = {
  New: 'bg-slate-100 text-slate-700',
  Contacted: 'bg-sky-50 text-sky-700',
  Qualified: 'bg-violet-50 text-violet-700',
  'Proposal Sent': 'bg-amber-50 text-amber-800',
  Won: 'bg-emerald-50 text-emerald-700',
  Lost: 'bg-rose-50 text-rose-700',
}

/** Compact stage dropdown that saves immediately (M03). */
export function StageSelect({ lead, onChanged, className }) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)

  const change = async (e) => {
    const stage = e.target.value
    if (stage === lead.stage) return
    setSaving(true)
    try {
      await leadsApi.update(lead._id, { stage })
      toast.success(`${lead.name} moved to ${stage}`)
      onChanged?.(stage)
    } catch (err) {
      toast.error(parseApiError(err).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <select
      value={lead.stage}
      onChange={change}
      disabled={saving}
      aria-label={`Change stage for ${lead.name}`}
      className={clsx(
        'h-8 rounded-full border-0 py-0 pl-3 pr-7 text-xs font-semibold transition-colors focus:ring-2 focus:ring-brand-600/30 disabled:opacity-60',
        stageSelectStyle[lead.stage],
        className,
      )}
    >
      {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  )
}

export default function LeadsPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const stage = params.get('stage') || ''
  const [search, setSearch] = useState(params.get('search') || '')
  const debouncedSearch = useDebounced(search.trim(), 300)

  // keep ?search= in the URL so filtered views can be shared and survive refresh
  useEffect(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (debouncedSearch) next.set('search', debouncedSearch)
        else next.delete('search')
        return next
      },
      { replace: true },
    )
  }, [debouncedSearch, setParams])

  const setStage = (value) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set('stage', value)
      else next.delete('stage')
      return next
    })

  const { data, loading, error, reload } = useAsync(
    () => leadsApi.list({ ...(debouncedSearch && { search: debouncedSearch }), ...(stage && { stage }) }),
    [debouncedSearch, stage],
  )
  const leads = data || []
  const filtered = Boolean(debouncedSearch || stage)

  const [toDelete, setToDelete] = useState(null)
  const confirmDelete = async () => {
    try {
      await leadsApi.remove(toDelete._id)
      toast.success(`${toDelete.name} was deleted`)
      setToDelete(null)
      reload()
    } catch (err) {
      toast.error(parseApiError(err).message)
      setToDelete(null)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setParams({}, { replace: true })
  }

  return (
    <>
      <PageHeader
        title="Leads"
        description="Everyone in your pipeline, in one place."
        actions={
          <Link to="/leads/new">
            <Button><Plus className="size-4" aria-hidden /> New lead</Button>
          </Link>
        }
      />

      <div className="rounded-xl border border-line bg-white">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or company"
              aria-label="Search leads by name or company"
              className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
            />
          </div>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            aria-label="Filter by stage"
            className="h-10 rounded-lg border border-line bg-white px-3 pr-8 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 sm:w-48"
          >
            <option value="">All stages</option>
            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {filtered && (
            <Button variant="ghost" onClick={clearFilters}><X className="size-4" aria-hidden /> Clear</Button>
          )}
        </div>

        {/* Body */}
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading && !data ? (
          <TableSkeleton />
        ) : leads.length === 0 ? (
          filtered ? (
            <EmptyState
              icon={SearchX}
              title="No leads match your filters"
              description="Try a different search term or stage."
              action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>}
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No leads yet"
              description="Capture your first prospect to start building your pipeline."
              action={<Link to="/leads/new"><Button><Plus className="size-4" aria-hidden /> Add your first lead</Button></Link>}
            />
          )
        ) : (
          <div className={clsx('transition-opacity', loading && 'opacity-60')}>
            {/* Desktop table */}
            <table className="hidden w-full text-left text-sm md:table">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-5 py-3 font-semibold">Lead</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Contact</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Budget</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Stage</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {leads.map((lead) => (
                  <tr key={lead._id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <Link to={`/leads/${lead._id}`} className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                          {initials(lead.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-ink hover:text-brand-600">{lead.name}</span>
                          <span className="block truncate text-xs text-ink-soft">{lead.company || 'No company'}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3.5 text-ink-soft">
                      <span className="block max-w-[220px] truncate">{lead.email || '—'}</span>
                      <span className="block text-xs">{lead.phone || ''}</span>
                    </td>
                    <td className="px-3 py-3.5 tabular-nums text-ink-soft">{formatBudget(lead.budget)}</td>
                    <td className="px-3 py-3.5"><StageSelect lead={lead} onChanged={reload} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/leads/${lead._id}?edit=1`)} aria-label={`Edit ${lead.name}`} title="Edit">
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:!bg-rose-50 hover:!text-rose-600" onClick={() => setToDelete(lead)} aria-label={`Delete ${lead.name}`} title="Delete">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <ul className="divide-y divide-line md:hidden">
              {leads.map((lead) => (
                <li key={lead._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link to={`/leads/${lead._id}`} className="flex min-w-0 items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                        {initials(lead.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-ink">{lead.name}</span>
                        <span className="block truncate text-xs text-ink-soft">{lead.company || lead.email || lead.phone}</span>
                      </span>
                    </Link>
                    <div className="flex shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/leads/${lead._id}?edit=1`)} aria-label={`Edit ${lead.name}`}><Pencil className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setToDelete(lead)} aria-label={`Delete ${lead.name}`}><Trash2 className="size-4" /></Button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <StageSelect lead={lead} onChanged={reload} />
                    <span className="text-sm font-semibold tabular-nums text-ink-soft">{formatBudget(lead.budget)}</span>
                  </div>
                </li>
              ))}
            </ul>

            <p className="border-t border-line px-5 py-3 text-xs text-ink-soft">
              Showing {leads.length} {leads.length === 1 ? 'lead' : 'leads'}
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this lead?"
        message={`“${toDelete?.name}” and all of its follow-ups will be permanently removed. This cannot be undone.`}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  )
}
