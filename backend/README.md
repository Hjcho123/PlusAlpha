# PlusAlpha Backend

A comprehensive backend API for PlusAlpha - an AI-powered trading platform that serves as a Yahoo Finance alternative with enhanced AI insights.

## 🚀 Features

- **Real-time Stock Data**: Live stock prices, historical data, and market information
- **AI-Powered Insights**: Trading signals, market analysis, risk assessment, and portfolio optimization
- **User Management**: Authentication, user profiles, and portfolio management
- **WebSocket Support**: Real-time price updates and AI insights
- **Portfolio Tracking**: Comprehensive portfolio management with performance analytics
- **Risk Management**: AI-powered risk assessment and recommendations
- **Technical Analysis**: Advanced technical indicators and market analysis

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis for performance optimization
- **Authentication**: JWT-based authentication
- **AI Integration**: OpenAI GPT-4 for market analysis
- **Stock Data**: Yahoo Finance API integration
- **WebSocket**: Real-time communication
- **Security**: Helmet, CORS, rate limiting

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- Redis (v6 or higher) - Optional but recommended
- OpenAI API key

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd backend
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your variables:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/plusalpha
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# External APIs
OPENAI_API_KEY=your-openai-api-key
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-api-key
FINNHUB_API_KEY=your-finnhub-api-key

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

### 3. Start the Server

```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build
npm start
```

The server will start on `http://localhost:3001`

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "riskTolerance": "moderate"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### Stock Data Endpoints

#### Get Stock Data
```http
GET /api/stocks/AAPL
```

#### Search Stocks
```http
GET /api/stocks/search?query=apple&limit=10
```

#### Get Market Overview
```http
GET /api/stocks/overview
```

#### Get Historical Data
```http
GET /api/stocks/AAPL/market-data?period=1mo&interval=1day
```

### AI Endpoints

#### Generate Trading Signal
```http
POST /api/ai/trading-signal/AAPL
Authorization: Bearer <token>
```

#### Generate Market Analysis
```http
POST /api/ai/market-analysis
Content-Type: application/json

{
  "symbols": ["AAPL", "GOOGL", "MSFT"]
}
```

#### Risk Assessment
```http
POST /api/ai/risk-assessment
Authorization: Bearer <token>
```

#### Portfolio Optimization
```http
POST /api/ai/portfolio-optimization
Authorization: Bearer <token>
```

### Portfolio Endpoints

#### Get Portfolio
```http
GET /api/portfolio
Authorization: Bearer <token>
```

#### Add Holding
```http
POST /api/portfolio/holdings
Authorization: Bearer <token>
Content-Type: application/json

{
  "symbol": "AAPL",
  "quantity": 10,
  "averagePrice": 150.00
}
```

#### Update Portfolio Prices
```http
POST /api/portfolio/refresh
Authorization: Bearer <token>
```

## 🔌 WebSocket API

Connect to WebSocket for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');

// Subscribe to stock updates
ws.send(JSON.stringify({
  type: 'subscribe',
  symbols: ['AAPL', 'GOOGL', 'MSFT']
}));

// Handle incoming messages
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

### WebSocket Message Types

- `price_update`: Real-time stock price updates
- `insight_update`: New AI insights
- `alert`: Market alerts and notifications
- `connection`: Connection confirmation
- `subscription_confirmed`: Subscription confirmation

## 🗄️ Database Schema

### User Model
```typescript
{
  email: string;
  password: string; // hashed
  firstName: string;
  lastName: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentGoals: string[];
  portfolio: ObjectId;
  preferences: UserPreferences;
}
```

### Portfolio Model
```typescript
{
  userId: ObjectId;
  holdings: Holding[];
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
}
```

### AI Insight Model
```typescript
{
  userId?: ObjectId;
  symbol: string;
  type: 'trading_signal' | 'market_analysis' | 'risk_assessment' | 'portfolio_optimization';
  title: string;
  description: string;
  confidence: number; // 0-100
  action: 'buy' | 'sell' | 'hold' | 'watch';
  reasoning: string[];
  technicalIndicators: TechnicalIndicator[];
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevents API abuse
- **CORS Protection**: Configurable cross-origin requests
- **Input Validation**: Joi schema validation
- **Helmet Security**: Security headers
- **Error Handling**: Comprehensive error management

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📊 Monitoring

### Health Check
```http
GET /health
```

### WebSocket Stats
```http
GET /api/ws/stats
```

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://your-production-mongodb-uri
REDIS_URL=redis://your-production-redis-uri
JWT_SECRET=your-production-jwt-secret
OPENAI_API_KEY=your-openai-api-key
FRONTEND_URL=https://your-frontend-domain.com
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the API documentation
- Review the health check endpoint

## 🔮 Roadmap

- [ ] Advanced technical indicators
- [ ] Options trading data
- [ ] Cryptocurrency support
- [ ] Social sentiment analysis
- [ ] Advanced portfolio analytics
- [ ] Mobile app API support
- [ ] Real-time news integration
- [ ] Advanced AI models integration
