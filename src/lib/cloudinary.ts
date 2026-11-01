import { v2 as cloudinary } from 'cloudinary'

function getCloudinaryConfig() {
  if (process.env.CLOUDINARY_URL) {
    try {
      const uri = new URL(process.env.CLOUDINARY_URL)
      return {
        cloud_name: uri.hostname,
        api_key: uri.username,
        api_secret: uri.password,
        secure: true,
      }
    } catch {
      // fallback
    }
  }

  return {
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  }
}

cloudinary.config(getCloudinaryConfig())

export { cloudinary }

/**
 * Upload a base64 string or buffer/data-uri to Cloudinary.
 * Applies automatic formatting (f_auto) and quality compression (q_auto).
 */
export async function uploadToCloudinary(
  fileDataUriOrBase64: string,
  options: {
    folder: string
    publicId?: string
    tags?: string[]
  }
): Promise<{ url: string; publicId: string }> {
  let dataUri = fileDataUriOrBase64
  if (!dataUri.startsWith('data:') && !dataUri.startsWith('http')) {
    dataUri = `data:image/jpeg;base64,${dataUri}`
  }

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: options.folder,
    public_id: options.publicId,
    tags: options.tags,
    resource_type: 'image',
    format: 'webp',
    quality: 'auto:good',
  })

  return {
    url: result.secure_url,
    publicId: result.public_id,
  }
}
