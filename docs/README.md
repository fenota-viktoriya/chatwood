# AI Knowledge Base Chatbot

## Overview

This project implements an AI-powered knowledge base chatbot that integrates with Chatwoot for customer support. The system uses ChromaDB for vector storage and retrieval, OpenAI for embeddings and response generation, and provides a seamless integration with the Chatwoot chat platform.

## Features

- Vector-based semantic search for finding relevant information
- AI-powered response generation using OpenAI
- Integration with Chatwoot chat platform
- Automatic document vectorization and storage
- Extensible architecture for adding new features

## Prerequisites

- Node.js v16 or higher
- ChromaDB (can be run locally or accessed remotely)
- Chatwoot account with API access
- OpenAI API key

## Installation

1. Clone the repository:

/**\*\*\***

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory based on the `.env.default` template:

```
# Server
PORT=3000
NODE_ENV=development

# ChromaDB
CHROMA_DB_URL=http://localhost:8000
CHROMA_COLLECTION_NAME=faq_base
VECTOR_LENGTH=1536

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002
OPENAI_COMPLETION_MODEL=o3-mini
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7

# Chatwoot
CHATWOOT_API_TOKEN=your_chatwoot_api_token_here
CHATWOOT_BASE_URL=https://app.chatwoot.com

# Logging
LOG_LEVEL=info

# App customization (optional)
PRIMARY_COLOR=#3B82F6
LOGO_URL=
```

### Starting ChromaDB

If you want to run ChromaDB locally with Docker:

```bash
docker run -p 8000:8000 ghcr.io/chroma-core/chroma:latest
```

### Adding Documents to Knowledge Base

Place your knowledge base documents in the `docs/` directory, then run:

```bash
npm run add-document
```

This will process all text files, generate embeddings, and store them in ChromaDB.

### Starting the Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /api/webhook` - Chatwoot webhook endpoint
- `GET /api/webhook` - Test webhook functionality
- `POST /api/test-reply` - Test endpoint to send a direct message to a conversation

## Setting Up Chatwoot Integration

1. In your Chatwoot account, go to Settings > Integrations > Webhook
2. Add a new webhook with the URL of your server: `https://your-server.com/api/webhook`
3. Make sure your server is publicly accessible
4. Update the `.env` file with your Chatwoot API token and base URL

## Troubleshooting

### Common Issues

1. **Connection to ChromaDB fails**:

   - Verify ChromaDB is running and accessible
   - Check CHROMA_DB_URL in your .env file

2. **OpenAI API errors**:

   - Verify your API key is correct
   - Check for rate limits or quota issues

3. **Chatwoot integration not working**:
   - Ensure webhook URL is correctly configured in Chatwoot
   - Verify the API token has the necessary permissions

### Logs

Check application logs for more detailed error information. The log level can be configured in the `.env` file.

## Project Structure

- `/src` - Source code
  - `/config` - Configuration files
  - `/controllers` - Request handlers
  - `/services` - Business logic
    - `/ai` - OpenAI integration
    - `/chatwoot` - Chatwoot client
    - `/chroma` - ChromaDB operations
  - `/routes` - API routes
  - `/utils` - Utility functions
- `/docs` - Knowledge base documents
- `/middleware` - Express middleware
- `/public` - Static files
