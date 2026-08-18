import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEventById } from '../services/eventService'

function formatEventDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getIntroText(description, maxLength = 200) {
  if (!description) return 'No overview available.'
  return description.length <= maxLength ? description : `${description.slice(0, maxLength).trim()}...`
}

export default function EventDetail() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(-1)

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })

    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto'
      }
    }
  }, [eventId])

  useEffect(() => {
    let mounted = true

    async function loadEvent() {
      setLoading(true)
      setError('')
      setNotFound(false)

      try {
        const data = await getEventById(eventId)
        if (!data || !data.id) {
          setNotFound(true)
        } else if (mounted) {
          setEvent(data)
        }
      } catch (err) {
        const message = err?.message || 'Failed to load event.'
        if (message.toLowerCase().includes('no rows') || message.toLowerCase().includes('not found')) {
          setNotFound(true)
        } else if (mounted) {
          setError(message)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadEvent()

    return () => {
      mounted = false
    }
  }, [eventId])

  useEffect(() => {
    if (!event) return undefined
    const prevTitle = document.title
    const prevMeta = document.querySelector('meta[name="description"]')
    const prevDescription = prevMeta ? prevMeta.getAttribute('content') : ''

    // Set page title and meta description for SEO
    document.title = `${event.title} | Aarunya Sparsh Foundation`
    if (prevMeta) {
      const shortDesc = (event.description && event.description.length > 156) ? `${event.description.slice(0, 153).trim()}...` : (event.description || '')
      prevMeta.setAttribute('content', shortDesc)
    }

    return () => {
      document.title = prevTitle
      if (prevMeta) prevMeta.setAttribute('content', prevDescription)
    }
  }, [event])

  useEffect(() => {
    if (lightboxIndex < 0) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setLightboxIndex(-1)
      }
      if (event.key === 'ArrowRight') {
        setLightboxIndex((prev) => (eventImages.length > 0 ? (prev + 1) % eventImages.length : -1))
      }
      if (event.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          eventImages.length > 0 ? (prev - 1 + eventImages.length) % eventImages.length : -1
        )
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex])

  const eventImages = event?.images || []
  const coverImage = eventImages.length > 0 ? eventImages[0].image_url : null

  const openLightbox = (index) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(-1)
  const showNextImage = () => setLightboxIndex((prev) => (prev + 1) % eventImages.length)
  const showPrevImage = () =>
    setLightboxIndex((prev) => (prev - 1 + eventImages.length) % eventImages.length)

  const handleBack = () => navigate('/')

  if (loading) {
    return (
      <main className="event-detail-page event-detail-loading-page">
        <div className="event-detail-inner">
          <div className="event-detail-loading-bar"></div>
          <div className="event-detail-loading-hero"></div>
          <div className="event-detail-loading-block"></div>
          <div className="event-detail-loading-block"></div>
        </div>
      </main>
    )
  }

  if (notFound) {
    return (
      <main className="event-detail-page">
        <div className="event-detail-inner event-detail-empty-state">
          <span className="section-label">Event not found</span>
          <h1 className="section-title">The requested event could not be found.</h1>
          <p className="section-desc">
            The event may have been removed or the link is incorrect. Please return to the events list.
          </p>
          <button className="btn-outline" type="button" onClick={handleBack}>
            Back to Events
          </button>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="event-detail-page">
        <div className="event-detail-inner event-detail-empty-state">
          <span className="section-label">Something went wrong</span>
          <h1 className="section-title">Unable to load event</h1>
          <p className="section-desc">{error}</p>
          <button className="btn-outline" type="button" onClick={handleBack}>
            Back to Events
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="event-detail-page">
      <div className="event-detail-inner">
        <div className="event-detail-topbar">
          <button className="btn-outline btn-back" type="button" onClick={handleBack}>
            ← Back to Events
          </button>
        </div>

        <section className="event-detail-hero">
          <div className="event-detail-hero-image-wrapper">
            {coverImage ? (
              <img
                className="event-detail-hero-image"
                src={coverImage}
                alt={`Cover for ${event.title}`}
              />
            ) : (
              <div className="event-detail-hero-image-placeholder">No cover image available</div>
            )}
          </div>

          <div className="event-detail-hero-body">
            <span className="section-label">Event</span>
            <h1 className="event-detail-title">{event.title}</h1>
            <div className="event-detail-meta">
              <div>
                <strong>Date:</strong> {formatEventDate(event.event_date)}
              </div>
              <div>
                <strong>Location:</strong> {event.location || 'TBA'}
              </div>
            </div>
            <p className="event-detail-intro">{getIntroText(event.description)}</p>
          </div>
        </section>

        <section className="event-detail-section">
          <span className="section-label">About this Event</span>
          <div className="event-detail-description">
            {event.description ? event.description : 'No description available for this event.'}
          </div>
        </section>

        <section className="event-detail-section">
          <span className="section-label">Event Gallery</span>
          {eventImages.length === 0 ? (
            <div className="event-detail-empty-gallery">No images are available yet.</div>
          ) : (
            <div className="event-gallery-grid">
                {eventImages.map((image, index) => (
                <button
                  key={image.id || `${index}-${image.image_url}`}
                  className="gallery-image-card"
                  type="button"
                  onClick={() => openLightbox(index)}
                  aria-label={`Open gallery image ${index + 1}`}
                >
                  <img src={image.image_url} alt={`${event.title} gallery ${index + 1}`} loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {lightboxIndex >= 0 && eventImages[lightboxIndex] && (
        <div className="lightbox-overlay" role="dialog" aria-modal="true" aria-label="Event image viewer">
          <div className="lightbox-frame" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="lightbox-close"
              onClick={closeLightbox}
              aria-label="Close image viewer"
            >
              ×
            </button>
            <img
              className="lightbox-image"
              src={eventImages[lightboxIndex].image_url}
              alt={`${event.title} image ${lightboxIndex + 1}`}
            />
            <div className="lightbox-controls">
              <button
                type="button"
                className="lightbox-control"
                onClick={showPrevImage}
                aria-label="Previous image"
              >
                ←
              </button>
              <span className="lightbox-counter">
                {lightboxIndex + 1} / {eventImages.length}
              </span>
              <button
                type="button"
                className="lightbox-control"
                onClick={showNextImage}
                aria-label="Next image"
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
