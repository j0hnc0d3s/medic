import { useRef, useState } from 'react'
import './RecordDetailParts.css'
import patientAvatar from '../assets/images/image1.jpeg'

export const ICONS = {
  bold: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M7 4h7a4 4 0 010 8H7V4zM7 12h8a4 4 0 010 8H7v-8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  italic: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 4h6M7 20h6M14 4L10 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  underline: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M6 4v7a6 6 0 0012 0V4M5 21h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  listBullet: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="4.5" cy="6" r="1.3" fill="currentColor"/><circle cx="4.5" cy="12" r="1.3" fill="currentColor"/><circle cx="4.5" cy="18" r="1.3" fill="currentColor"/><path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  listNumber: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><text x="0" y="8" fontSize="6" fill="currentColor">1</text><text x="0" y="14" fontSize="6" fill="currentColor">2</text><text x="0" y="20" fontSize="6" fill="currentColor">3</text></svg>,
  pencil: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  trash: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  imageStack: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

// NOTE: mock lookup — swap for a real patient directory/service once available.
const PATIENT_DIRECTORY = {
  'H. Evans':    { id: 'PAT001', gender: 'Male',   age: 25, avatar: patientAvatar },
  'M. Vincent':  { id: 'PAT002', gender: 'Female', age: 30, avatar: patientAvatar },
  'B. Thompson': { id: 'PAT003', gender: 'Male',   age: 24, avatar: patientAvatar },
  'S. Lawrence': { id: 'PAT004', gender: 'Female', age: 28, avatar: patientAvatar },
  'D. Morgan':   { id: 'PAT005', gender: 'Male',   age: 25, avatar: patientAvatar },
  'E. Gregory':  { id: 'PAT006', gender: 'Male',   age: 28, avatar: patientAvatar },
}

export function getPatientMeta(name) {
  return PATIENT_DIRECTORY[name] || { id: '—', gender: '—', age: '—', avatar: patientAvatar }
}

export function DetailHeader({ title, subtitleLabel, subtitleName, subtitleDate, tags, topRight }) {
  return (
    <div className="rd-header">
      <div>
        <h1 className="rd-title">{title}</h1>
        <p className="rd-subtitle">
          {subtitleLabel} <b>{subtitleName}</b>{subtitleDate ? ` on ${subtitleDate}` : ''}
        </p>
        {tags?.length > 0 && (
          <div className="rd-tags">
            {tags.map((t, i) => <span key={i} className="rd-tag">{t}</span>)}
          </div>
        )}
      </div>
      {topRight && <div className="rd-header-right">{topRight}</div>}
    </div>
  )
}

export function RichBody({ html, editing, onChange }) {
  const ref = useRef(null)
  return (
    <div
      ref={ref}
      className="rd-body"
      contentEditable={editing}
      suppressContentEditableWarning
      onInput={e => onChange?.(e.currentTarget.innerHTML)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export function RichToolbar({ vertical, editing, onToggleEdit, onDelete }) {
  // onMouseDown (not onClick) so the text selection survives long enough for execCommand to act on it
  const exec = (cmd) => (e) => { e.preventDefault(); document.execCommand(cmd) }

  return (
    <div className={`rd-toolbar-group${vertical ? ' vertical' : ''}`}>
      <div className="rd-toolbar-pill">
        <button className="rd-toolbar-btn" onMouseDown={exec('bold')} aria-label="Bold">{ICONS.bold}</button>
        <button className="rd-toolbar-btn" onMouseDown={exec('italic')} aria-label="Italic">{ICONS.italic}</button>
        <button className="rd-toolbar-btn" onMouseDown={exec('underline')} aria-label="Underline">{ICONS.underline}</button>
        <button className="rd-toolbar-btn" onMouseDown={exec('insertUnorderedList')} aria-label="Bullet list">{ICONS.listBullet}</button>
        <button className="rd-toolbar-btn" onMouseDown={exec('insertOrderedList')} aria-label="Numbered list">{ICONS.listNumber}</button>
      </div>

      <div className="rd-toolbar-pill">
        <button className={`rd-toolbar-btn${editing ? ' active' : ''}`} onClick={onToggleEdit} aria-label={editing ? 'Save' : 'Edit'}>{ICONS.pencil}</button>
        <button className="rd-toolbar-btn danger" onClick={onDelete} aria-label="Delete">{ICONS.trash}</button>
      </div>
    </div>
  )
}

export function PatientCard({ name }) {
  const meta = getPatientMeta(name)
  return (
    <div className="rd-card rd-patient-card">
      <div className="rd-patient-head">
        <p className="rd-patient-name">{name}</p>
        <img src={meta.avatar} className="rd-patient-av" alt="" />
      </div>
      <div className="rd-patient-tags">
        <span className="rd-tag dark">{meta.id}</span>
        <span className="rd-tag">{meta.gender}, {meta.age}</span>
      </div>
    </div>
  )
}

export function MediaCard({ title, items = [], onRemove }) {
  return (
    <div className="rd-card">
      <p className="rd-card-title">{title}</p>
      <div className="rd-media-row">
        <div className="rd-media-add">{ICONS.imageStack}</div>
        {items.map((src, i) => (
          <div key={i} className="rd-media-thumb-wrap">
            <img src={src} className="rd-media-thumb" alt="" />
            <div className="rd-media-thumb-actions">
              <button className="rd-media-thumb-btn" aria-label="Edit">{ICONS.pencil}</button>
              <button className="rd-media-thumb-btn" aria-label="Remove" onClick={() => onRemove?.(i)}>{ICONS.trash}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function KeyValueCard({ title, rows, onChange }) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="rd-card">
      <div className="rd-card-head-row">
        <p className="rd-card-title">{title}</p>
        {onChange && <button className="rd-card-edit-btn" onClick={() => setEditing(v => !v)} aria-label="Edit">{ICONS.pencil}</button>}
      </div>

      <div className="rd-kv-rows">
        {rows.map((r, i) => (
          <div key={i} className="rd-kv-row">
            <span className="rd-kv-label">{r.label}</span>
            {editing ? (
              <input className="rd-kv-input" value={r.value} onChange={e => onChange?.(i, { ...r, value: e.target.value })} />
            ) : (
              <span className="rd-kv-value">
                <b>{r.value}</b>
                {r.sub && <span className="rd-kv-sub">{r.sub}</span>}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ListCard({ title, items, onChange }) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="rd-card">
      <div className="rd-card-head-row">
        <p className="rd-card-title">{title}</p>
        {onChange && <button className="rd-card-edit-btn" onClick={() => setEditing(v => !v)} aria-label="Edit">{ICONS.pencil}</button>}
      </div>

      <div className="rd-list-rows">
        {items.map((it, i) => (
          <div key={i} className="rd-list-row">
            <div className="rd-list-left">
              {editing ? (
                <>
                  <input className="rd-kv-input sm" value={it.name} onChange={e => onChange?.(i, { ...it, name: e.target.value })} />
                  <input className="rd-kv-input sm" value={it.sub} onChange={e => onChange?.(i, { ...it, sub: e.target.value })} />
                </>
              ) : (
                <>
                  <p className="rd-list-name">{it.name}</p>
                  <p className="rd-list-sub">{it.sub}</p>
                </>
              )}
            </div>
            <div className="rd-list-right">
              {editing ? (
                <>
                  <input className="rd-kv-input sm right" value={it.value} onChange={e => onChange?.(i, { ...it, value: e.target.value })} />
                  <input className="rd-kv-input sm right" value={it.valueSub} onChange={e => onChange?.(i, { ...it, valueSub: e.target.value })} />
                </>
              ) : (
                <>
                  <p className="rd-list-value">{it.value}</p>
                  <p className="rd-list-valuesub">{it.valueSub}</p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function NotesCard({ title = 'Notes', text, onChange }) {
  const [editing, setEditing] = useState(false)
  return (
    <div className="rd-card">
      <div className="rd-card-head-row">
        <p className="rd-card-title">{title}</p>
        {onChange && <button className="rd-card-edit-btn" onClick={() => setEditing(v => !v)} aria-label="Edit">{ICONS.pencil}</button>}
      </div>
      {editing ? (
        <textarea className="rd-notes-textarea" value={text} onChange={e => onChange?.(e.target.value)} />
      ) : (
        <p className="rd-notes-text">{text}</p>
      )}
    </div>
  )
}

export function EditedByFooter({ name, date }) {
  return <p className="rd-footer-caption">Edited by <b>{name}</b> on {date}.</p>
}