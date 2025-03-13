# AI-Powered Knowledge Base Bot

## Overview

This project implements an AI-powered knowledge base chatbot that integrates with Chatwoot for customer support. The system uses ChromaDB for vector storage and retrieval, OpenAI for embeddings and response generation, and provides a seamless integration with Chatwoot chat platform.

## Features

- Vector-based semantic search for finding relevant information
- AI-powered response generation using OpenAI
- Integration with Chatwoot chat platform
- Automatic document vectorization and storage
- Extensible architecture for adding new features

## Prerequisites

- Node.js v16 or higher
- ChromaDB
- Chatwoot account with API access
- OpenAI API key

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```
# Server
PORT=3000
NODE_ENV=development

# ChromaDB
CHROMA_DB_URL=http://localhost:8000
CHROMA_COLLECTION_NAME=faq_base
VECTOR_LENGTH=1536

# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002
OPENAI_COMPLETION_MODEL=o3-mini
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7

# Chatwoot
CHATWOOT_API_TOKEN=your_chatwoot_api_token
CHATWOOT_BASE_URL=https://app.chatwoot.com

# Logging
LOG_LEVEL=info

# App customization (optional)
PRIMARY_COLOR=#3B82F6
LOGO_URL=your_logo_url
```

## Usage

### Starting the Server

```bash
npm start
```

### Adding Documents to Knowledge Base

To add documents to the knowledge base, place your text files in a directory and use the provided script:

```bash
node src/services/dbClient.js
```

You can modify the script to specify which files to process.

### Setting Up Chatwoot Integration

1. In your Chatwoot account, go to Settings > Integrations > Webhook
2. Add a new webhook with the URL of your server: `https://your-server.com/api/webhook`
3. Make sure your server is publicly accessible

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/webhook` - Chatwoot webhook endpoint
- `GET /api/webhook` - Test webhook functionality

## Development

### Adding New Features

The modular architecture makes it easy to add new features:

1. Create new service modules in the appropriate directory
2. Add new routes in the `routes` directory
3. Implement new controllers as needed

### Testing

Currently, manual testing is supported. Automated tests will be added in future versions.

## Deployment

For production deployment:

1. Set `NODE_ENV=production` in your `.env` file
2. Consider using a process manager like PM2:

```bash
npm install -g pm2
pm2 start src/server.js --name ai-knowledge-bot
```

## Acknowledgements

- OpenAI for providing the AI capabilities
- ChromaDB for the vector database
- Chatwoot for the chat platform
