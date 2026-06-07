// src/services/notificationService.js
const nodemailer = require('nodemailer')
const { recordRecentBestDeal } = require('./recentBestDealsService')

/**
 * Sends a Discord notification for a new deal.
 *
 * @param {string|null} webhookUrl Discord webhook URL.
 * @param {string} message Notification text to send.
 * @param {string} dealUrl Deal URL.
 * @param {string|null} imageUrl Optional image URL for the embed thumbnail.
 * @returns {Promise<void>} Resolves when the notification attempt has finished.
 */
const sendDiscordNotification = async (webhookUrl, message, dealUrl, imageUrl) => {
  if (!webhookUrl) return

  try {
    const payload = {
      content: message,
      embeds: [
        {
          title: 'New Deal Found',
          description: 'Click the link below to view it.',
          url: dealUrl,
          color: 3447003,
          ...(imageUrl ? { thumbnail: { url: imageUrl } } : {}),
        },
      ],
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error(`Discord Webhook failed with status ${response.status}`)
    }
  } catch (error) {
    console.error('Error sending Discord notification:', error)
  }
}


/**
 * Sends an email notification for a new deal.
 *
 * @param {string|null} emailAddress Recipient email address.
 * @param {string} message Notification text to send.
 * @param {string} dealUrl Deal URL.
 * @returns {Promise<void>} Resolves when the notification attempt has finished.
 */
const sendEmailNotification = async (emailAddress, message, dealUrl) => {
  if (!emailAddress) return

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: `"ScavSniff Alerts" <${process.env.SMTP_USER}>`,
      to: emailAddress,
      subject: 'New Deal Found - ScavSniff',
      text: `${message}\n\nView Deal: ${dealUrl}`,
      html: `<h3>New Deal Found</h3><p>${message}</p><p><a href="${dealUrl}">View Deal</a></p>`,
    })
  } catch (error) {
    console.error('Error sending Email notification:', error)
  }
}

/**
 * Sends a notification through the selected channel.
 *
 * @param {string} method Notification channel name.
 * @param {string|null} target Notification target for the selected channel.
 * @param {string} message Notification text to send.
 * @param {string} dealUrl Canonical deal URL.
 * @param {object} extra Optional notification metadata.
 * @returns {Promise<void>} Resolves when the notification attempt has finished.
 */
const notifyUser = async (method, target, message, dealUrl, extra = {}) => {
  if (method === 'discord') {
    await sendDiscordNotification(target, message, dealUrl, extra.imageUrl)
  } else if (method === 'email') {
    await sendEmailNotification(target, message, dealUrl)
  } else {
    console.log(`Unknown notification method: ${method} for target ${target}`)
  }
}

/**
 * Stores a notified best deal in the recent deals feed.
 *
 * @param {object} deal Deal object returned from Blocket.
 * @param {string} sourceFilter Name of the filter that found the deal.
 * @returns {Promise<void>} Resolves when the record has been stored.
 */
const recordBestDealNotification = async (deal, sourceFilter) => {
  if (!deal) return

  await recordRecentBestDeal({
    listingId: String(deal.id || deal.canonical_url || deal.canonicalUrl || Date.now()),
    title: deal.heading || deal.title || 'Untitled listing',
    canonicalUrl: deal.canonical_url || deal.canonicalUrl,
    imageUrl: deal.image?.url || deal.image_url || null,
    priceAmount: deal.price?.amount ?? null,
    priceUnit: deal.price?.price_unit ?? null,
    sourceFilter,
  })
}

module.exports = {
  notifyUser,
  recordBestDealNotification,
}