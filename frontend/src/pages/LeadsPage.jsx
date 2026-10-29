import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Pencil, Plus, Search, SearchX, Trash2, Users, X } from 'lucide-react'
import clsx from 'clsx'
import { leadsApi, parseApiError } from '../lib/api'
import { useAsync, useDebounced } from '../lib/useAsync'
import { STAGES, avatarVars, stageVars } from '../lib/constants'
import { formatBudget, initials } from '../lib/format'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { EmptyState, ErrorState, TableSkeleton } from '../components/ui/States'

/** Compact stage dropdown that saves immediately (M03). Tinted in the stage's own colour. */
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
      style={stageVars(lead.stage)}
      className={clsx(
        'stage-chip h-9 rounded-full border-0 py-0 pl-3.5 pr-8 text-[13px] font-semibold transition-colors focus:ring-2 focus:ring-primary/30 disabled:opacity-60',
        className,
      )}
    >
      {STAGES.map((s) => <option key={s} value={s} className="bg-surface text-ink">{s}</option>)}
    </select>
  )
}

const Avatar = ({ name, size = 'size-11' }) => (
  <span
    className={clsx('stage-chip flex shrink-0 items-center justify-center rounded-full text-[13px] font-bold', size)}
    style={avatarVars(name)}
  >
    {initials(name)}
  </span>
)

export { Avatar }

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

      {/* Filters sit on the page, outside the table surface */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or company"
            aria-label="Search leads by name or company"
            className="h-12 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-sm text-ink placeholder:text-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          aria-label="Filter by stage"
          className="h-12 rounded-full border border-line bg-surface px-5 pr-9 text-sm font-semibold text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 sm:w-52"
        >
          <option value="">All stages</option>
          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {filtered && (
          <Button variant="ghost" onClick={clearFilters}><X className="size-4" aria-hidden /> Clear</Button>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-line bg-surface">
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
                <tr className="border-b border-line text-[13px] text-muted">
                  <th scope="col" className="px-6 py-3.5 font-semibold">Lead</th>
                  <th scope="col" className="px-3 py-3.5 font-semibold">Contact</th>
                  <th scope="col" className="px-3 py-3.5 font-semibold">Budget</th>
                  <th scope="col" className="px-3 py-3.5 font-semibold">Stage</th>
                  <th scope="col" className="px-6 py-3.5 text-right font-semibold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {leads.map((lead) => (
                  <tr key={lead._id} className="transition-colors hover:bg-sunk/70">
                    <td className="px-6 py-4">
                      <Link to={`/leads/${lead._id}`} className="group flex items-center gap-3.5">
                        <Avatar name={lead.name} />
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] font-semibold text-ink group-hover:text-primary">{lead.name}</span>
                          <span className="block truncate text-[13px] text-muted">{lead.company || 'No company'}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-4 text-muted">
                      <span className="block max-w-[220px] truncate">{lead.email || 'No email'}</span>
                      <span className="block text-[13px] text-faint">{lead.phone || ''}</span>
                    </td>
                    <td className="px-3 py-4 font-semibold tabular-nums text-ink">{formatBudget(lead.budget)}</td>
                    <td className="px-3 py-4"><StageSelect lead={lead} onChanged={reload} /></td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/leads/${lead._id}?edit=1`)} aria-label={`Edit ${lead.name}`} title="Edit">
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:!text-danger" onClick={() => setToDelete(lead)} aria-label={`Delete ${lead.name}`} title="Delete">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile list */}
            <ul className="divide-y divide-line md:hidden">
              {leads.map((lead) => (
                <li key={lead._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link to={`/leads/${lead._id}`} className="flex min-w-0 items-center gap-3">
                      <Avatar name={lead.name} />
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-semibold text-ink">{lead.name}</span>
                        <span className="block truncate text-[13px] text-muted">{lead.company || lead.email || lead.phone}</span>
                      </span>
                    </Link>
                    <div className="flex shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/leads/${lead._id}?edit=1`)} aria-label={`Edit ${lead.name}`}><Pencil className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setToDelete(lead)} aria-label={`Delete ${lead.name}`}><Trash2 className="size-4" /></Button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <StageSelect lead={lead} onChanged={reload} />
                    <span className="text-sm font-semibold tabular-nums text-ink">{formatBudget(lead.budget)}</span>
                  </div>
                </li>
              ))}
            </ul>

            <p className="border-t border-line px-6 py-3.5 text-[13px] text-muted">
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
