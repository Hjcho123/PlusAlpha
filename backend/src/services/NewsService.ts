import axios from 'axios';
import { createClient } from 'redis';

interface NewsArticle {
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  time: string;
  category: string;
  impact: 'High' | 'Medium' | 'Low';
  symbols: string[];
  imageUrl?: string;
}

export class NewsService {
  private redisClient: any;
  private finnhubKey: string;
  private newsApiKey: string;
  private readonly CACHE_TTL = 900; // 15 minutes

  constructor() {
    this.finnhubKey = process.env.FINNHUB_API_KEY || '';
    this.newsApiKey = process.env.NEWS_API_KEY || '';
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redisClient = createClient({ url: redisUrl });
      await this.redisClient.connect();
    } catch (error) {
      console.warn('Redis not available for NewsService');
      this.redisClient = null;
    }
  }

  async getFinancialNews(limit: number = 10): Promise<NewsArticle[]> {
    try {
      // Check cache first
      const cacheKey = `financial_news:${limit}`;
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch from Finnhub (primary) and NewsAPI (backup)
      const [finnhubNews, newsApiNews] = await Promise.allSettled([
        this.fetchFromFinnhub(limit),
        this.fetchFromNewsAPI(limit)
      ]);

      let articles: NewsArticle[] = [];

      if (finnhubNews.status === 'fulfilled' && finnhubNews.value.length > 0) {
        articles = finnhubNews.value;
      } else if (newsApiNews.status === 'fulfilled' && newsApiNews.value.length > 0) {
        articles = newsApiNews.value;
      }

      // If no articles from external APIs, generate mock news
      if (articles.length === 0) {
        console.warn('External news APIs failed, using fallback mock news');
        articles = this.generateMockNews(limit);
      }

      // Cache the results
      if (articles.length > 0) {
        await this.setCache(cacheKey, articles, this.CACHE_TTL);
      }

      return articles.slice(0, limit);
    } catch (error) {
      console.error('Error fetching financial news:', error);
      // Return mock news as ultimate fallback
      return this.generateMockNews(limit);
    }
  }

  async getStockNews(symbol: string, limit: number = 10): Promise<NewsArticle[]> {
    try {
      const cacheKey = `stock_news:${symbol}:${limit}`;
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await axios.get('https://finnhub.io/api/v1/company-news', {
        params: {
          symbol,
          from: this.getDateDaysAgo(7),
          to: this.getTodayDate(),
          token: this.finnhubKey
        },
        timeout: 5000
      });

      const articles = response.data.slice(0, limit).map((item: any) => ({
        title: item.headline,
        summary: item.summary,
        source: item.source,
        url: item.url,
        publishedAt: new Date(item.datetime * 1000).toISOString(),
        time: this.getRelativeTime(new Date(item.datetime * 1000)),
        category: this.categorizeBySymbol(symbol),
        impact: this.calculateImpact(item),
        symbols: [symbol],
        imageUrl: item.image
      }));

      await this.setCache(cacheKey, articles, this.CACHE_TTL);
      return articles;
    } catch (error) {
      console.error(`Error fetching news for ${symbol}:`, error);
      return [];
    }
  }

  private async fetchFromFinnhub(limit: number): Promise<NewsArticle[]> {
    try {
      const response = await axios.get('https://finnhub.io/api/v1/news', {
        params: {
          category: 'general',
          token: this.finnhubKey
        },
        timeout: 5000
      });

      return response.data.slice(0, limit * 2).map((item: any) => ({
        title: item.headline,
        summary: item.summary,
        source: item.source,
        url: item.url,
        publishedAt: new Date(item.datetime * 1000).toISOString(),
        time: this.getRelativeTime(new Date(item.datetime * 1000)),
        category: item.category || 'General',
        impact: this.calculateImpact(item),
        symbols: this.extractSymbolsFromText(item.headline + ' ' + item.summary),
        imageUrl: item.image
      }));
    } catch (error) {
      console.error('Finnhub news fetch error:', error);
      return [];
    }
  }

  private async fetchFromNewsAPI(limit: number): Promise<NewsArticle[]> {
    try {
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: 'stock market OR stocks OR trading OR finance OR Wall Street',
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: limit * 2,
          apiKey: this.newsApiKey
        },
        timeout: 5000
      });

      return response.data.articles.map((item: any) => ({
        title: item.title,
        summary: item.description || item.content?.substring(0, 200) || '',
        source: item.source.name,
        url: item.url,
        publishedAt: item.publishedAt,
        time: this.getRelativeTime(new Date(item.publishedAt)),
        category: this.categorizeArticle(item.title + ' ' + item.description),
        impact: this.calculateImpactFromText(item.title + ' ' + item.description),
        symbols: this.extractSymbolsFromText(item.title + ' ' + item.description),
        imageUrl: item.urlToImage
      }));
    } catch (error) {
      console.error('NewsAPI fetch error:', error);
      return [];
    }
  }

  private getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  private categorizeArticle(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('fed') || lower.includes('federal reserve') || lower.includes('interest rate')) {
      return 'Federal Reserve';
    } else if (lower.includes('tech') || lower.includes('technology') || lower.includes('ai') || lower.includes('chip')) {
      return 'Technology';
    } else if (lower.includes('oil') || lower.includes('energy') || lower.includes('opec')) {
      return 'Commodities';
    } else if (lower.includes('bank') || lower.includes('financial')) {
      return 'Financial';
    } else if (lower.includes('earnings') || lower.includes('revenue')) {
      return 'Earnings';
    }
    return 'General';
  }

  private categorizeBySymbol(symbol: string): string {
    const techStocks = ['AAPL', 'GOOGL', 'MSFT', 'NVDA', 'AMD', 'TSLA'];
    const financialStocks = ['JPM', 'BAC', 'GS', 'MS'];
    const energyStocks = ['XOM', 'CVX', 'COP'];

    if (techStocks.includes(symbol)) return 'Technology';
    if (financialStocks.includes(symbol)) return 'Financial';
    if (energyStocks.includes(symbol)) return 'Energy';
    return 'General';
  }

  private calculateImpact(item: any): 'High' | 'Medium' | 'Low' {
    const text = (item.headline || item.title || '') + ' ' + (item.summary || item.description || '');
    return this.calculateImpactFromText(text);
  }

  private calculateImpactFromText(text: string): 'High' | 'Medium' | 'Low' {
    const lower = text.toLowerCase();
    const highImpactKeywords = ['breaking', 'major', 'crash', 'surge', 'plunge', 'record', 'fed', 'federal reserve', 'crisis'];
    const mediumImpactKeywords = ['increase', 'decrease', 'announces', 'reports', 'upgrade', 'downgrade'];

    if (highImpactKeywords.some(keyword => lower.includes(keyword))) {
      return 'High';
    } else if (mediumImpactKeywords.some(keyword => lower.includes(keyword))) {
      return 'Medium';
    }
    return 'Low';
  }

  private extractSymbolsFromText(text: string): string[] {
    const symbols: string[] = [];
    const commonStocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'META', 'JPM', 'BAC', 'XOM'];
    
    commonStocks.forEach(symbol => {
      if (text.toUpperCase().includes(symbol)) {
        symbols.push(symbol);
      }
    });

    return symbols;
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  private async getFromCache(key: string): Promise<any> {
    if (!this.redisClient) return null;
    
    try {
      const cached = await this.redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      return null;
    }
  }

  private async setCache(key: string, data: any, ttl: number): Promise<void> {
    if (!this.redisClient) return;
    
    try {
      await this.redisClient.setEx(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // Generate mock news when external APIs are unavailable
  private generateMockNews(limit: number): NewsArticle[] {
    const now = new Date();
    const mockArticles: NewsArticle[] = [
      {
        title: "Stock Market Opens Higher as Tech Sector Leads Gains",
        summary: "Technology stocks are driving market gains today with major companies showing strong quarterly results and positive guidance for the coming months.",
        source: "MarketWatch",
        url: "#",
        publishedAt: new Date(now.getTime() - 0.5 * 60 * 60 * 1000).toISOString(), // 30 minutes ago
        time: "30 minutes ago",
        category: "Technology",
        impact: "High",
        symbols: ["AAPL", "GOOGL", "MSFT"],
      },
      {
        title: "Federal Reserve Signals Potential Rate Cut as Economic Data Improves",
        summary: "Market participants are interpreting recent Fed communications as indicating a possible interest rate reduction in the near future.",
        source: "Reuters",
        url: "#",
        publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        time: "2 hours ago",
        category: "Federal Reserve",
        impact: "High",
        symbols: ["JPM", "BAC"],
      },
      {
        title: "Oil Prices Decline Amid Increased Supply Concerns",
        summary: "Brent crude prices fell below $85 per barrel as OPEC+ continues discussions about future production levels.",
        source: "Bloomberg",
        url: "#",
        publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        time: "4 hours ago",
        category: "Commodities",
        impact: "Medium",
        symbols: ["XOM"],
      },
      {
        title: "Apple Reports Record Revenue from Services Segment",
        summary: "Apple's quarterly report showed strong growth in subscription services, helping offset softer iPhone sales.",
        source: "CNBC",
        url: "#",
        publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        time: "8 hours ago",
        category: "Technology",
        impact: "Medium",
        symbols: ["AAPL"],
      },
      {
        title: "Tesla Announces New Gigafactory Expansion Plans",
        summary: "The electric vehicle manufacturer announced plans to expand production capacity to meet growing demand for EVs.",
        source: "Wall Street Journal",
        url: "#",
        publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        time: "12 hours ago",
        category: "Technology",
        impact: "Medium",
        symbols: ["TSLA"],
      },
      {
        title: "Banking Sector Shows Resilience Amid Economic Uncertainty",
        summary: "Major banks reported steady performance with strong balance sheets and careful risk management during volatile market conditions.",
        source: "Financial Times",
        url: "#",
        publishedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
        time: "18 hours ago",
        category: "Financial",
        impact: "Low",
        symbols: ["JPM", "BAC"],
      },
      {
        title: "NVIDIA Surges on AI Chip Demand from Cloud Providers",
        summary: "The semiconductor giant saw significant stock movement following strong data center revenue guidance.",
        source: "Barron's",
        url: "#",
        publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        time: "1 day ago",
        category: "Technology",
        impact: "High",
        symbols: ["NVDA"],
      },
      {
        title: "Economic Indicators Suggest Cooling Inflation Trends",
        summary: "Recent inflation data released today showed promising signs of cooling price pressures across various sectors.",
        source: "The Economist",
        url: "#",
        publishedAt: new Date(now.getTime() - 30 * 60 * 60 * 1000).toISOString(), // 30 hours ago
        time: "1 day ago",
        category: "General",
        impact: "Medium",
        symbols: [],
      },
      {
        title: "Retail Sector Faces Challenges with E-commerce Competition",
        summary: "Traditional retail companies continue to face headwinds from online competition and changing consumer preferences.",
        source: "Bloomberg Businessweek",
        url: "#",
        publishedAt: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(), // 36 hours ago
        time: "1 day ago",
        category: "Retail",
        impact: "Low",
        symbols: [],
      },
      {
        title: "Healthcare Stocks Rally on Positive Clinical Trial Results",
        summary: "Several major pharmaceutical companies moved higher following encouraging developments in drug pipeline updates.",
        source: "MedTech News",
        url: "#",
        publishedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(), // 48 hours ago
        time: "2 days ago",
        category: "Healthcare",
        impact: "Medium",
        symbols: ["JNJ"],
      },
    ];

    // Shuffle and return requested amount
    const shuffled = [...mockArticles].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  }

  async cleanup(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

export const newsService = new NewsService();
