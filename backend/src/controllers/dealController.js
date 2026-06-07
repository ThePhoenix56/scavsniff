/**
 * Builds a Blocket search URL from a path and query parameters.
 *
 * @param {string} searchPath Blocket search path to append to the base URL.
 * @param {object} queryParams Query parameters to include in the URL.
 * @returns {string} The fully composed Blocket search URL.
 */
const buildSearchUrl = (searchPath, queryParams) => {
  const baseUrl = `https://blocket-api.se/${searchPath}`
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(queryParams)) {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value)
    }
  }

  return `${baseUrl}?${params.toString()}`
}

/**
 * Fetches deals from Blocket for a given search path.
 *
 * @param {object} req Express request containing query parameters.
 * @param {object} res Express response used to return the fetched deals.
 * @param {string} searchPath Blocket search path to call.
 * @param {string[]} allowedParams Query parameter names allowed through to Blocket.
 * @returns {Promise<void>} Resolves when the response has been sent.
 */
const fetchDealsFromBlocket = async (req, res, searchPath, allowedParams) => {
  try {
    const queryParams = {}

    for (const key of allowedParams) {
      if (req.query[key] !== undefined && req.query[key] !== null && req.query[key] !== '') {
        queryParams[key] = req.query[key]
      }
    }

    if (!queryParams.query) {
      return res.status(400).json({ message: 'query is required' })
    }

    if (!queryParams.page) {
      queryParams.page = 1
    }

    const fetchUrl = buildSearchUrl(searchPath, queryParams)
    const response = await fetch(fetchUrl)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Blocket API returned status ${response.status}: ${errorText}`)
    }

    const data = await response.json()

    return res.status(200).json({
      message: 'Deals fetched successfully',
      docs: data.docs || [],
    })
  } catch (error) {
    console.error('Error fetching car deals:', error)
    return res.status(500).json({ message: 'Failed to fetch deals from Blocket API', error: error.message })
  }
}

/**
 * Fetches car search results from Blocket.
 *
 * @param {object} req Express request containing query parameters.
 * @param {object} res Express response used to return the fetched deals.
 * @returns {Promise<void>} Resolves when the response has been sent.
 */
const fetchCarDeals = async (req, res) => {
  return fetchDealsFromBlocket(req, res, 'v1/search/car', [
    'query',
    'page',
    'sort_order',
    'locations',
    'models',
    'price_from',
    'price_to',
    'year_from',
    'year_to',
    'milage_from',
    'milage_to',
    'colors',
    'transmissions',
    'wheel_drive',
    'horsepower_from',
    'horsepower_to',
  ])
}

/**
 * Fetches non-car search results from Blocket.
 *
 * @param {object} req Express request containing query parameters.
 * @param {object} res Express response used to return the fetched deals.
 * @returns {Promise<void>} Resolves when the response has been sent.
 */
const fetchEverythingDeals = async (req, res) => {
  return fetchDealsFromBlocket(req, res, 'v1/search', [
    'query',
    'page',
    'sort_order',
    'locations',
    'category',
    'sub_category',
    'price_from',
    'price_to',
  ])
}

module.exports = {
  fetchCarDeals,
  fetchEverythingDeals,
}
