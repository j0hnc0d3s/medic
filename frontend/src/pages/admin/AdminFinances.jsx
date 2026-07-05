// ─────────────────────────────────────────────────────────
// FILE : src/pages/admin/AdminFinances.jsx
// CSS  : src/pages/admin/AdminFinances.css
//
// Two halves:
//   1. P&L summary + transaction list — reads what billingService
//      has already auto-recorded (income when an appointment/lab/
//      imaging completes, expense wherever a cost is set).
//   2. Pricing editor — the actual charge/cost numbers per category.
//      Everything defaults to 0; nothing here is an invented dollar
//      figure, admin sets real numbers and billingService picks
//      them up on the next completed item.
// ─────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { financeService, pricingService } from '../../services'
import AdminSidebar from './AdminSidebar'
import './AdminFinances.css'

const fmtMoney = (n) => `$${(n || 0).toFixed(2)}`

const CATEGORY_GROUPS = [
  { key: 'appointment', label: 'Appointments', flat: false },
  { key: 'lab',         label: 'Labs',         flat: false },
  { key: 'imaging',     label: 'Imaging',      flat: true  },
]

export default function AdminFinances() {
  const [tab, setTab] = useState('overview') // 'overview' | 'pricing'

  const [summary, setSummary] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const [pricing, setPricing] = useState(null)
  const [savingPricing, setSavingPricing] = useState(false)
  const [pricingSaved, setPricingSaved] = useState(false)

  const loadFinances = async () => {
    setLoading(true)
    try {
      const [summaryRes, txRes] = await Promise.all([
        financeService.getSummary(),
        financeService.getTransactions({}),
      ])
      if (summaryRes.success) setSummary(summaryRes.summary)
      if (txRes.success) setTransactions(txRes.transactions)
    } catch (err) {
      console.error('Failed to load finances:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadPricing = async () => {
    const res = await pricingService.getPricing()
    if (res.success) setPricing(res.pricing)
  }

  useEffect(() => { loadFinances(); loadPricing() }, [])

  const setRate = (group, category, field, value) => {
    const num = parseFloat(value) || 0
    setPricingSaved(false)
    setPricing(p => {
      const next = { ...p }
      if (group === 'imaging') {
        next.imaging = { ...next.imaging, [field]: num }
      } else {
        next[group] = { ...next[group], [category]: { ...next[group][category], [field]: num } }
      }
      return next
    })
  }

  const handleSavePricing = async () => {
    setSavingPricing(true)
    try {
      const res = await pricingService.savePricing(pricing)
      if (res.success) setPricingSaved(true)
    } catch (err) {
      console.error('Failed to save pricing:', err)
    } finally {
      setSavingPricing(false)
    }
  }

  return (
    <div className="no-shell">
      <AdminSidebar />

      <div className="no-main">
        <div className="af-header">
          <h1 className="af-title">Finances</h1>
          <div className="af-tabs">
            <button className={`af-tab${tab === 'overview' ? ' active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
            <button className={`af-tab${tab === 'pricing' ? ' active' : ''}`} onClick={() => setTab('pricing')}>Pricing</button>
          </div>
        </div>

        {tab === 'overview' ? (
          loading ? (
            <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading…</p>
          ) : (
            <>
              <div className="af-stat-row">
                <div className="af-stat-card">
                  <p className="af-stat-value af-value--income">{fmtMoney(summary?.totalIncome)}</p>
                  <p className="af-stat-label">Total income</p>
                </div>
                <div className="af-stat-card">
                  <p className="af-stat-value af-value--expense">{fmtMoney(summary?.totalExpenses)}</p>
                  <p className="af-stat-label">Total expenses</p>
                </div>
                <div className="af-stat-card">
                  <p className={`af-stat-value ${(summary?.netProfit || 0) >= 0 ? 'af-value--income' : 'af-value--expense'}`}>
                    {fmtMoney(summary?.netProfit)}
                  </p>
                  <p className="af-stat-label">Net profit</p>
                </div>
              </div>

              <div className="af-breakdown-cols">
                <div className="af-breakdown-card">
                  <p className="af-breakdown-title">Income by category</p>
                  {Object.entries(summary?.incomeByCategory || {}).length === 0 ? (
                    <p className="af-empty">No income recorded yet.</p>
                  ) : Object.entries(summary.incomeByCategory).map(([cat, amt]) => (
                    <div key={cat} className="af-breakdown-row">
                      <span>{cat}</span>
                      <span className="af-value--income">{fmtMoney(amt)}</span>
                    </div>
                  ))}
                </div>

                <div className="af-breakdown-card">
                  <p className="af-breakdown-title">Expenses by category</p>
                  {Object.entries(summary?.expensesByCategory || {}).length === 0 ? (
                    <p className="af-empty">No expenses recorded yet.</p>
                  ) : Object.entries(summary.expensesByCategory).map(([cat, amt]) => (
                    <div key={cat} className="af-breakdown-row">
                      <span>{cat}</span>
                      <span className="af-value--expense">{fmtMoney(amt)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <h2 className="af-section-title">Recent transactions</h2>
              {transactions.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: 13 }}>
                  Nothing yet — transactions are created automatically when an appointment,
                  lab, or imaging record is completed, if a charge or cost is set for its category.
                </p>
              ) : (
                <div className="af-tx-list">
                  {transactions.slice(0, 30).map(t => (
                    <div key={t.id} className="af-tx-row">
                      <span className={`af-tx-type af-tx-type--${t.type}`}>{t.type === 'income' ? 'Income' : 'Expense'}</span>
                      <div className="af-tx-desc">
                        <p className="af-tx-category">{t.category}</p>
                        <p className="af-tx-detail">{t.description}</p>
                      </div>
                      <span className={t.type === 'income' ? 'af-value--income' : 'af-value--expense'}>
                        {fmtMoney(t.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )
        ) : (
          <div className="af-pricing">
            <p className="af-pricing-hint">
              Set what each category charges the patient and what it costs to deliver.
              Net profit per item = charge − cost. Everything starts at $0 — nothing here is a guessed number.
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
