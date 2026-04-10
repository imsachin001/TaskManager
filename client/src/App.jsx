import { useEffect, useMemo, useState } from 'react'
import './App.css'

const emptyForm = {
  title: '',
  content: '',
}

function App() {
  const [notes, setNotes] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [activeNote, setActiveNote] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const formTitle = useMemo(() => {
    return editingId ? 'Edit note' : 'New note'
  }, [editingId])

  useEffect(() => {
    const loadNotes = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/notes')
        if (!response.ok) {
          throw new Error('Failed to load notes')
        }
        const data = await response.json()
        setNotes(data)
        setError('')
      } catch (loadError) {
        setError('Could not load notes. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadNotes()
  }, [])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedTitle = form.title.trim()

    if (!trimmedTitle) {
      setError('Title is required to save a note.')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch(`/api/notes${editingId ? `/${editingId}` : ''}`,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: trimmedTitle,
            content: form.content,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to save note')
      }

      const savedNote = await response.json()

      setNotes((prevNotes) => {
        if (editingId) {
          return prevNotes.map((note) =>
            note._id === savedNote._id ? savedNote : note
          )
        }
        return [savedNote, ...prevNotes]
      })

      setError('')
      resetForm()
    } catch (saveError) {
      setError('Could not save note. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (note) => {
    setEditingId(note._id)
    setForm({
      title: note.title || '',
      content: note.content || '',
    })
    setError('')
  }

  const handleOpen = (note) => {
    setActiveNote(note)
  }

  const handleClose = () => {
    setActiveNote(null)
  }

  const handleDelete = async (noteId) => {
    const confirmDelete = window.confirm('Delete this note? This cannot be undone.')
    if (!confirmDelete) {
      return
    }

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete note')
      }

      setNotes((prevNotes) => prevNotes.filter((note) => note._id !== noteId))
      if (editingId === noteId) {
        resetForm()
      }
    } catch (deleteError) {
      setError('Could not delete note. Please try again.')
    }
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            🗒️
          </span>
          <span>Notes Manager</span>
        </div>
        <div className="nav-center">Notes</div>
      </nav>

      <main className="layout">
        <section className="editor">
          <header className="section-header">
            <div>
              <p className="eyebrow">Write</p>
              <h1>{formTitle}</h1>
            </div>
            <p className="subtle">Capture ideas with a title and quick notes.</p>
          </header>

          <form className="note-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Title</span>
              <input
                type="text"
                name="title"
                placeholder="Give this note a title"
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
              />
            </label>

            <label className="field">
              <span>Note</span>
              <textarea
                name="content"
                placeholder="Write your note here..."
                rows={7}
                value={form.content}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, content: event.target.value }))
                }
              />
            </label>

            {error ? <p className="form-error">{error}</p> : null}

            <div className="form-actions">
              <button className="primary" type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingId ? 'Update note' : 'Save note'}
              </button>
              {editingId ? (
                <button className="ghost" type="button" onClick={resetForm}>
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="notes">
          <header className="section-header">
            <div>
              <p className="eyebrow">Collection</p>
              <h2>Notes</h2>
            </div>
            <p className="subtle">
              {isLoading ? 'Loading notes...' : `${notes.length} total`}
            </p>
          </header>

          <div className="note-grid">
            {isLoading ? (
              <div className="empty">Loading your notes...</div>
            ) : notes.length === 0 ? (
              <div className="empty">No notes yet. Start with a new one.</div>
            ) : (
              notes.map((note) => (
                <article
                  key={note._id}
                  className="note-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpen(note)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleOpen(note)
                    }
                  }}
                >
                  <div className="note-card-header">
                    <h3>{note.title}</h3>
                    <div className="card-actions">
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Edit note"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleEdit(note)
                        }}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4 16.25V20h3.75L18.81 8.94l-3.75-3.75L4 16.25zm16.71-9.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.99-1.66z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="icon-button danger"
                        aria-label="Delete note"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleDelete(note._id)
                        }}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M6 7h12l-1 14H7L6 7zm4-3h4l1 2H9l1-2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="note-body" aria-label={`Open note ${note.title}`}>
                    <p className="note-content">
                      {note.content ? note.content : 'No details yet.'}
                    </p>
                  </div>
                  <div className="note-meta">
                    Updated {new Date(note.updatedAt).toLocaleString()}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>

      {activeNote ? (
        <div className="modal" role="dialog" aria-modal="true">
          <button className="modal-backdrop" type="button" onClick={handleClose}>
            <span className="sr-only">Close note</span>
          </button>
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Reading</p>
                <h2>{activeNote.title}</h2>
              </div>
              <button className="icon-button" type="button" onClick={handleClose}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.71 2.89 18.3 9.17 12 2.89 5.71 4.3 4.29l6.29 6.3 6.3-6.3z" />
                </svg>
                <span className="sr-only">Close</span>
              </button>
            </div>
            <div className="modal-content">
              <p>{activeNote.content || 'No details yet.'}</p>
            </div>
            <div className="modal-meta">
              Updated {new Date(activeNote.updatedAt).toLocaleString()}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default App
