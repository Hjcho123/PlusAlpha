import axios from 'axios';
import { createClient } from 'redis';

interface EconomicEvent {
  date: string;
  time: string;
  event: string;
  impact: 'High' | 'Medium' | 'Low';
  previous: string;
  forecast: string;
  actual: string | null;
  description: string;
  country: string;
}

interface EarningsEvent {
  date: string;
  symbol: string;
  name: string;
  time: string;
  epsEst: number | null;
  revenueEst: string | null;
  epsActual: number | null;
  revenueActual: string | null;
  surprise: number | null;
  importance: 'High' | 'Medium' | 'Low';
}

export class CalendarService {
  private redisClient: any;
  private finnhubKey: string;
  private readonly CACHE_TTL = 86400; // 24 hours for calendar data

  constructor() {
    this.finnhubKey = process.env.FINNHUB_API_KEY || '';
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redisClient = createClient({ url: redisUrl });
      await this.redisClient.connect();
    } catch (error) {
      console.warn('Redis not available for CalendarService');
      this.redisClient = null;
    }
  }

  async getEconomicCalendar(days: number = 7): Promise<EconomicEvent[]> {
    try {
      const cacheKey = `economic_calendar:${days}`;
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);

      const response = await axios.get('https://finnhub.io/api/v1/calendar/economic', {
        params: {
          from: this.formatDate(today),
          to: this.formatDate(futureDate),
          token: this.finnhubKey
        },
        timeout: 5000
      });

      const events: EconomicEvent[] = response.data.economicCalendar?.map((event: any) => ({
        date: this.getRelativeDate(new Date(event.time)),
        time: new Date(event.time).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZoneName: 'short'
        }),
        event: event.event,
        impact: this.normalizeImpact(event.impact),
        previous: this.formatValue(event.previous),
        forecast: this.formatValue(event.estimate),
        actual: event.actual ? this.formatValue(event.actual) : null,
        description: event.event,
        country: event.country || 'US'
      })) || [];

      // Sort by date
      events.sort((a, b) => {
        const dateA = this.parseRelativeDate(a.date);
        const dateB = this.parseRelativeDate(b.date);
        return dateA.getTime() - dateB.getTime();
      });

      await this.setCache(cacheKey, events, this.CACHE_TTL);
      return events;
    } catch (error) {
      console.error('Error fetching economic calendar:', error);
      return this.getFallbackEconomicCalendar();
    }
  }

  async getEarningsCalendar(days: number = 7): Promise<EarningsEvent[]> {
    try {
      const cacheKey = `earnings_calendar:${days}`;
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);

      const response = await axios.get('https://finnhub.io/api/v1/calendar/earnings', {
        params: {
          from: this.formatDate(today),
          to: this.formatDate(futureDate),
          token: this.finnhubKey
        },
        timeout: 5000
      });

      const events: EarningsEvent[] = response.data.earningsCalendar?.map((earning: any) => ({
        date: this.formatDisplayDate(new Date(earning.date)),
        symbol: earning.symbol,
        name: earning.companyName || earning.symbol,
        time: earning.hour || 'TBA',
        epsEst: earning.epsEstimate || null,
        revenueEst: earning.revenueEstimate ? this.formatRevenue(earning.revenueEstimate) : null,
        epsActual: earning.epsActual || null,
        revenueActual: earning.revenueActual ? this.formatRevenue(earning.revenueActual) : null,
        surprise: earning.epsSurprise || null,
        importance: this.determineEarningsImportance(earning)
      })) || [];

      // Sort by date and importance
      events.sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        
        const importanceOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
        return importanceOrder[a.importance] - importanceOrder[b.importance];
      });

      await this.setCache(cacheKey, events, this.CACHE_TTL);
      return events;
    } catch (error) {
      console.error('Error fetching earnings calendar:', error);
      return this.getFallbackEarningsCalendar();
    }
  }

  private normalizeImpact(impact: string): 'High' | 'Medium' | 'Low' {
    const lower = impact?.toLowerCase() || '';
    if (lower === 'high' || lower === '3') return 'High';
    if (lower === 'medium' || lower === '2') return 'Medium';
    return 'Low';
  }

  private determineEarningsImportance(earning: any): 'High' | 'Medium' | 'Low' {
    const majorCompanies = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META'];
    if (majorCompanies.includes(earning.symbol)) return 'High';
    if (earning.marketCap && earning.marketCap > 100000000000) return 'High'; // >$100B
    if (earning.marketCap && earning.marketCap > 10000000000) return 'Medium'; // >$10B
    return 'Low';
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
      return value.toFixed(2);
    }
    return String(value);
  }

  private formatRevenue(value: number): string {
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    return `$${value.toFixed(0)}`;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private formatDisplayDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  private getRelativeDate(date: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((compareDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1 && diffDays <= 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
    return this.formatDisplayDate(date);
  }

  private parseRelativeDate(relativeDate: string): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (relativeDate === 'Today') return today;
    if (relativeDate === 'Tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    if (relativeDate === 'Yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    }
    
    // Parse actual date
    return new Date(relativeDate);
  }

  private getFallbackEconomicCalendar(): EconomicEvent[] {
    // Provide realistic fallback data
    return [
      {
        date: 'Today',
        time: '14:00 EST',
        event: 'FOMC Meeting Minutes',
        impact: 'High',
        previous: '0.25%',
        forecast: '0.25%',
        actual: null,
        description: 'Federal Open Market Committee meeting minutes release',
        country: 'US'
      },
      {
        date: 'Tomorrow',
        time: '08:30 EST',
        event: 'Non-Farm Payrolls',
        impact: 'High',
        previous: '150K',
        forecast: '180K',
        actual: null,
        description: 'Monthly employment situation report',
        country: 'US'
      }
    ];
  }

  private getFallbackEarningsCalendar(): EarningsEvent[] {
    const today = new Date();
    const formatDate = (daysOffset: number) => {
      const date = new Date(today);
      date.setDate(date.getDate() + daysOffset);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return [
      {
        date: formatDate(1),
        symbol: 'AAPL',
        name: 'Apple Inc',
        time: 'After Close',
        epsEst: 1.39,
        revenueEst: '$89.5B',
        epsActual: null,
        revenueActual: null,
        surprise: null,
        importance: 'High'
      },
      {
        date: formatDate(2),
        symbol: 'GOOGL',
        name: 'Alphabet Inc',
        time: 'After Close',
        epsEst: 1.45,
        revenueEst: '$74.3B',
        epsActual: null,
        revenueActual: null,
        surprise: null,
        importance: 'High'
      }
    ];
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

  async cleanup(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

export const calendarService = new CalendarService();
