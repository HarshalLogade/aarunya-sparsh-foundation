import { useEffect, useState, useRef } from 'react'
import { getEventById, updateEventWithImages } from '../services/eventService'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export default function EditEventForm({ eventId, onCancel, onSaved }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [formData, setFormData] = useState({ title: '', description: '', eventDate: '', location: '' })
  const [existingImages, setExistingImages] = useState([]) // { id, image_url, display_order, toDelete }
  const [newFiles, setNewFiles] = useState([]) // File objects
  const [cover, setCover] = useState(null) // { type:'existing'|'new', id or index }
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const ev = await getEventById(eventId)
        if (!isMounted.current) return
        setFormData({
          title: ev.title || '',
          description: ev.description || '',
          eventDate: ev.event_date ? ev.event_date.split('T')[0] : '',
          location: ev.location || '',
        })
        const imgs = (ev.images || []).map((i) => ({ ...i, toDelete: false }))
        setExistingImages(imgs)
        // set initial cover to first image if exists
        if (imgs.length > 0) {
          setCover({ type: 'existing', id: imgs[0].id })
        }
      } catch (e) {
        setError(e.message || 'Failed to load event.')
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => {
      isMounted.current = false
    }
  }, [eventId])

  const validateFile = (file) => {
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      return 'Only JPEG, PNG, WEBP, or GIF images are allowed.'
    }

    if (file.size > MAX_FILE_SIZE) {
      return 'Each image must be 5MB or smaller.'
    }

    return ''
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((p) => ({ ...p, [name]: value }))
  }

  const handleAddNewFiles = (e) => {
    const files = Array.from(e.target.files || [])
    const next = []
    for (const f of files) {
      const err = validateFile(f)
      if (err) {
        setError(err)
        return
      }
      next.push(f)
    }
    setNewFiles((p) => [...p, ...next])
    setError('')
  }

  const handleRemoveNewFile = (index) => {
    setNewFiles((p) => p.filter((_, i) => i !== index))
    // if cover was this new file, clear cover
    if (cover && cover.type === 'new' && cover.index === index) {
      setCover(null)
    }
  }

  const handleToggleExistingDelete = (id) => {
    setExistingImages((prev) => prev.map((im) => (im.id === id ? { ...im, toDelete: !im.toDelete } : im)))
    // if this was cover and now marked deleted, clear cover
    if (cover && cover.type === 'existing' && cover.id === id) {
      setCover(null)
    }
  }

  const handleSetCoverExisting = (id) => {
    setCover({ type: 'existing', id })
  }

  const handleSetCoverNew = (index) => {
    setCover({ type: 'new', index })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    if (!formData.title.trim()) {
      setError('Event title is required.')
      return
    }

    // Ensure cover is set and not deleted
    if (!cover) {
      setError('Please select a cover image.')
      return
    }

    // Build arrays
    const keptExisting = existingImages.filter((im) => !im.toDelete)
    const imagesToDelete = existingImages.filter((im) => im.toDelete).map((im) => im.id)

    // Validate new files
    for (const f of newFiles) {
      const err = validateFile(f)
      if (err) {
        setError(err)
        return
      }
    }

    setSaving(true)
    setError('')
    setStatus('Saving changes...')

    try {
      await updateEventWithImages({
        eventId,
        eventDetails: {
          title: formData.title.trim(),
          description: formData.description.trim(),
          event_date: formData.eventDate || null,
          location: formData.location.trim(),
        },
        keptExistingImages: keptExisting,
        newImages: newFiles,
        cover,
        imagesToDelete,
        onProgress: (m) => setStatus(m),
      })

      setStatus('Saved.')
      onSaved?.()
    } catch (err) {
      setError(err.message || 'Failed to save event changes.')
    } finally {
      setSaving(false)
      setStatus('')
    }
  }

  return (
    <div className="admin-event-edit">
      {loading ? (
        <div className="admin-loading">Loading event...</div>
      ) : error ? (
        <div className="admin-field-error">{error}</div>
      ) : (
        <form className="admin-event-form" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="title">Event Title <span className="admin-required">*</span></label>
              <input id="title" name="title" type="text" value={formData.title} onChange={handleChange} className="admin-form-control" disabled={saving} />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="eventDate">Event Date</label>
              <input id="eventDate" name="eventDate" type="date" value={formData.eventDate} onChange={handleChange} className="admin-form-control" disabled={saving} />
            </div>

            <div className="admin-form-group admin-form-full">
              <label className="admin-form-label" htmlFor="description">Description</label>
              <textarea id="description" name="description" rows="4" value={formData.description} onChange={handleChange} className="admin-form-control admin-form-textarea" disabled={saving} />
            </div>

            <div className="admin-form-group admin-form-full">
              <label className="admin-form-label" htmlFor="location">Location</label>
              <input id="location" name="location" type="text" value={formData.location} onChange={handleChange} className="admin-form-control" disabled={saving} />
            </div>

            <div className="admin-form-group admin-form-full">
              <label className="admin-form-label">Existing Images</label>
              {existingImages.length === 0 ? (
                <div className="admin-placeholder">No existing images.</div>
              ) : (
                <div className="admin-gallery-preview">
                  {existingImages.map((im, idx) => (
                    <div key={im.id} className="admin-gallery-item">
                      <img src={im.image_url} alt={`img-${idx}`} style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <label>
                          <input type="radio" name="cover" checked={cover?.type === 'existing' && cover?.id === im.id} onChange={() => handleSetCoverExisting(im.id)} disabled={im.toDelete || saving} /> Cover
                        </label>
                        <button type="button" className="admin-gallery-remove" onClick={() => handleToggleExistingDelete(im.id)} disabled={saving}>
                          {im.toDelete ? 'Undo' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-form-group admin-form-full">
              <label className="admin-form-label" htmlFor="newImages">Add New Images</label>
              <input id="newImages" type="file" accept="image/*" multiple onChange={handleAddNewFiles} className="admin-form-control-file" disabled={saving} />
              {newFiles.length > 0 && (
                <div className="admin-gallery-preview">
                  {newFiles.map((file, idx) => (
                    <div key={`${file.name}-${idx}`} className="admin-gallery-item">
                      <img src={URL.createObjectURL(file)} alt={`new-${idx}`} style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <label>
                          <input type="radio" name="cover_new" checked={cover?.type === 'new' && cover?.index === idx} onChange={() => handleSetCoverNew(idx)} disabled={saving} /> Cover
                        </label>
                        <button type="button" className="admin-gallery-remove" onClick={() => handleRemoveNewFile(idx)} disabled={saving}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <p className="admin-field-error">{error}</p>}
          {status && <p className="admin-status">{status}</p>}

          <div className="admin-form-actions">
            <button type="submit" className="admin-primary-btn" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            <button type="button" className="admin-secondary-btn" onClick={onCancel} disabled={saving}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}
