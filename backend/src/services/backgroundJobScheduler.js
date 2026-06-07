const cron = require('node-cron')
const db = require('../config/db')
const { notifyUser, recordBestDealNotification } = require('./notificationService')
const { analyzeDeals } = require('./aiAnalyzeService')
const { getUserAiSettings } = require('./userAiSettingsService')

const lastSeenDeals = new Map()

/**
 * Starts the background job that checks active alerts every five minutes.
 */
const startBackgroundJobs = () => {
  console.log('Initializing Background Job Scheduler...')

  cron.schedule('*/5 * * * *', async () => {
    console.log('[Scheduler] Checking for active alerts...')
    try {
      const userSettingsCache = new Map()

      const [activeAlerts] = await db.execute(
        'SELECT id, user_id, filter_name, query_params, alert_interval, notify_method, notify_target, last_checked_at FROM saved_filters WHERE is_alert_active = true'
      )

      const now = new Date()

      for (const alert of activeAlerts) {
        const lastChecked = alert.last_checked_at ? new Date(alert.last_checked_at) : new Date(0)
        const diffMs = now - lastChecked
        const diffMins = Math.floor(diffMs / 60000)

        const checkInterval = Math.max(30, alert.alert_interval || 30)

        if (diffMins >= checkInterval) {
          console.log(`[Scheduler] Executing alert check for filter ID: ${alert.id} (${alert.filter_name})`)

          let urlParams = ''
          let searchPath = 'v1/search/car'
          try {
            const parsedParams = typeof alert.query_params === 'string' ? JSON.parse(alert.query_params) : alert.query_params
            const sp = new URLSearchParams()

            if (parsedParams.searchType === 'everything') {
              searchPath = 'v1/search'
            }

            for (const [key, value] of Object.entries(parsedParams)) {
              if (key === 'searchType') {
                continue
              }

              if (value !== undefined && value !== null && value !== '') {
                sp.append(key, value)
              }
            }

            if (searchPath === 'v1/search' && !sp.has('page')) {
              sp.append('page', '1')
            }

            urlParams = sp.toString()
          } catch {
            console.error(`[Scheduler Error] Invalid query_params for filter ID: ${alert.id}`)
            continue
          }

          const targetUrl = `https://blocket-api.se/${searchPath}?${urlParams}`
          const response = await fetch(targetUrl)

          if (response.ok) {
            const data = await response.json()
            
            if (data.docs && data.docs.length > 0) {
              let userAiSettings = userSettingsCache.get(alert.user_id)
              if (!userAiSettings) {
                userAiSettings = await getUserAiSettings(alert.user_id)
                userSettingsCache.set(alert.user_id, userAiSettings)
              }

              const selectedApiKey = userAiSettings.provider === 'openai' && userAiSettings.useCustomApiKey
                ? userAiSettings.apiKey
                : null

              const selectedModel = userAiSettings.provider === 'openai'
                ? userAiSettings.model
                : null

              
              const bestUrl = await analyzeDeals(data.docs, selectedApiKey, selectedModel)
              
              let bestDeal = data.docs.find(d => d.canonical_url === bestUrl)
              
              if (!bestDeal) {
                console.log('[Scheduler] AI returned an unmatched URL or bugged out, falling back to top result. Return payload:', bestUrl)
                bestDeal = data.docs[0] 
              }

              const previousDealId = lastSeenDeals.get(alert.id)

              if (bestDeal.id !== previousDealId) {
                console.log(`[Scheduler] New best deal identified by AI for alert ${alert.id}! Notifying user...`)

                const bestDealImageUrl = bestDeal.image?.url || bestDeal.image_url || null
                
                const message = `New best deal found for your filter "${alert.filter_name}": **${bestDeal.heading}** for ${bestDeal.price?.amount?.toLocaleString() || 'Unknown'} ${bestDeal.price?.price_unit || ':)'}`
                
                await notifyUser(
                  alert.notify_method,
                  alert.notify_target,
                  message,
                  bestDeal.canonical_url || targetUrl,
                  { imageUrl: bestDealImageUrl }
                )

                await recordBestDealNotification(bestDeal, alert.filter_name)

                lastSeenDeals.set(alert.id, bestDeal.id)
              } else {
                console.log(`[Scheduler] No new deal for alert ${alert.id}. Last seen was ${previousDealId}.`)
              }
            } else {
              console.log(`[Scheduler] No results found for alert ${alert.id} during this check.`)
            }
          } else {
            console.error(`[Scheduler Error] Failed to fetch data. Status: ${response.status}`)
          }

          await db.execute(
            'UPDATE saved_filters SET last_checked_at = ? WHERE id = ?',
            [now, alert.id]
          )
        }
      }
    } catch (error) {
      console.error('[Scheduler Error] Failed to process alerts:', error)
    }
  })
}

module.exports = {
  startBackgroundJobs,
}