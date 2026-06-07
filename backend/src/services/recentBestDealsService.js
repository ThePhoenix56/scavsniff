const db = require('../config/db')

let tableEnsured = false

/**
 * Creates the recent best deals table if it is missing in the database.
 *
 * @returns {Promise<void>} Resolves when the table has been ensured.
 */
const ensureRecentBestDealsTable = async () => {
  if (tableEnsured) return

  await db.execute(
    `CREATE TABLE IF NOT EXISTS recent_best_deals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      listing_id VARCHAR(80) NOT NULL,
      title VARCHAR(255) NOT NULL,
      canonical_url VARCHAR(500) NOT NULL,
      image_url VARCHAR(500) NULL,
      price_amount DECIMAL(12,2) NULL,
      price_unit VARCHAR(32) NULL,
      found_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      source_filter VARCHAR(255) NULL
    )`
  )

  tableEnsured = true
}

/**
 * Stores a best deal in the recent deals feed.
 *
 * @param {object} deal Best deal payload to store.
 * @param {string} deal.listingId Stable listing identifier.
 * @param {string} deal.title Listing title.
 * @param {string} deal.canonicalUrl Canonical listing URL.
 * @param {string|null} deal.imageUrl Listing image URL.
 * @param {number|string|null} deal.priceAmount Listing price amount.
 * @param {string|null} deal.priceUnit Currency or unit label.
 * @param {string|null} deal.sourceFilter Source filter name.
 * @returns {Promise<void>} Resolves when the record has been stored.
 */
const recordRecentBestDeal = async (deal) => {
  const { listingId, title, canonicalUrl, imageUrl, priceAmount, priceUnit, sourceFilter } = deal

  await ensureRecentBestDealsTable()

  await db.execute(
    `INSERT INTO recent_best_deals
      (listing_id, title, canonical_url, image_url, price_amount, price_unit, source_filter)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [listingId, title, canonicalUrl, imageUrl, priceAmount ?? null, priceUnit ?? null, sourceFilter ?? null]
  )
}

/**
 * Returns the newest best deals.
 *
 * @param {number|string} limit Maximum number of rows to fetch.
 * @returns {Promise<object[]>} The recent best deals.
 */
const getRecentBestDeals = async (limit = 3) => {
  await ensureRecentBestDealsTable()

  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, parseInt(limit, 10)) : 3
  const [rows] = await db.execute(
    `SELECT listing_id, title, canonical_url, image_url, price_amount, price_unit, found_at, source_filter
     FROM recent_best_deals
     ORDER BY found_at DESC, id DESC
     LIMIT ${safeLimit}`
  )

  return rows.map((row) => ({
    listingId: row.listing_id,
    title: row.title,
    canonicalUrl: row.canonical_url,
    imageUrl: row.image_url,
    priceAmount: row.price_amount,
    priceUnit: row.price_unit,
    foundAt: row.found_at,
    sourceFilter: row.source_filter,
  }))
}

module.exports = {
  recordRecentBestDeal,
  getRecentBestDeals,
  ensureRecentBestDealsTable,
}
