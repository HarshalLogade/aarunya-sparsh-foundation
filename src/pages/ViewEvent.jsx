import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getEventById, deleteEventAndImages } from '../services/eventService'

export default function ViewEvent() {
  const { user, loading, isAdmin } = useAuth()
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loadingEvent, setLoadingEvent] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [status, setStatus] = useState('')
  const [lightboxSrc, setLightboxSrc] = useState(null)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true })
      return
    }

    if (!loading && user && !isAdmin) {
      navigate('/', { replace: true })
    }
  }, [loading, user, isAdmin, navigate])

  useEffect(() => {
    const load = async () => {
      setLoadingEvent(true)
      setError('')
      try {
        const ev = await getEventById(eventId)
        setEvent(ev)
      } catch (e) {
        setError(e.message || 'Event not found')
      } finally {
        setLoadingEvent(false)
      }
    }
    load()
  }, [eventId])

  const handleEdit = () => {
    // Navigate to Admin and request opening edit form for this event
    navigate('/admin', { state: { editEventId: eventId } })
  }

  const handleDelete = async () => {
    if (deleting) return
    const ok = window.confirm('Are you sure you want to delete this event? This will permanently delete the event and all its images.')
    if (!ok) return
    setDeleting(true)
    setStatus('Deleting event...')
    try {
      await deleteEventAndImages(eventId, (m) => setStatus(m))
      setStatus('Deleted successfully')
      // After short delay navigate back to admin events
      navigate('/admin')
    } catch (err) {
      setError(err.message || 'Failed to delete event')
    } finally {
      setDeleting(false)
      setStatus('')
    }
  }

  if (loadingEvent) return <div className="admin-loading">Loading event...</div>
  if (error) return <div className="admin-field-error">{error}</div>
  if (!event) return <div className="admin-placeholder">Event not found.</div>

  if (!loading && !isAdmin) {
    return null
  }

  return (
    <div className="admin-shell">
      <main className="admin-main admin-main--full">
        <header className="admin-header">
          <div className="view-event-header">
            <div className="view-event-header-left">
              <button className="admin-secondary-btn" onClick={() => navigate('/admin')}>Back to Events</button>
              <div className="view-event-title">
                <h1>{event.title}</h1>
                <div className="view-event-meta">
                  <span>{event.event_date ? new Date(event.event_date).toLocaleDateString() : 'Date TBD'}</span>
                  <span className="dot">•</span>
                  <span>{event.location || 'Location TBD'}</span>
                </div>
              </div>
            </div>
            <div className="view-event-header-actions">
              <button className="admin-primary-btn" onClick={handleEdit}>Edit Event</button>
              <button className="admin-secondary-btn" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete Event'}</button>
            </div>
          </div>
        </header>

        <section className="admin-content admin-panel view-event-panel">
          <div className="view-event-grid">
            <div className="view-event-main">
              <div className="view-event-cover">
                {event.images && event.images.length > 0 ? (
                  <img src={event.images[0].image_url} alt="cover" onClick={() => setLightboxSrc(event.images[0].image_url)} />
                ) : (
                  <div className="admin-placeholder">No cover image</div>
                )}
              </div>
              <div className="view-event-description">
                <h3>Description</h3>
                <p>{event.description || 'No description provided.'}</p>
              </div>
            </div>

            <aside className="view-event-side">
              <div className="event-info-card">
                <h4>Event Information</h4>
                <dl>
                  <dt>Date</dt>
                  <dd>{event.event_date ? new Date(event.event_date).toLocaleDateString() : 'Date TBD'}</dd>
                  <dt>Location</dt>
                  <dd>{event.location || 'Location TBD'}</dd>
                  <dt>Gallery Images</dt>
                  <dd>{event.images ? event.images.length : 0}</dd>
                </dl>
              </div>
            </aside>
          </div>

          <div style={{ marginTop: 28 }}>
            <h3>Gallery</h3>
            {event.images && event.images.length > 0 ? (
              <div className="admin-gallery-grid view-event-gallery">
                {event.images.map((img) => (
                  <button key={img.id} type="button" className="admin-gallery-grid-item" onClick={() => setLightboxSrc(img.image_url)}>
                    <img src={img.image_url} alt="gallery" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="admin-placeholder">No gallery images</div>
            )}
          </div>

          {lightboxSrc && (
            <div className="admin-lightbox" onClick={() => setLightboxSrc(null)}>
              <img src={lightboxSrc} alt="preview" />
            </div>
          )}

          {status && <p className="admin-status">{status}</p>}
          {error && <p className="admin-field-error">{error}</p>}
        </section>
      </main>
    </div>
  )
}
