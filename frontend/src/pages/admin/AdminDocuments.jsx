import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'

import '../styles/Documents.css'

export default function Documents() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadData, setUploadData] = useState({
    name: '',
    type: '',
    category: '',
    description: ''
  })

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const docsQuery = query(
        collection(db, 'documents'),
        orderBy('uploadedAt', 'desc')
      )
      const snapshot = await getDocs(docsQuery)
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setDocuments(docs)
      setLoading(false)
    } catch (error) {
      console.error('Error loading documents:', error)
      setLoading(false)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    
    try {
      const data = {
        ...uploadData,
        uploadedAt: Timestamp.now(),
        uploadedBy: 'Admin',
        size: '2.5 MB', // Mock size
        url: '#' // Mock URL - replace with actual upload
      }

      await addDoc(collection(db, 'documents'), data)
      alert('Document added successfully')
      setShowUploadModal(false)
      setUploadData({ name: '', type: '', category: '', description: '' })
      loadDocuments()
    } catch (error) {
      console.error('Error uploading document:', error)
      alert('Failed to upload document')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return

    try {
      await deleteDoc(doc(db, 'documents', id))
      loadDocuments()
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  const getFileIcon = (type) => {
    const icons = {
      'pdf': '📄',
      'image': '🖼️',
      'document': '📝',
      'spreadsheet': '📊',
      'report': '📈'
    }
    return icons[type] || '📎'
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const filteredDocuments = documents.filter(d => {
    const matchesType = filterType === 'all' || d.type === filterType
    const matchesSearch = d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const categories = ['Patient Records', 'Lab Results', 'Prescriptions', 'Reports', 'Forms', 'Other']
  const types = ['pdf', 'image', 'document', 'spreadsheet', 'report']

  if (loading) {
    return (
      <div className="documents loading">
        <div className="loading-spinner">Loading documents...</div>
      </div>
    )
  }

  return (
    <div className="documents">
      <div className="documents-container">
        <header className="documents-header">
          <div>
            <h1 className="documents-title">Documents</h1>
            <p className="documents-subtitle">{documents.length} total documents</p>
          </div>

          <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
            + Upload Document
          </button>
        </header>

        <div className="filters-bar">
          <div className="search-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <select 
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            {types.map(type => (
              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
            ))}
          </select>
        </div>

        {filteredDocuments.length > 0 ? (
          <div className="documents-grid">
            {filteredDocuments.map(document => (
              <div key={document.id} className="document-card">
                <div className="document-icon">
                  {getFileIcon(document.type)}
                </div>

                <div className="document-content">
                  <h3 className="document-name">{document.name}</h3>
                  <p className="document-category">{document.category}</p>
                  {document.description && (
                    <p className="document-description">{document.description}</p>
                  )}
                  
                  <div className="document-meta">
                    <span className="meta-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      {formatDate(document.uploadedAt)}
                    </span>
                    <span className="meta-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      {document.uploadedBy}
                    </span>
                    {document.size && (
                      <span className="meta-item">{document.size}</span>
                    )}
                  </div>
                </div>

                <div className="document-actions">
                  <button className="btn-icon" title="Download">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                  <button className="btn-icon delete" onClick={() => handleDelete(document.id)} title="Delete">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <div className="empty-text">No documents found</div>
            <div className="empty-subtext">
              {searchQuery || filterType !== 'all'
                ? 'Try adjusting your filters'
                : 'Upload your first document to get started'}
            </div>
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Upload Document</h2>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>×</button>
            </div>

            <form onSubmit={handleUpload}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Document Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={uploadData.name}
                      onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Type *</label>
                    <select
                      className="form-select"
                      value={uploadData.type}
                      onChange={(e) => setUploadData({ ...uploadData, type: e.target.value })}
                      required
                    >
                      <option value="">Select type</option>
                      {types.map(type => (
                        <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-select"
                      value={uploadData.category}
                      onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-textarea"
                      value={uploadData.description}
                      onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                      rows={3}
                      placeholder="Optional description..."
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">File Upload</label>
                    <div className="file-upload-area">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <p>Click to upload or drag and drop</p>
                      <p className="file-upload-hint">PDF, DOC, JPG, PNG up to 10MB</p>
                      <input type="file" className="file-input" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Upload Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}