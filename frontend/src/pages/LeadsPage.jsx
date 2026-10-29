import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowDown, ArrowUp, ArrowUpDown, Download, Kanban, List,
  Pencil, Plus, Search, SearchX, Trash2, Users, X,
} from 'lucide-react'
import clsx from 'clsx'
import { leadsApi, parseApiError } from '../lib/api'
import { useAsync, useDebounced } from '../lib/useAsync'
import { STAGES, SOURCES, SERVICES, avatarVars, stageVars } from '../lib/constants'
import { formatBudget, initials } from '../lib/format'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { EmptyState, ErrorState, TableSkeleton } from '../components/ui/States'

/** Compact stage dropdown that saves immediately. */
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

// ─── Sort header cell ─────────────────────────────────────────────────────────
function SortTh({ field, current, order, onSort, children, className }) {
  const active = current === field
  const Icon = active ? (order === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
  return (
    <th
      scope="col"
      className={clsx('px-3 py-3.5 font-semibold', className)}
    >
      <button
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"
      >
        {children}
        <Icon className={clsx('size-3.5', active ? 'text-primary' : 'opacity-40')} aria-hidden />
      </button>
    </th>
  )
}

// ─── Kanban board ─────────────────────────────────────────────────────────────
function KanbanBoard({ leads, onStageChange, onEdit, onDelete }) {
  const [dragging, setDragging] = useState(null) // { lead, fromStage }
  const [dragOver, setDragOver] = useState(null) // stage string

  const byStage = Object.fromEntries(STAGES.map((s) => [s, leads.filter((l) => l.stage === s)]))

  const handleDragStart = (e, lead) => {
    setDragging({ lead, fromStage: lead.stage })
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e, stage) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(stage)
  }
  const handleDrop = async (e, toStage) => {
    e.preventDefault()
    setDragOver(null)
    if (!dragging || dragging.lead.stage === toStage) { setDragging(null); return }
    await onStageChange(dragging.lead, toStage)
    setDragging(null)
  }
  const handleDragEnd = () => { setDragging(null); setDragOver(null) }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 500 }}>
      {STAGES.map((stage) => (
        <div
          key={stage}
          className={clsx(
            'flex shrink-0 flex-col rounded-2xl border border-line bg-surface transition-colors',
            'w-64 xl:w-72',
            dragOver === stage && dragging?.lead.stage !== stage && 'border-primary bg-primary/5',
          )}
          onDragOver={(e) => handleDragOver(e, stage)}
          onDrop={(e) => handleDrop(e, stage)}
          onDragLeave={() => setDragOver(null)}
        >
          {/* Column header */}
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <span className="size-2.5 rounded-full" style={{ background: `color-mix(in srgb, var(--c) 70%, transparent)`, '--c': stageVars(stage)['--c'] }} />
              {stage}
            </span>
            <span className="rounded-full bg-sunk px-2 py-0.5 text-[11px] font-bold tabular-nums text-muted">
              {byStage[stage].length}
            </span>
          </div>

          {/* Cards */}
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
            {byStage[stage].length === 0 && (
              <div className={clsx(
                'flex h-16 items-center justify-center rounded-xl border-2 border-dashed border-line text-[13px] text-faint transition-colors',
                dragOver === stage && dragging?.lead.stage !== stage && 'border-primary/40 text-primary',
              )}>
                Drop here
              </div>
            )}
            {byStage[stage].map((lead) => (
              <div
                key={lead._id}
                draggable
                onDragStart={(e) => handleDragStart(e, lead)}
                onDragEnd={handleDragEnd}
                className={clsx(
                  'group relative cursor-grab rounded-xl border border-line bg-canvas p-3.5 transition-all active:cursor-grabbing active:opacity-60 hover:border-primary/30 hover:shadow-sm',
                  dragging?.lead._id === lead._id && 'opacity-40',
                )}
              >
                <Link to={`/leads/${lead._id}`} className="block" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={lead.name} size="size-8" />
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-ink">{lead.name}</p>
                      {lead.company && <p className="truncate text-[12px] text-muted">{lead.company}</p>}
                    </div>
                  </div>
                  {lead.budget != null && (
                    <p className="mt-2.5 text-[13px] font-semibold tabular-nums text-ink">{formatBudget(lead.budget)}</p>
                  )}
                  {(lead.email || lead.phone) && (
                    <p className="mt-1 truncate text-[12px] text-faint">{lead.email || lead.phone}</p>
                  )}
                </Link>
                <div className="mt-3 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => onEdit(lead)}
                    className="rounded-lg p-1.5 text-muted hover:bg-sunk hover:text-ink"
                    aria-label={`Edit ${lead.name}`}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(lead)}
                    className="rounded-lg p-1.5 text-muted hover:bg-sunk hover:text-danger"
                    aria-label={`Delete ${lead.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, pages, total, limit, onPage }) {
  if (pages <= 1) return null
  const visible = []
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) visible.push(i)
    else if (visible[visible.length - 1] !== '…') visible.push('…')
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-3.5">
      <p className="text-[13px] text-muted">
        {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total} leads
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-muted hover:bg-sunk disabled:opacity-40"
        >
          ‹ Prev
        </button>
        {visible.map((v, i) =>
          v === '…' ? (
            <span key={`e${i}`} className="px-2 text-faint">…</span>
          ) : (
            <button
              key={v}
              onClick={() => onPage(v)}
              className={clsx(
                'min-w-[32px] rounded-lg px-2 py-1.5 text-[13px] font-semibold transition-colors',
                v === page ? 'bg-primary text-on-primary' : 'text-muted hover:bg-sunk',
              )}
            >
              {v}
            </button>
          )
        )}
        <button
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-muted hover:bg-sunk disabled:opacity-40"
        >
          Next ›
        </button>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function LeadsPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const stage = params.get('stage') || ''
  const source = params.get('source') || ''
  const serviceInterest = params.get('serviceInterest') || ''
  const sortField = params.get('sort') || 'createdAt'
  const sortOrder = params.get('order') || 'desc'
  const view = params.get('view') || 'list'
  const currentPage = parseInt(params.get('page') || '1', 10)

  const [search, setSearch] = useState(params.get('search') || '')
  const debouncedSearch = useDebounced(search.trim(), 300)

  // Sync search to URL
  useEffect(() => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (debouncedSearch) next.set('search', debouncedSearch)
      else next.delete('search')
      next.delete('page') // reset to page 1 on search change
      return next
    }, { replace: true })
  }, [debouncedSearch, setParams])

  const setParam = (key, value) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      next.delete('page')
      return next
    })

  const setSort = (field) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (next.get('sort') === field) {
        next.set('order', next.get('order') === 'asc' ? 'desc' : 'asc')
      } else {
        next.set('sort', field)
        next.set('order', 'desc')
      }
      next.delete('page')
      return next
    })
  }

  const setPage = (p) => setParams((prev) => { const next = new URLSearchParams(prev); next.set('page', p); return next })

  const queryArgs = {
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(stage && { stage }),
    ...(source && { source }),
    ...(serviceInterest && { serviceInterest }),
    sort: sortField,
    order: sortOrder,
    page: currentPage,
    limit: 25,
  }

  // Kanban loads all leads (no pagination)
  const kanbanArgs = {
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(stage && { stage }),
    ...(source && { source }),
    ...(serviceInterest && { serviceInterest }),
    limit: 200,
    sort: 'createdAt',
    order: 'desc',
  }

  const { data, loading, error, reload } = useAsync(
    () => leadsApi.list(view === 'kanban' ? kanbanArgs : queryArgs),
    [debouncedSearch, stage, source, serviceInterest, sortField, sortOrder, currentPage, view],
  )

  // Extract from paginated response
  const leads = data?.leads || []
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0, limit: 25 }
  const filtered = Boolean(debouncedSearch || stage || source || serviceInterest)

  const [toDelete, setToDelete] = useState(null)
  const [exporting, setExporting] = useState(false)

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
    setParams({ view }, { replace: true })
  }

  const exportCsv = async () => {
    setExporting(true)
    try {
      const blob = await leadsApi.exportCsv({
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(stage && { stage }),
        ...(source && { source }),
        ...(serviceInterest && { serviceInterest }),
        sort: sortField,
        order: sortOrder,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'leads.csv'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV exported')
    } catch (_err) {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const handleKanbanStageChange = useCallback(async (lead, toStage) => {
    try {
      await leadsApi.update(lead._id, { stage: toStage })
      toast.success(`${lead.name} moved to ${toStage}`)
      reload()
    } catch (err) {
      toast.error(parseApiError(err).message)
    }
  }, [reload, toast])

  return (
    <>
      <PageHeader
        title="Leads"
        description="Everyone in your pipeline, in one place."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" loading={exporting} onClick={exportCsv} title="Export current filter to CSV">
              <Download className="size-4" aria-hidden /> Export CSV
            </Button>
            <Link to="/leads/new">
              <Button><Plus className="size-4" aria-hidden /> New lead</Button>
            </Link>
          </div>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, company or email"
              aria-label="Search leads"
              className="h-12 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-sm text-ink placeholder:text-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-full bg-sunk p-1 ring-1 ring-line">
              <button
                onClick={() => setParam('view', 'list')}
                className={clsx('rounded-full p-2 transition-colors', view !== 'kanban' ? 'bg-surface shadow-sm ring-1 ring-line text-ink' : 'text-muted hover:text-ink')}
                aria-label="List view" title="List view"
              >
                <List className="size-4" />
              </button>
              <button
                onClick={() => setParam('view', 'kanban')}
                className={clsx('rounded-full p-2 transition-colors', view === 'kanban' ? 'bg-surface shadow-sm ring-1 ring-line text-ink' : 'text-muted hover:text-ink')}
                aria-label="Kanban view" title="Kanban board"
              >
                <Kanban className="size-4" />
              </button>
            </div>
          </div>
        </div>
        {/* Secondary filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={stage}
            onChange={(e) => setParam('stage', e.target.value)}
            aria-label="Filter by stage"
            className="h-10 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          >
            <option value="">All stages</option>
            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={source}
            onChange={(e) => setParam('source', e.target.value)}
            aria-label="Filter by source"
            className="h-10 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          >
            <option value="">All sources</option>
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={serviceInterest}
            onChange={(e) => setParam('serviceInterest', e.target.value)}
            aria-label="Filter by service"
            className="h-10 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          >
            <option value="">All services</option>
            {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {filtered && (
            <Button variant="ghost" onClick={clearFilters}><X className="size-4" aria-hidden /> Clear filters</Button>
          )}
        </div>
      </div>

      {/* Kanban view */}
      {view === 'kanban' ? (
        error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading && !data ? (
          <TableSkeleton />
        ) : (
          <KanbanBoard
            leads={leads}
            onStageChange={handleKanbanStageChange}
            onEdit={(lead) => navigate(`/leads/${lead._id}?edit=1`)}
            onDelete={setToDelete}
          />
        )
      ) : (
        /* List view */
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
                description="Try a different search or clear your filters."
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
                    <SortTh field="name" current={sortField} order={sortOrder} onSort={setSort} className="px-6">Lead</SortTh>
                    <th scope="col" className="px-3 py-3.5 text-[13px] font-semibold">Contact</th>
                    <SortTh field="budget" current={sortField} order={sortOrder} onSort={setSort}>Budget</SortTh>
                    <SortTh field="stage" current={sortField} order={sortOrder} onSort={setSort}>Stage</SortTh>
                    <SortTh field="createdAt" current={sortField} order={sortOrder} onSort={setSort}>Added</SortTh>
                    <th scope="col" className="px-6 py-3.5 text-right text-[13px] font-semibold"><span className="sr-only">Actions</span></th>
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
                      <td className="px-3 py-4 text-[13px] text-muted">
                        {new Date(lead.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
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

              <Pagination
                page={pagination.page}
                pages={pagination.pages}
                total={pagination.total}
                limit={pagination.limit}
                onPage={setPage}
              />
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this lead?"
        message={`"${toDelete?.name}" and all of its follow-ups will be permanently removed. This cannot be undone.`}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  )
}
