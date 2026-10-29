import { useState, useEffect } from 'react'
import './FormModal.css'

export const INCOME_CATEGORIES = ['Consultation', 'Procedure', 'Lab Work', 'Imaging', 'Insurance Payout']
export const EXPENSE_CATEGORIES = ['Payroll', 'Supplies', 'Utilities', 'Equipment', 'Maintenance']

export default function FinanceFormModal({ type, mode = 'add', initial = null, onSubmit, onClose }) {
  const empty = { date: '', name: '', amount: '', category: '' }
  const [values, setValues] = useState({ ...empty, ...initial })

  useEffect(() => { setValues({ ...empty, ...initial }) }, [initial])

  const setField = (key, val) => setValues(v => ({ ...v, [key]: val }))
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
  const typeLabel = type === 'expense' ? 'Expense' : 'Income'

  const handleSave = () => {
    if (!values.name.trim() || !values.amount || !values.dateISO) return
    const displayDate = new Date(values.dateISO + 'T00:00:00')
      .toLocaleDateString('en-US', { month: 'long', day: '2-digit' })
    onSubmit?.({ ...values, amount: parseFloat(values.amount) || 0, type, date: displayDate })
    onClose()
  }

  return (
    <div className="no-modal-backdrop" onClick={onClose}>
      <div className="no-modal-card" onClick={e => e.stopPropagation()}>
        <div className="no-modal-head">
          <h2 className="no-modal-title">{mode === 'edit' ? 'Edit' : 'Add'} {typeLabel}</h2>
          <button className="no-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="no-modal-body">
          <div className="no-form-row">
            <div className="no-form-field half">
              <label className="no-form-label">Date</label>
              <input className="no-form-input" type="date"
                value={values.dateISO || ''} onChange={e => setField('dateISO', e.target.value)} />
            </div>

            <div className="no-form-field half">
              <label className="no-form-label">Amount (USD)</label>
              <input className="no-form-input" type="number" placeholder="0.00"
                value={values.amount} onChange={e => setField('amount', e.target.value)} />
            </div>
          </div>

          <div className="no-form-field">
            <label className="no-form-label">Name</label>
            <input className="no-form-input" placeholder="Patient or payee name"
              value={values.name} onChange={e => setField('name', e.target.value)} />
          </div>

          <div className="no-form-field">
            <label className="no-form-label">Category</label>
            <div className="no-form-select-wrap">
              <select className="no-form-input no-form-select"
                value={values.category} onChange={e => setField('category', e.target.value)}>
                <option value="">Select a category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="no-modal-footer">
          <button className="no-modal-btn cancel" onClick={onClose}>Cancel</button>
          <button className="no-modal-btn save" onClick={handleSave}>{mode === 'edit' ? 'Save changes' : `Add ${typeLabel}`}</button>
        </div>
      </div>
    </div>
  )
}