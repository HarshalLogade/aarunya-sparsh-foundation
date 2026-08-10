import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createEventWithImages, getEvents, deleteEventAndImages } from '../services/eventService'
import EditEventForm from './EditEventForm'

const sections = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'events', label: 'Events / Gallery' },
]

const MAX_FILE_SIZE = 5 * 1024 * 1024
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export default function Admin() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [formVisible, setFormVisible] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    location: '',
  })
  const [coverFile, setCoverFile] = useState(null)
  const [galleryFiles, setGalleryFiles] = useState([])
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [editingEventId, setEditingEventId] = useState(null)
  const [deletingEventId, setDeletingEventId] = useState(null)
  const location = useLocation()
  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventsError, setEventsError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true })
    }
  }, [loading, user, navigate])

  useEffect(() => {
    // Fetch events when entering the events section
    const fetchEvents = async () => {
      if (activeSection !== 'events') return
      setEventsLoading(true)
      setEventsError('')
      try {
        const data = await getEvents()
        setEvents(data)
      } catch (err) {
        setEventsError(err.message || 'Failed to load events.')
      } finally {
        setEventsLoading(false)
      }
    }

    fetchEvents()
  }, [activeSection])

  useEffect(() => {
    // If navigated with state to edit a specific event, open the edit form
    if (location?.state?.editEventId) {
      setActiveSection('events')
      setFormVisible(false)
      setEditingEventId(location.state.editEventId)
      // Clear the state to avoid reopening on subsequent navigations
      // Note: cannot directly clear location.state; this is fine for typical navigation flows
    }
  }, [location])

  const handleLogout = async () => {
    const { error } = await logout()
    if (!error) {
      navigate('/login', { replace: true })
    }
  }

  const resetForm = () => {
    setFormData({ title: '', description: '', eventDate: '', location: '' })
    setCoverFile(null)
    setGalleryFiles([])
    setErrors({})
    setStatus('')
  }

  const validateFile = (file) => {
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      return 'Only JPEG, PNG, WEBP, or GIF images are allowed.'
    }

    if (file.size > MAX_FILE_SIZE) {
      return 'Each image must be 5MB or smaller.'
    }

    return ''
  }

  const validateForm = () => {
    const nextErrors = {}

    if (!formData.title.trim()) {
      nextErrors.title = 'Event title is required.'
    }

    if (!coverFile) {
      nextErrors.coverImage = 'Cover image is required.'
    }

    if (coverFile) {
      const coverError = validateFile(coverFile)
      if (coverError) {
        nextErrors.coverImage = coverError
      }
    }

    galleryFiles.forEach((file, index) => {
      const fileError = validateFile(file)
      if (fileError) {
        nextErrors.galleryImages = `Gallery image ${index + 1}: ${fileError}`
      }
    })

    return nextErrors
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null
    setCoverFile(file)
    setErrors((prev) => ({ ...prev, coverImage: undefined, submit: undefined }))
  }

  const handleGalleryChange = (event) => {
    const files = Array.from(event.target.files ?? [])
    setGalleryFiles((prev) => [...prev, ...files])
    setErrors((prev) => ({ ...prev, galleryImages: undefined, submit: undefined }))
  }

  const handleRemoveGalleryFile = (indexToRemove) => {
    setGalleryFiles((prev) => prev.filter((_file, index) => index !== indexToRemove))
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined, submit: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) {
      return
    }

    const nextErrors = validateForm()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setSubmitting(true)
    setErrors({})
    setStatus('Preparing to save event...')
    setSuccessMessage('')

    try {
      await createEventWithImages({
        eventDetails: {
          title: formData.title.trim(),
          description: formData.description.trim(),
          event_date: formData.eventDate || null,
          location: formData.location.trim(),
        },
        coverImage: coverFile,
        galleryImages: galleryFiles,
        onProgress: (message) => setStatus(message),
      })

      setSuccessMessage('Event created successfully.')
      resetForm()
      setFormVisible(false)
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to create the event. Please try again.' })
    } finally {
      setSubmitting(false)
      setStatus('')
    }
  }

  if (loading) {
    return <div className="admin-loading">Checking authentication...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">Aarunya Sparsh Foundation</div>
        <div className="admin-sidebar-label">Admin menu</div>
        <nav className="admin-nav" aria-label="Admin navigation">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={section.id === activeSection ? 'admin-nav-item active' : 'admin-nav-item'}
              onClick={() => {
                setActiveSection(section.id)
                setFormVisible(false)
                setErrors({})
                setStatus('')
                setSuccessMessage('')
              }}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <span className="admin-badge">Admin</span>
            <h1>Aarunya Sparsh Foundation</h1>
            <p className="admin-subtitle">Manage your site from a protected dashboard.</p>
          </div>

          <div className="admin-header-actions">
            <span className="admin-user">{user.email}</span>
            <button className="admin-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <section className="admin-content">
          {activeSection === 'dashboard' ? (
            <div className="admin-panel">
              <h2 className="admin-panel-title">Welcome back</h2>
              <p>
                You are signed in as <strong>{user.email}</strong>. This dashboard is
                protected and ready for upcoming event and gallery management features.
              </p>
              <div className="admin-overview-cards">
                <div className="admin-card">
                  <h3>Overview</h3>
                  <p>Monitor admin activity, and add content when the next features are ready.</p>
                </div>
                <div className="admin-card">
                  <h3>Next step</h3>
                  <p>Events / Gallery management is available in the events section.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="admin-panel admin-events-panel">
              <div className="admin-events-header">
                <div>
                  <h2 className="admin-panel-title">Events / Gallery</h2>
                  <p>Use this section to add new events and upload gallery images.</p>
                </div>
                {!formVisible && (
                  <button
                    type="button"
                    className="admin-primary-btn"
                    onClick={() => {
                      setFormVisible(true)
                      setErrors({})
                      setStatus('')
                      setSuccessMessage('')
                    }}
                  >
                    Add Event
                  </button>
                )}
              </div>

              {formVisible ? (
                <form className="admin-event-form" onSubmit={handleSubmit}>
                  <div className="admin-form-grid">
                    <div className="admin-form-group">
                      <label className="admin-form-label" htmlFor="title">
                        Event Title <span className="admin-required">*</span>
                      </label>
                      <input
                        id="title"
                        name="title"
                        type="text"
                        value={formData.title}
                        onChange={handleChange}
                        className="admin-form-control"
                        disabled={submitting}
                      />
                      {errors.title && <p className="admin-field-error">{errors.title}</p>}
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label" htmlFor="eventDate">
                        Event Date
                      </label>
                      <input
                        id="eventDate"
                        name="eventDate"
                        type="date"
                        value={formData.eventDate}
                        onChange={handleChange}
                        className="admin-form-control"
                        disabled={submitting}
                      />
                    </div>

                    <div className="admin-form-group admin-form-full">
                      <label className="admin-form-label" htmlFor="description">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows="4"
                        value={formData.description}
                        onChange={handleChange}
                        className="admin-form-control admin-form-textarea"
                        disabled={submitting}
                      />
                    </div>

                    <div className="admin-form-group admin-form-full">
                      <label className="admin-form-label" htmlFor="location">
                        Location
                      </label>
                      <input
                        id="location"
                        name="location"
                        type="text"
                        value={formData.location}
                        onChange={handleChange}
                        className="admin-form-control"
                        disabled={submitting}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label" htmlFor="coverImage">
                        Cover Image <span className="admin-required">*</span>
                      </label>
                      <input
                        id="coverImage"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="admin-form-control-file"
                        disabled={submitting}
                      />
                      {coverFile && <p className="admin-file-name">{coverFile.name}</p>}
                      {errors.coverImage && <p className="admin-field-error">{errors.coverImage}</p>}
                    </div>

                    <div className="admin-form-group admin-form-full">
                      <label className="admin-form-label" htmlFor="galleryImages">
                        Additional Gallery Images
                      </label>
                      <input
                        id="galleryImages"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryChange}
                        className="admin-form-control-file"
                        disabled={submitting}
                      />
                      {galleryFiles.length > 0 && (
                        <div className="admin-gallery-preview">
                          {galleryFiles.map((file, index) => (
                            <div key={`${file.name}-${index}`} className="admin-gallery-item">
                              <span>{file.name}</span>
                              <button
                                type="button"
                                className="admin-gallery-remove"
                                onClick={() => handleRemoveGalleryFile(index)}
                                disabled={submitting}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {errors.galleryImages && <p className="admin-field-error">{errors.galleryImages}</p>}
                    </div>
                  </div>

                  {errors.submit && <p className="admin-submit-error">{errors.submit}</p>}
                  {status && <p className="admin-status">{status}</p>}
                  {successMessage && <p className="admin-success-message">{successMessage}</p>}

                  <div className="admin-form-actions">
                    <button
                      type="submit"
                      className="admin-primary-btn"
                      disabled={submitting}
                    >
                      {submitting ? 'Saving event…' : 'Save Event'}
                    </button>
                    <button
                      type="button"
                      className="admin-secondary-btn"
                      onClick={() => {
                        resetForm()
                        setFormVisible(false)
                      }}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  {eventsLoading ? (
                    <div className="admin-loading">Loading events...</div>
                  ) : eventsError ? (
                    <div className="admin-field-error">{eventsError}</div>
                  ) : events.length === 0 ? (
                    <div className="admin-placeholder">
                      <p>No events found. Use the Add Event button to create one.</p>
                    </div>
                  ) : (
                    <div>
                      {editingEventId ? (
                        <div>
                          <h3 className="admin-panel-title">Edit Event</h3>
                          <EditEventForm
                            eventId={editingEventId}
                            onCancel={() => setEditingEventId(null)}
                            onSaved={async () => {
                              setEditingEventId(null)
                              setEventsLoading(true)
                              try {
                                const data = await getEvents()
                                setEvents(data)
                              } catch (err) {
                                setEventsError(err.message || 'Failed to load events.')
                              } finally {
                                setEventsLoading(false)
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="admin-events-list">
                          {events.map((ev) => (
                            <div key={ev.id} className="admin-event-card">
                              {ev.coverImage ? (
                                <img src={ev.coverImage} alt={ev.title} className="admin-event-cover" />
                              ) : (
                                <div className="admin-event-cover admin-event-cover--placeholder">No image</div>
                              )}
                              <div className="admin-event-meta">
                                <h3 className="admin-event-title">{ev.title}</h3>
                                <p className="admin-event-desc">{ev.description ? (ev.description.length > 140 ? ev.description.slice(0, 140) + '…' : ev.description) : '—'}</p>
                                <div className="admin-event-info">
                                  <span>{ev.event_date ? new Date(ev.event_date).toLocaleDateString() : 'Date TBD'}</span>
                                  <span>•</span>
                                  <span>{ev.location || 'Location TBD'}</span>
                                </div>
                                <div className="admin-event-actions">
                                  <button className="admin-secondary-btn" onClick={() => navigate(`/admin/events/${ev.id}`)}>View</button>
                                  <button className="admin-secondary-btn" onClick={() => setEditingEventId(ev.id)}>Edit</button>
                                  <button
                                    className="admin-secondary-btn"
                                    onClick={async () => {
                                      if (deletingEventId) return
                                      const ok = window.confirm('Are you sure you want to delete this event? This will permanently delete the event and all its images.')
                                      if (!ok) return
                                      setDeletingEventId(ev.id)
                                      setStatus('Deleting event...')
                                      try {
                                        await deleteEventAndImages(ev.id, (m) => setStatus(m))
                                        setSuccessMessage('Event deleted successfully.')
                                        setEventsLoading(true)
                                        const data = await getEvents()
                                        setEvents(data)
                                      } catch (err) {
                                        setErrors({ submit: err.message || 'Failed to delete event.' })
                                      } finally {
                                        setDeletingEventId(null)
                                        setStatus('')
                                        setEventsLoading(false)
                                      }
                                    }}
                                    disabled={deletingEventId === ev.id}
                                  >
                                    {deletingEventId === ev.id ? 'Deleting…' : 'Delete'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
