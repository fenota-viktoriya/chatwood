# [PROJECT_NAME]

## Overview

This project implements an AI-powered knowledge base chatbot that integrates with Chatwoot for customer support. The system uses ChromaDB for vector storage and retrieval, OpenAI for embeddings and response generation, and provides a seamless integration with Chatwoot chat platform.

## Features

- Vector-based semantic search for finding relevant information
- AI-powered response generation using OpenAI
- Integration with Chatwoot chat platform
- Automatic document vectorization and storage
- Extensible architecture for adding new features
- Support for Ukrainian language responses

## Prerequisites

- Node.js v16 or higher
- ChromaDB
- Chatwoot account with API access
- OpenAI API key

## Installation

1. Clone the repository:

```bash
git clone https://github.com/[ORGANIZATION]/[REPOSITORY_NAME].git
cd [REPOSITORY_NAME]
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

For development with auto-reload:

```bash
npm run dev
```

### Adding Documents to Knowledge Base

To add documents to the knowledge base, place your text files in a directory and use the provided script:

```bash
npm run add-document
```

You can modify the script to specify which files to process.

### Setting Up Chatwoot Integration

1. In your Chatwoot account, go to Settings > Integrations > Webhook
2. Add a new webhook with the URL of your server: `https://your-server.com/api/webhook`
3. Make sure your server is publicly accessible

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /api/webhook` - Chatwoot webhook endpoint
- `GET /api/webhook` - Test webhook functionality
- `POST /api/test-reply` - Test endpoint to send a direct message to a conversation

## Cloud Deployment Guide

### 1. Prepare the Environment

#### Required Services

- Virtual Private Server (VPS) with Ubuntu/Debian on any cloud provider (AWS, DigitalOcean, Azure, GCP)
- Access to ChromaDB (or deploy it on the same server)
- OpenAI account with API key
- Chatwoot account with API token

#### Install Dependencies

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt-get install -y git

# Clone the repository
git clone https://github.com/[ORGANIZATION]/[REPOSITORY_NAME].git
cd [REPOSITORY_NAME]

# Install dependencies
npm install
```

### 2. Configure Environment Variables

Create a `.env` file with all necessary variables:

```
# Server
PORT=3000
NODE_ENV=production

# ChromaDB
CHROMA_DB_URL=http://localhost:8000  # or your ChromaDB server address
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
```

### 3. Deploy ChromaDB (if not using a remote server)

ChromaDB can be deployed using Docker:

```bash
# Install Docker
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# Create docker-compose.yml for ChromaDB
cat > docker-compose.yml << 'EOL'
version: '3.9'
services:
  chromadb:
    image: ghcr.io/chroma-core/chroma:latest
    volumes:
      - ./chromadb-data:/chroma/chroma
    ports:
      - "8000:8000"
EOL

# Start ChromaDB
docker-compose up -d
```

### 4. Use PM2 to Manage the Process

PM2 is a process manager for Node.js that ensures your application runs as a daemon:

```bash
# Install PM2
sudo npm install -g pm2

# Start with PM2
pm2 start src/server.js --name [SERVICE_NAME]

# Auto-start on server reboot
pm2 startup
pm2 save
```

### 5. Configure NGINX as a Reverse Proxy

```bash
# Install NGINX
sudo apt-get install -y nginx

# Configure NGINX
sudo cat > /etc/nginx/sites-available/[SERVICE_NAME] << 'EOL'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOL

# Activate configuration
sudo ln -s /etc/nginx/sites-available/[SERVICE_NAME] /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Set Up SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com
```

### 7. Set Up Chatwoot Integration

1. Log in to your Chatwoot account
2. Go to Settings > Integrations > Webhook
3. Add a new webhook with your server URL: `https://your-domain.com/api/webhook`
4. Save the settings

### 8. Add Documents to the Knowledge Base

To add documents to the knowledge base, use the script:

```bash
# Save documents in a directory, for example, docs/
npm run add-document
```

The `src/services/dbClient.js` script will use these documents for vectorization and storage in ChromaDB.

### 9. Monitoring and Logging

```bash
# View logs
pm2 logs [SERVICE_NAME]

# Monitor status
pm2 monit
```

### 10. Update the Application

```bash
# Stop the server
pm2 stop [SERVICE_NAME]

# Update the code
git pull origin main

# Restart the server
pm2 restart [SERVICE_NAME]
```

## Implementation Details

1. **Chatwoot Webhook Processing**: The `chatwootWebhook.js` controller handles messages from Chatwoot, initiates knowledge base searches, and generates responses via OpenAI.

2. **Vector Search**: The system uses ChromaDB to store and search document vector embeddings, enabling the discovery of the most relevant information for user queries.

3. **AI Responses**: The service uses OpenAI to generate context-aware responses based on information found in the knowledge base.

4. **Language Support**: The system is configured to provide responses in Ukrainian (according to the prompt in OpenAI configuration).

5. **Error Handling**: A comprehensive error handling and logging system is implemented to enhance operational stability.

## Development

### Adding New Features

The modular architecture makes it easy to add new features:

1. Create new service modules in the appropriate directory
2. Add new routes in the `routes` directory
3. Implement new controllers as needed

### Testing

Currently, manual testing is supported. Automated tests will be added in future versions.

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

Check application logs for more detailed error information:

```bash
pm2 logs [SERVICE_NAME]
```

## Security Considerations

1. Always deploy behind a firewall and use SSL
2. Store API keys securely in environment variables
3. Implement rate limiting for API endpoints
4. Use secure connections for all external services

## Acknowledgements

- OpenAI for providing the AI capabilities
- ChromaDB for the vector database
- Chatwoot for the chat platform

## License

MIT
# chat-test
