import { useState } from 'react'
import AdminSidebar from './AdminSidebar.jsx'
import './AdminSidebar.css'

const ICONS = {
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>,
  pencil: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevronDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

// NOTE: mock data, paginated client-side — swap for a real patient directory/service.
const ALL_PATIENTS = [
  { id: 1, name: 'Amanda Brown', email: 'amanda.brown@gmail.com', number: '+1 (876) 123-5678', lastAppt: 'April 06, 2026', lastApptTime: '8:50 AM' },
  { id: 2, name: 'Baxter Evans', email: 'baxter.evans@gmail.com', number: '+1 (876) 123-5678', lastAppt: 'April 06, 2026', lastApptTime: '8:50 AM' },
  { id: 3, name: 'Becky Brown', email: 'becky.brown@gmail.com', number: '+1 (876) 123-5678', lastAppt: 'April 06, 2026', lastApptTime: '8:50 AM' },
  { id: 4, name: 'Bruce France', email: 'bruce.france@gmail.com', number: '+1 (876) 123-5678', lastAppt: 'April 06, 2026', lastApptTime: '8:50 AM' },
  { id: 5, name: 'Amanda Terrence', email: 'amanda.terrence@gmail.com', number: '+1 (876) 123-5678', lastAppt: 'April 06, 2026', lastApptTime: '8:50 AM' },
]

const PAGE_SIZE = 5

export default function AdminPatients() {
  const [patients, setPatients] = useState(ALL_PATIENTS)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  const handleDelete = (id) => setPatients(p => p.filter(pt => pt.id !== id))

  return (
    <div className="admin-shell">
      <AdminSidebar />

      <div className="admin-card">
        <div className="admin-content-header" style={{ marginBottom: 24 }}>
          <input className="admin-search" placeholder="Search" value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
          <button className="admin-filter-pill">All Patients {ICONS.chevronDown}</button>
          <button className="admin-add-btn">{ICONS.plus} Add new patients</button>
        </div>

        <div className="admin-table-head" style={{ gridTemplateColumns: '1.2fr 1.6fr 1.4fr 1.4fr 1fr' }}>
          <span>Name</span><span>Email</span><span>Number</span><span>Last Appointment</span><span></span>
        </div>

        {pageRows.map(p => (
          <div key={p.id} className="admin-table-row" style={{ gridTemplateColumns: '1.2fr 1.6fr 1.4fr 1.4fr 1fr' }}>
            <span style={{ fontWeight: 700 }}>{p.name}</span>
            <span>{p.email}</span>
            <span>{p.number}</span>
            <div>
              <p style={{ margin: 0 }}>{p.lastAppt}</p>
              <span className="admin-pill green" style={{ marginTop: 4, display: 'inline-block' }}>{p.lastApptTime}</span>
            </div>
            <div className="admin-row-actions">
              <button className="admin-icon-action edit" aria-label="Edit">{ICONS.pencil}</button>
              <button className="admin-icon-action delete" aria-label="Delete" onClick={() => handleDelete(p.id)}>{ICONS.trash}</button>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-pagination">
        {Array.from({ length: pageCount }, (_, i) => (
          <button key={i} className={`admin-pagination-dot${page === i ? ' active' : ''}`} onClick={() => setPage(i)}>{i + 1}</button>
        ))}
      </div>
    </div>
  )
}