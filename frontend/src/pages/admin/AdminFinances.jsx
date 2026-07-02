// ─────────────────────────────────────────────────────────
// FILE : src/pages/admin/AdminFinances.jsx
// CSS  : src/pages/admin/AdminFinances.css
// ─────────────────────────────────────────────────────────
import { useState } from 'react'
import AdminSidebar from './AdminSidebar'
import Calendar from '../../components/Calendar'
import FinanceFormModal, { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../../components/FinanceFormModal'
import './AdminFinances.css'

import doctor from '../../assets/images/doctor1.jpeg'

const ICONS = {
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>,
  pencil: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevronDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

const CURRENT_USER = { firstName: 'Charlie', lastName: 'Martel', role: 'Administrator', image: doctor, online: true, notifications: true }
const MOCK_TASKS_TODAY = [
  { id: 1, label: 'Reconcile May invoices' },
  { id: 2, label: 'Approve June payroll' },
]
const MOCK_AGENDA_TODAY = [
  { id: 1, time: '11:00 AM', label: 'Finance committee call' },
]

// NOTE: mock data — dateISO drives real filtering, `date` is just the
// display label. Swap for real ledger entries once a finances service
// exists. Heads up: these mock dates are fixed in the past, so depending
// on today's real date, the "Today" and "This Week" filters may
// legitimately show nothing for them — that's correct behavior, not a bug.
const INITIAL_ENTRIES = [
  { id: 1, type: 'income', dateISO: '2026-03-26', date: 'March 26', name: 'Amanda Brown', amount: 90, category: 'Consultation' },
  { id: 2, type: 'income', dateISO: '2026-04-06', date: 'April 06', name: 'Kyle White', amount: 90, category: 'Consultation' },
  { id: 3, type: 'income', dateISO: '2026-05-01', date: 'May 01', name: 'Ethan Baxter', amount: 90, category: 'Consultation' },
  { id: 4, type: 'expense', dateISO: '2026-04-15', date: 'April 15', name: 'Jamaica Power', amount: 420, category: 'Utilities' },
]

const LEDGER_TO_TYPE = { assets: 'income', expenses: 'expense' }
const RANGE_LABELS = { today: 'Today', week: 'This Week', month: 'This Month' }

function isInRange(dateISO, range) {
  if (!dateISO) return false
  const entryDate = new Date(dateISO + 'T00:00:00')
  const now = new Date()

  if (range === 'today') {
    return entryDate.toDateString() === now.toDateString()
  }
  if (range === 'week') {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 6) // trailing 7 days, inclusive of today
    weekStart.setHours(0, 0, 0, 0)
    return entryDate >= weekStart && entryDate <= now
  }
  // month
  return entryDate.getFullYear() === now.getFullYear() && entryDate.getMonth() === now.getMonth()
}

export default function AdminFinances() {
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [entries, setEntries] = useState(INITIAL_ENTRIES)
  const [search, setSearch] = useState('')
  const [ledger, setLedger] = useState('assets')
  const [range, setRange] = useState('month')
  const [modal, setModal] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)

  const activeType = LEDGER_TO_TYPE[ledger]
  const categories = activeType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const visibleEntries = entries
    .filter(e => e.type === activeType)
    .filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    .filter(e => !categoryFilter || e.category === categoryFilter)
    .filter(e => isInRange(e.dateISO, range))

  const total = visibleEntries.reduce((sum, e) => sum + e.amount, 0)
  const heroLabel = `Total ${activeType === 'income' ? 'Income' : 'Expenses'} (${RANGE_LABELS[range]})`

  const handleLedgerChange = (key) => {
    setLedger(key)
    setCategoryFilter('')
  }

  const openAdd = () => setModal({ mode: 'add' })
  const openEdit = (record) => setModal({ mode: 'edit', record })
  const handleDelete = (id) => setEntries(e => e.filter(en => en.id !== id))

  const handleSubmit = (values) => {
    if (modal.mode === 'edit') {
      setEntries(e => e.map(en => en.id === modal.record.id ? { ...en, ...values } : en))
    } else {
      setEntries(e => [...e, { id: Date.now(), ...values }])
    }
  }

  return (
    <div className="no-shell">
      <AdminSidebar role="admin" onSelectPatient={setSelectedPatient} />

      <div className="no-main">
        <div className="admin-card">
          <div className="af-hero">
            <p className="af-hero-amount">${total.toLocaleString()}.00</p>
            <p className="af-hero-label">{heroLabel}</p>
          </div>

          <div className="admin-content-header" style={{ marginTop: 20, marginBottom: 24 }}>
            <input className="admin-search" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} />

            <div className="admin-filter-wrap">
              <button className="admin-filter-pill" onClick={() => setCategoryMenuOpen(o => !o)}>
                {categoryFilter || 'All Categories'} {ICONS.chevronDown}
              </button>

              {categoryMenuOpen && (
                <>
                  <div className="admin-filter-backdrop" onClick={() => setCategoryMenuOpen(false)} />
                  <div className="admin-filter-menu">
                    <button
                      className={`admin-filter-menu-item${categoryFilter === '' ? ' active' : ''}`}
                      onClick={() => { setCategoryFilter(''); setCategoryMenuOpen(false) }}>
                      All Categories
                    </button>
                    {categories.map(c => (
                      <button key={c}
                        className={`admin-filter-menu-item${categoryFilter === c ? ' active' : ''}`}
                        onClick={() => { setCategoryFilter(c); setCategoryMenuOpen(false) }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button className="admin-add-btn" onClick={openAdd}>
              {ICONS.plus} Add {activeType === 'income' ? 'Income' : 'Expense'}
            </button>
          </div>

          <div className="admin-table-head" style={{ gridTemplateColumns: '1fr 1.5fr 1.2fr 1.2fr 1fr' }}>
            <span>Date</span><span>Name</span><span>Amount</span><span>Category</span><span></span>
          </div>

          {visibleEntries.map(e => (
            <div key={e.id} className="admin-table-row" style={{ gridTemplateColumns: '1fr 1.5fr 1.2fr 1.2fr 1fr' }}>
              <span>{e.date}</span>
              <span style={{ fontWeight: 700 }}>{e.name}</span>
              <span><b>${e.amount.toFixed(2)}</b> USD</span>
              <span><span className="admin-pill green">{e.category}</span></span>
              <div className="admin-row-actions">
                <button className="admin-icon-action edit" aria-label="Edit" onClick={() => openEdit(e)}>{ICONS.pencil}</button>
                <button className="admin-icon-action delete" aria-label="Delete" onClick={() => handleDelete(e.id)}>{ICONS.trash}</button>
              </div>
            </div>
          ))}

          {visibleEntries.length === 0 && (
            <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '24px 0' }}>
              No {activeType === 'income' ? 'income' : 'expense'} entries for {RANGE_LABELS[range].toLowerCase()}
              {categoryFilter ? ` in "${categoryFilter}"` : ''}.
            </p>
          )}
        </div>

        <div className="af-floating-bar">
          <div className="admin-segment on-dark">
            {[['expenses', 'Expenses'], ['assets', 'Assets']].map(([key, label]) => (
              <button key={key} className={`admin-segment-btn${ledger === key ? ' active' : ''}`} onClick={() => handleLedgerChange(key)}>{label}</button>
            ))}
          </div>

          <div className="admin-segment on-dark">
            {[['today', 'Today'], ['week', 'This Week'], ['month', 'This Month']].map(([key, label]) => (
              <button key={key} className={`admin-segment-btn${range === key ? ' active' : ''}`} onClick={() => setRange(key)}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {modal && (
        <FinanceFormModal
          type={activeType}
          mode={modal.mode}
          initial={modal.record}
          onSubmit={handleSubmit}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}