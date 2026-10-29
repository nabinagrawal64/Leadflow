export default function PageHeader({ title, description, actions, back }) {
  return (
    <div className="mb-8">
      {back}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[34px] font-bold leading-[1.08] text-ink sm:text-[44px]">{title}</h1>
          {description && <p className="mt-2 max-w-xl text-[15px] text-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
