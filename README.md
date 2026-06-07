# ScavSniff

ScavSniff is a web application that allows users to search, filter and get notified about the best deals on Blocket and other marketplaces.

---

## Key Features

* **Marketplace Analyzer**: Analyzes marketplace ads (mainly from Blocket for now) and finds the best deals based on user-defined criteria and queries.
* **AI-Powered Deal Analysis**: Uses AI to analyze and evaluate ads to determine if they are good deals.
* **Automated Alert System**: Uses background scheduling to run searches at custom alert intervals defined by the user.
* **Multi-Channel Notifications**: Instantly alerts users about new deals via:
  * **Discord Webhooks**
  * **Email Notifications**
* **Modern Web Interface**: Built as a responsive frontend application to configure alerts, manage settings, and view recent deals.

---

## Repository Structure

The project is structured as a monorepo containing both the backend and frontend components:

* backend - Node.js Express server with background jobs, database integrations, and services.
* frontend - Vue 3 application built with Vite. 

---

## Getting Started

### Prerequisites

To run ScavSniff locally, you will need:
* **Node.js** (v18+ recommended)
* **MySQL Database**
* **OpenAI API Key**
* **SMTP Server** (optional, for email notifications)
* **Discord Webhook URL** (optional, for Discord notifications)
Do note you will need EITHER an SMTP server/provider or a Discord webhook URL. Both are technically optional if you have the other, but it is not optional to not have either.

---

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables. 
   You will need to provide your MySQL credentials, JWT Secret, encryption keys, OpenAI API key, and SMTP/Discord webhook configurations.

4. Start the backend server:
   ```bash
   npm run start
   ```

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build the application for production:
   ```bash
   npm run build
   ```

---

## Contributing

Contributions are welcome! If you would like to help improve ScavSniff:
You can fork the repo and make a pull request, you can also message me on Discord at @phoenix56 or email me at phoenix@phoenix56.xyz.

---

## Support

For support, please open an issue on the GitHub repository or contact me directly on Discord or email.

---

## License

This project is licensed under the **Do What The Fuck You Want To Public License (WTFPL)**.