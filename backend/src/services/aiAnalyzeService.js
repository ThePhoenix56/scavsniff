const { OpenAI } = require('openai')

const SYSTEM_PROMPT = "Here's a few car models. You will be given the price, year, mileage, etc, and you will determine if the price is fair. Make sure it's also not absurdly low - for example, if the car costs 1 SEK, that's an unrealistic price. So the price has to be realistic and very fair. After you've analyzed all of the car models, I want you to tell me which of these cars you think is best. You should ONLY reply with the car's canonical URL, nothing else."

/**
 * Uses the chosen AI to analyze the car deals and choose the best one
 *
 * @param {object[]} carDocs Blocket deals to analyze.
 * @param {string|null} userApiKey Optional user-provided API key.
 * @param {string|null} userModel Optional model override.
 * @returns {Promise<string|null>} The URL of the best deal, or null if analysis fails.
 */
const analyzeDeals = async (carDocs, userApiKey = null, userModel = null) => {
  // If the user hasn't provided an API key in settings, it falls back to the default website ai api key
  const apiKey = userApiKey || process.env.OPENAI_API_KEY
    
  // Default model if none specified by end user
  const model = userModel || 'gpt-5.4-mini'

  if (!apiKey) {
    console.error('[AI Analysis Error] No OpenAI API key configured.')
    return null
  }

  const openai = new OpenAI({ apiKey })

  const carsData = carDocs.map(c => ({
    Heading: c.heading,
    Price: c.price?.amount,
    Currency: c.price?.price_unit,
    Mileage: c.mileage,
    Year: c.year,
    Series: c.series,
    Fuel: c.fuel,
    Canonical_URL: c.canonical_url,
  }))

  const promptMessage = `${SYSTEM_PROMPT}\n\nData:\n${JSON.stringify(carsData, null, 2)}`

  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'user', content: promptMessage },
      ],
      temperature: 0.1,
    })

    return response.choices[0].message.content.trim()
  } catch (e) {
    console.error('[AI Analysis Error] Open AI processing failed:', e.message)
    return null
  }
}

module.exports = { analyzeDeals }