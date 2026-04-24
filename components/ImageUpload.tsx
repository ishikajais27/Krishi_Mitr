'use client'
import { useState } from 'react'

interface Props {
  onResult: (result: string) => void
  apiEndpoint: string
  label: string
}

export default function ImageUpload({ onResult, apiEndpoint, label }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setError(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch(apiEndpoint, { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Server error')

      const data = await res.json()
      onResult(data.result)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <label className="upload__zone">
        <div className="upload__icon">📷</div>
        <p className="upload__label">
          <strong>Click to upload</strong> or drag and drop
          <br />
          <span style={{ fontSize: '0.8rem' }}>JPG, PNG, WEBP supported</span>
        </p>
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
      </label>

      {preview && (
        <img src={preview} alt="Preview" className="upload__preview" />
      )}

      {loading && <div className="loading">Analyzing your photo…</div>}

      {error && <p style={{ color: 'red', fontSize: '0.875rem' }}>{error}</p>}
    </div>
  )
}
