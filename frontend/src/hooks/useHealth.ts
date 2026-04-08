import { useState, useEffect } from 'react'
import { getHealth } from '../lib/api'

export function useHealth() {
  const [isHealthy, setIsHealthy] = useState(true)

  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await getHealth()
      setIsHealthy(healthy)
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000)

    return () => clearInterval(interval)
  }, [])

  return { isHealthy }
}
