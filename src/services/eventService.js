import { supabase } from '../lib/supabase'

const BUCKET = 'event-images'

function generateUniqueFileName(prefix, originalName) {
  const extension = originalName?.split('.').pop() || 'jpg'
  const uniquePart = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return `${prefix}-${uniquePart}.${extension}`
}

export async function createEvent(eventData) {
  const { title, description, event_date, location } = eventData
  const { data, error } = await supabase
    .from('events')
    .insert({
      title,
      description,
      event_date,
      location,
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function uploadEventImage({ eventId, file, prefix }) {
  const fileName = generateUniqueFileName(prefix, file.name)
  const filePath = `events/${eventId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    throw uploadError
  }

  const { data: publicUrlData, error: urlError } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath)

  if (urlError || !publicUrlData?.publicUrl) {
    throw urlError || new Error('Unable to get public URL for uploaded image.')
  }

  return {
    path: filePath,
    publicUrl: publicUrlData.publicUrl,
  }
}

export async function saveEventImageRecord({ eventId, imageUrl, displayOrder }) {
  const { error } = await supabase.from('event_images').insert({
    event_id: eventId,
    image_url: imageUrl,
    display_order: displayOrder,
  })

  if (error) {
    throw error
  }

  return true
}

export async function createEventWithImages({ eventDetails, coverImage, galleryImages = [], onProgress }) {
  const event = await createEvent(eventDetails)
  const eventId = event.id

  onProgress?.('Saving event details...')

  const coverUpload = await uploadEventImage({
    eventId,
    file: coverImage,
    prefix: 'cover',
  })

  onProgress?.('Saving cover image...')
  await saveEventImageRecord({
    eventId,
    imageUrl: coverUpload.publicUrl,
    displayOrder: 0,
  })

  if (galleryImages.length > 0) {
    for (let index = 0; index < galleryImages.length; index += 1) {
      const imageFile = galleryImages[index]
      onProgress?.(`Uploading gallery image ${index + 1} of ${galleryImages.length}...`)

      const galleryUpload = await uploadEventImage({
        eventId,
        file: imageFile,
        prefix: 'gallery',
      })

      await saveEventImageRecord({
        eventId,
        imageUrl: galleryUpload.publicUrl,
        displayOrder: index + 1,
      })
    }
  }

  onProgress?.('Event created successfully.')
  return { eventId }
}

export async function getEvents() {
  // Fetch events ordered by event_date descending (newest first)
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title, description, event_date, location, created_at')
    .order('event_date', { ascending: false })

  if (eventsError) {
    throw eventsError
  }

  if (!events || events.length === 0) {
    return []
  }

  const eventIds = events.map((e) => e.id)

  const { data: images, error: imagesError } = await supabase
    .from('event_images')
    .select('id, event_id, image_url, display_order, created_at')
    .in('event_id', eventIds)
    .order('display_order', { ascending: true })

  if (imagesError) {
    throw imagesError
  }

  const imagesByEvent = images?.reduce((acc, img) => {
    const list = acc[img.event_id] || []
    list.push(img)
    acc[img.event_id] = list
    return acc
  }, {}) || {}

  // Attach images array and cover image (first by display_order) to each event
  return events.map((ev) => {
    const evImages = imagesByEvent[ev.id] || []
    return {
      ...ev,
      images: evImages,
      coverImage: evImages.length > 0 ? evImages[0].image_url : null,
    }
  })
}
