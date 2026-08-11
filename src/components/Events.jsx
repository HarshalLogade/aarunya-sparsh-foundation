import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEvents } from '../services/eventService'

const EVENTS_PER_PAGE = 6

function formatEventDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function truncateText(text, maxLength = 140) {
  if (!text) return ''
  return text.length <= maxLength ? text : `${text.slice(0, maxLength).trim()}...`
}

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true

    async function loadEvents() {
      try {
        setLoading(true)
        setError('')
        console.log('Public Events: fetching...')
        const data = await getEvents()
        console.log('Public Events: fetched events', data)
        if (mounted) {
          setEvents(data)
          setPage(0)
        }
      } catch (err) {
        console.error('Public Events: fetch error', err)
        if (mounted) {
          setError(err.message || 'Failed to load events.')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadEvents()

    return () => {
      mounted = false
    }
  }, [])

  const totalPages = Math.max(1, Math.ceil(events.length / EVENTS_PER_PAGE))
  const visibleEvents = events.slice(page * EVENTS_PER_PAGE, page * EVENTS_PER_PAGE + EVENTS_PER_PAGE)

  useEffect(() => {
    if (!loading && events.length > 0) {
      const section = document.getElementById('events')
      section?.querySelectorAll('.event-card.animate-in').forEach((el) => el.classList.add('visible'))
    }
  }, [loading, events.length])

  return (
    <section className="events-section" id="events">
      <div className="events-inner">
        <div className="events-header animate-in">
          <span className="section-label">Upcoming</span>
          <h2 className="section-title">
            Public <span className="cursive">Events</span>
          </h2>
          <p className="section-desc">
            Explore our latest events and join the initiatives that are shaping stronger communities.
          </p>
        </div>

        {loading ? (
          <div className="events-state events-loading">Loading events...</div>
        ) : error ? (
          <div className="events-state events-error">{error}</div>
        ) : events.length === 0 ? (
          <div className="events-state events-empty">
            No events are available at the moment. Please check back soon.
          </div>
        ) : (
          <>
            <div className="events-grid">
              {visibleEvents.map((event) => (
                <article key={event.id} className="event-card animate-in">
                  {event.coverImage ? (
                    <img
                      className="event-card-image"
                      src={event.coverImage}
                      alt={event.title}
                    />
                  ) : (
                    <div className="event-card-image event-card-image--placeholder">
                      <span>No image available</span>
                    </div>
                  )}
                  <div className="event-card-body">
                    <h3>{event.title}</h3>
                    <div className="event-card-meta">
                      <span>{formatEventDate(event.event_date)}</span>
                      <span>{event.location}</span>
                    </div>
                    <p>{truncateText(event.description, 120)}</p>
                    <button
                      className="btn-primary event-card-button"
                      type="button"
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      View Event
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {events.length > EVENTS_PER_PAGE && (
              <div className="events-pagination">
                <button
                  className="events-pagination-button"
                  type="button"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                  disabled={page === 0}
                >
                  ← Previous
                </button>
                <span className="events-pagination-label">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  className="events-pagination-button"
                  type="button"
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
