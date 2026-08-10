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

function getPathFromPublicUrl(publicUrl) {
  try {
    const marker = `/storage/v1/object/public/${BUCKET}/`
    const idx = publicUrl.indexOf(marker)
    if (idx !== -1) {
      return publicUrl.slice(idx + marker.length)
    }
    // Fallback: try to find the bucket segment
    const bucketIdx = publicUrl.indexOf(`/${BUCKET}/`)
    if (bucketIdx !== -1) {
      return publicUrl.slice(bucketIdx + (`/${BUCKET}/`).length)
    }
  } catch (e) {
    // ignore
  }
  return null
}

export async function getEventById(eventId) {
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, title, description, event_date, location, created_at')
    .eq('id', eventId)
    .single()

  if (eventError) {
    throw eventError
  }

  const { data: images, error: imagesError } = await supabase
    .from('event_images')
    .select('id, event_id, image_url, display_order, created_at')
    .eq('event_id', eventId)
    .order('display_order', { ascending: true })

  if (imagesError) {
    throw imagesError
  }

  return {
    ...event,
    images: images || [],
  }
}

export async function updateEvent(eventId, eventDetails) {
  const { title, description, event_date, location } = eventDetails
  const { data, error } = await supabase
    .from('events')
    .update({ title, description, event_date, location })
    .eq('id', eventId)
    .select('id')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function deleteEventImageRecord(imageId) {
  const { error } = await supabase.from('event_images').delete().eq('id', imageId)
  if (error) throw error
  return true
}

export async function deleteStorageFileByPublicUrl(publicUrl) {
  const filePath = getPathFromPublicUrl(publicUrl)
  if (!filePath) {
    throw new Error('Unable to determine storage file path from URL')
  }

  const { error } = await supabase.storage.from(BUCKET).remove([filePath])
  if (error) throw error
  return true
}

export async function updateEventWithImages({
  eventId,
  eventDetails,
  keptExistingImages = [], // array of existing image objects { id, image_url }
  newImages = [], // array of File
  cover, // { type: 'existing'|'new', id or index }
  imagesToDelete = [], // array of existing image ids to delete
  onProgress,
}) {
  onProgress?.('Saving event details...')
  await updateEvent(eventId, eventDetails)

  // 1) Upload new images first
  const uploadedNew = []
  for (let i = 0; i < newImages.length; i += 1) {
    const file = newImages[i]
    onProgress?.(`Uploading new image ${i + 1} of ${newImages.length}...`)
    const upload = await uploadEventImage({ eventId, file, prefix: 'gallery' })
    uploadedNew.push({ publicUrl: upload.publicUrl, path: upload.path })
  }

  // 2) Delete removed image records and storage files
  if (imagesToDelete.length > 0) {
    onProgress?.('Removing deleted images...')
    // Fetch the records to get their URLs
    const { data: toDeleteRows, error: fetchErr } = await supabase
      .from('event_images')
      .select('id, image_url')
      .in('id', imagesToDelete)

    if (fetchErr) {
      throw fetchErr
    }

    // Delete DB records in a batch
    const { error: delErr } = await supabase.from('event_images').delete().in('id', imagesToDelete)
    if (delErr) throw delErr

    // Delete storage files for each removed image (best-effort)
    for (const row of toDeleteRows || []) {
      try {
        const filePath = getPathFromPublicUrl(row.image_url)
        if (filePath) {
          await supabase.storage.from(BUCKET).remove([filePath])
        }
      } catch (e) {
        // Log but don't fail the entire update for storage delete errors
        // eslint-disable-next-line no-console
        console.warn('Failed to delete storage file for', row.image_url, e.message)
      }
    }
  }

  // 3) Build final ordered list: cover first, then other kept existing images (preserve order), then new images
  const finalList = []

  const keptMap = new Map(keptExistingImages.map((im) => [im.id, im]))

  if (cover) {
    if (cover.type === 'existing') {
      const ev = keptExistingImages.find((e) => e.id === cover.id)
      if (ev) finalList.push({ type: 'existing', id: ev.id, image_url: ev.image_url })
    } else if (cover.type === 'new') {
      const up = uploadedNew[cover.index]
      if (up) finalList.push({ type: 'new', image_url: up.publicUrl })
    }
  }

  // add other existing kept images (excluding cover)
  for (const ex of keptExistingImages) {
    if (finalList.find((f) => f.type === 'existing' && f.id === ex.id)) continue
    finalList.push({ type: 'existing', id: ex.id, image_url: ex.image_url })
  }

  // add other new images (exclude cover if already added)
  for (let i = 0; i < uploadedNew.length; i += 1) {
    const up = uploadedNew[i]
    if (cover && cover.type === 'new' && cover.index === i) continue
    finalList.push({ type: 'new', image_url: up.publicUrl })
  }

  // 4) Apply display_order updates/inserts
  onProgress?.('Updating image order...')
  for (let idx = 0; idx < finalList.length; idx += 1) {
    const item = finalList[idx]
    if (item.type === 'existing') {
      const { error } = await supabase
        .from('event_images')
        .update({ display_order: idx })
        .eq('id', item.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('event_images').insert({
        event_id: eventId,
        image_url: item.image_url,
        display_order: idx,
      })
      if (error) throw error
    }
  }

  onProgress?.('Event updated successfully.')
  return true
}

export async function deleteEventAndImages(eventId, onProgress) {
  onProgress?.('Gathering event images...')

  const { data: images, error: imagesError } = await supabase
    .from('event_images')
    .select('id, image_url')
    .eq('event_id', eventId)

  if (imagesError) {
    throw imagesError
  }

  // Derive file paths
  const paths = []
  for (const img of images || []) {
    const p = getPathFromPublicUrl(img.image_url)
    if (!p) {
      throw new Error('Unable to determine storage path for one or more images; aborting deletion.')
    }
    paths.push(p)
  }

  if (paths.length > 0) {
    onProgress?.('Deleting files from storage...')
    const { error: removeErr } = await supabase.storage.from(BUCKET).remove(paths)
    if (removeErr) {
      throw removeErr
    }
  }

  onProgress?.('Deleting event record...')
  const { error: delErr } = await supabase.from('events').delete().eq('id', eventId)
  if (delErr) {
    throw delErr
  }

  onProgress?.('Event deleted.')
  return true
}
