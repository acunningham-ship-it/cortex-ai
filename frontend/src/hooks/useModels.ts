import { useState, useEffect } from 'react'
import { getModels, Model } from '../lib/api'

export function useModels() {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getModels()
        setModels(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch models')
        setModels([])
      } finally {
        setLoading(false)
      }
    }

    fetchModels()
  }, [])

  return { models, loading, error }
}
