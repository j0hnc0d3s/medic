// ─────────────────────────────────────────────────────────
// FILE : src/pages/admin/AdminFinances.jsx
// CSS  : src/pages/admin/AdminFinances.css
//
// Three tabs: Income, Expenses, Pricing.
//
// Income and Expenses are separate views (not a combined P&L
// dashboard) per the actual mockups — each shows this month's total
// and a filterable transaction table. Expenses get an approve
// (green check) / reject (red trash) pair per row that Income
// doesn't, because billingService now creates expenses as 'pending'
// — a cost estimate that needs admin sign-off — while income is
// auto-finalized the moment something completes (see billingService
// for that reasoning).
//
// Pricing isn't in the mockups but has to live somewhere — these
// income/expense numbers only mean anything once charge/cost is
// actually set per category, so it's kept as a third tab here.
// ─────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react'
import { financeService, pricingService } from '../../services'
import AdminSidebar from './AdminSidebar'
import './AdminFinances.css'

const ICONS = {
  chevronDown: <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a1 1 0 01-1 1H7a1 1 0 01-1-1V6h12z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

const CATEGORY_GROUPS = [
  { key: 'appointment', label: 'Appointments', flat: false },
  { key: 'lab',         label: 'Labs',         flat: false },
  { key: 'imaging',     label: 'Imaging',      flat: true  },
]

const fmtMoney = (n) => `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate = (ts) => {
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).replace(/(\d+)$/, (day) => {
    const n = parseInt(day, 10)
    const suffix = (n % 10 === 1 && n !== 11) ? 'st' : (n % 10 === 2 && n !== 12) ? 'nd' : (n % 10 === 3 && n !== 13) ? 'rd' : 'th'
    return `${n}${suffix}`
  })
}

export default function AdminFinances() {
  const [tab, setTab] = useState('expenses') // 'income' | 'expenses' | 'pricing'

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [periodFilter, setPeriodFilter] = useState('month') // 'week' | 'month' | 'year'
  const [typeFilter, setTypeFilter] = useState('all')       // transaction category — lab/consultation/etc
  const [patientFilter, setPatientFilter] = useState('all')
  const [showPeriodMenu, setShowPeriodMenu] = useState(false)
  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const [showPatientMenu, setShowPatientMenu] = useState(false)

  const [pricing, setPricing] = useState(null)
  const [savingPricing, setSavingPricing] = useState(false)
  const [pricingSaved, setPricingSaved] = useState(false)

  const txType = tab === 'income' ? 'income' : 'expense'

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const res = await financeService.getTransactions({ type: txType })
      if (res.success) setTransactions(res.transactions)
    } catch (err) {
      console.error('Failed to load transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadPricing = async () => {
    const res = await pricingService.getPricing()
    if (res.success) setPricing(res.pricing)
  }

  useEffect(() => {
    if (tab === 'pricing') { loadPricing(); return }
    loadTransactions()
    setTypeFilter('all'); setPatientFilter('all'); setSearch('')
  }, [tab])

  const getPeriodRange = (period) => {
    const now = new Date()
    if (period === 'week') {
      const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0)
      const end = new Date(start); end.setDate(start.getDate() + 7)
      return { start, end }
    }
    if (period === 'year') {
      return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear() + 1, 0, 1) }
    }
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1) }
  }

  const periodLabel = { week: 'the week', month: 'the month', year: 'the year' }[periodFilter]

  const inSelectedPeriod = (t) => {
    const { start, end } = getPeriodRange(periodFilter)
    const d = t.date?.toDate ? t.date.toDate() : new Date(t.date)
    return d >= start && d < end
  }

  const periodTotal = useMemo(() => {
    return transactions
      .filter(t => inSelectedPeriod(t) && (txType === 'income' || t.status === 'completed')) // pending expenses aren't real costs yet
      .reduce((sum, t) => sum + (t.amount || 0), 0)
  }, [transactions, txType, periodFilter])

  const types = useMemo(() => [...new Set(transactions.map(t => t.category))], [transactions])
  const patientNames = useMemo(() => [...new Set(transactions.map(t => t.patientName).filter(Boolean))], [transactions])

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = !search || (t.patientName || '').toLowerCase().includes(search.toLowerCase())
        || (t.category || '').toLowerCase().includes(search.toLowerCase())
      const matchesPeriod = inSelectedPeriod(t)
      const matchesType = typeFilter === 'all' || t.category === typeFilter
      const matchesPatient = patientFilter === 'all' || t.patientName === patientFilter
      return matchesSearch && matchesPeriod && matchesType && matchesPatient
    })
  }, [transactions, search, periodFilter, typeFilter, patientFilter])

  const handleApprove = async (t) => {
    setTransactions(list => list.map(x => x.id === t.id ? { ...x, status: 'completed' } : x))
    try { await financeService.updateTransaction(t.id, { status: 'completed' }) }
    catch (err) { console.error('Approve failed:', err); loadTransactions() }
  }

  const handleReject = async (t) => {
    if (!window.confirm('Reject and remove this expense?')) return
    setTransactions(list => list.filter(x => x.id !== t.id))
    try { await financeService.deleteTransaction(t.id) }
    catch (err) { console.error('Reject failed:', err); loadTransactions() }
  }

  const setRate = (group, category, field, value) => {
    const num = parseFloat(value) || 0
    setPricingSaved(false)
    setPricing(p => {
      const next = { ...p }
      if (group === 'imaging') next.imaging = { ...next.imaging, [field]: num }
      else next[group] = { ...next[group], [category]: { ...next[group][category], [field]: num } }
      return next
    })
  }

  const handleSavePricing = async () => {
    setSavingPricing(true)
    try {
      const res = await pricingService.savePricing(pricing)
      if (res.success) setPricingSaved(true)
    } finally {
      setSavingPricing(false)
    }
  }

  return (
    <div className="no-shell">
      <AdminSidebar />

      <div className="no-main">
        <div className="af-tabs-row">
          <button className={`af-tab${tab === 'income' ? ' active' : ''}`} onClick={() => setTab('income')}>Income</button>
          <button className={`af-tab${tab === 'expenses' ? ' active' : ''}`} onClick={() => setTab('expenses')}>Expenses</button>
          <button className={`af-tab${tab === 'pricing' ? ' active' : ''}`} onClick={() => setTab('pricing')}>Pricing</button>
        </div>

        {tab !== 'pricing' ? (
          <>
            <div className={`af-total-card${tab === 'expenses' ? ' af-total-card--expense' : ' af-total-card--income'}`}>
              <p className="af-total-value">{fmtMoney(periodTotal)}</p>
              <p className="af-total-label">
                <span className="af-total-label-strong">{tab === 'expenses' ? 'Expenses' : 'Income'}</span> for {periodLabel}
              </p>
            </div>

            <div className="af-filter-row">
              <input className="af-search" placeholder="Search"
                value={search} onChange={e => setSearch(e.target.value)} />

              <div className="af-filter-wrap">
                <button className="af-filter" onClick={() => { setShowPeriodMenu(s => !s); setShowTypeMenu(false); setShowPatientMenu(false) }}>
                  <span className="af-filter-label">Filter {ICONS.chevronDown}</span>
                  <span className="af-filter-sub">by {periodFilter}</span>
                </button>
                {showPeriodMenu && (
                  <div className="af-filter-menu">
                    {['week', 'month', 'year'].map(p => (
                      <button key={p} className={periodFilter === p ? 'active' : ''} onClick={() => { setPeriodFilter(p); setShowPeriodMenu(false) }}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="af-filter-wrap">
                <button className="af-filter" onClick={() => { setShowTypeMenu(s => !s); setShowPeriodMenu(false); setShowPatientMenu(false) }}>
                  <span className="af-filter-label">Filter {ICONS.chevronDown}</span>
                  <span className="af-filter-sub">by type</span>
                </button>
                {showTypeMenu && (
                  <div className="af-filter-menu">
                    <button className={typeFilter === 'all' ? 'active' : ''} onClick={() => { setTypeFilter('all'); setShowTypeMenu(false) }}>All</button>
                    {types.map(c => (
                      <button key={c} className={typeFilter === c ? 'active' : ''} onClick={() => { setTypeFilter(c); setShowTypeMenu(false) }}>{c}</button>
                    ))}
                  </div>
                )}
              </div>

              <div className="af-filter-wrap">
                <button className="af-filter" onClick={() => { setShowPatientMenu(s => !s); setShowPeriodMenu(false); setShowTypeMenu(false) }}>
                  <span className="af-filter-label">Filter {ICONS.chevronDown}</span>
                  <span className="af-filter-sub">by patient</span>
                </button>
                {showPatientMenu && (
                  <div className="af-filter-menu">
                    <button className={patientFilter === 'all' ? 'active' : ''} onClick={() => { setPatientFilter('all'); setShowPatientMenu(false) }}>All</button>
                    {patientNames.length === 0 && <p className="af-filter-menu-empty">No patients in this list yet</p>}
                    {patientNames.map(name => (
                      <button key={name} className={patientFilter === name ? 'active' : ''} onClick={() => { setPatientFilter(name); setShowPatientMenu(false) }}>{name}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading…</p>
            ) : filtered.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 20 }}>
                No {tab} yet — transactions are created automatically when an appointment, lab,
                or imaging record is completed, if a charge or cost is set for its category (see the Pricing tab).
              </p>
            ) : (
              <div className="af-table">
                {filtered.map(t => (
                  <div key={t.id} className="af-row">
                    <div className="af-col af-col-date">
                      <p className="af-col-label">Date</p>
                      <p className="af-col-value">{fmtDate(t.date)}</p>
                    </div>
                    <div className="af-col af-col-name">
                      <p className="af-col-label">Name</p>
                      <p className="af-col-value">{t.patientName || '—'}</p>
                    </div>
                    <div className="af-col af-col-amount">
                      <p className="af-col-label">Amount</p>
                      <p className="af-col-value">{fmtMoney(t.amount)}</p>
                    </div>
                    <div className="af-col af-col-type">
                      <p className="af-col-label">Type</p>
                      <p className="af-col-value">{t.category}</p>
                    </div>

                    {tab === 'expenses' && (
                      <div className="af-row-actions">
                        <button className="af-action-btn af-action-btn--reject" onClick={() => handleReject(t)} aria-label="Reject">
                          {ICONS.trash}
                        </button>
                        <button
                          className={`af-action-btn af-action-btn--approve${t.status === 'completed' ? ' done' : ''}`}
                          onClick={() => handleApprove(t)}
                          disabled={t.status === 'completed'}
                          aria-label={t.status === 'completed' ? 'Approved' : 'Approve'}>
                          {ICONS.check}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="af-pricing">
            <p className="af-pricing-hint">
              Set what each category charges the patient and what it costs to deliver.
              Everything starts at $0 — nothing here is a guessed number.
            </p>

            {!pricing ? (
              <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading…</p>
            ) : (
              <>
                {CATEGORY_GROUPS.map(group => (
                  <div key={group.key} className="af-pricing-card">
                    <p className="af-pricing-card-title">{group.label}</p>

                    {group.flat ? (
                      <div className="af-pricing-row">
                        <span className="af-pricing-cat">All imaging</span>
                        <div className="af-pricing-inputs">
                          <label>Charge
                            <input type="number" min="0" step="0.01"
                              value={pricing.imaging.charge}
                              onChange={e => setRate('imaging', null, 'charge', e.target.value)} />
                          </label>
                          <label>Cost
                            <input type="number" min="0" step="0.01"
                              value={pricing.imaging.cost}
                              onChange={e => setRate('imaging', null, 'cost', e.target.value)} />
                          </label>
                        </div>
                      </div>
                    ) : (
                      Object.keys(pricing[group.key] || {}).map(cat => (
                        <div key={cat} className="af-pricing-row">
                          <span className="af-pricing-cat">{cat}</span>
                          <div className="af-pricing-inputs">
                            <label>Charge
                              <input type="number" min="0" step="0.01"
                                value={pricing[group.key][cat].charge}
                                onChange={e => setRate(group.key, cat, 'charge', e.target.value)} />
                            </label>
                            <label>Cost
                              <input type="number" min="0" step="0.01"
                                value={pricing[group.key][cat].cost}
                                onChange={e => setRate(group.key, cat, 'cost', e.target.value)} />
                            </label>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ))}

                <button className="af-save-btn" onClick={handleSavePricing} disabled={savingPricing}>
                  {savingPricing ? 'Saving…' : pricingSaved ? 'Saved ✓' : 'Save pricing'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}