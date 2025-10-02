import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { WSMessage, PriceUpdateMessage, InsightUpdateMessage } from '../types';
import { stockDataService } from './StockDataService';
import { aiService } from './AIService';

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocket> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map(); // symbol -> Set of client IDs

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });

    this.setupWebSocketServer();
    this.startDataBroadcasting();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws);

      console.log(`Client ${clientId} connected. Total clients: ${this.clients.size}`);

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connection',
        data: { clientId, message: 'Connected to PlusAlpha WebSocket' },
        timestamp: new Date()
      });

      // Handle incoming messages
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(clientId, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this.sendToClient(clientId, {
            type: 'error',
            data: { message: 'Invalid message format' },
            timestamp: new Date()
          });
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        this.handleClientDisconnect(clientId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.handleClientDisconnect(clientId);
      });
    });

    console.log('WebSocket server initialized');
  }

  private handleClientMessage(clientId: string, message: any): void {
    switch (message.type) {
      case 'subscribe':
        this.handleSubscription(clientId, message.symbols);
        break;
      case 'unsubscribe':
        this.handleUnsubscription(clientId, message.symbols);
        break;
      case 'ping':
        this.sendToClient(clientId, {
          type: 'pong',
          data: { timestamp: Date.now() },
          timestamp: new Date()
        });
        break;
      default:
        this.sendToClient(clientId, {
          type: 'error',
          data: { message: 'Unknown message type' },
          timestamp: new Date()
        });
    }
  }

  private handleSubscription(clientId: string, symbols: string[]): void {
    if (!Array.isArray(symbols)) {
      this.sendToClient(clientId, {
        type: 'error',
        data: { message: 'Symbols must be an array' },
        timestamp: new Date()
      });
      return;
    }

    symbols.forEach(symbol => {
      const upperSymbol = symbol.toUpperCase();
      
      if (!this.subscriptions.has(upperSymbol)) {
        this.subscriptions.set(upperSymbol, new Set());
      }
      
      this.subscriptions.get(upperSymbol)!.add(clientId);
    });

    this.sendToClient(clientId, {
      type: 'subscription_confirmed',
      data: { symbols: symbols.map(s => s.toUpperCase()) },
      timestamp: new Date()
    });

    console.log(`Client ${clientId} subscribed to: ${symbols.join(', ')}`);
  }

  private handleUnsubscription(clientId: string, symbols: string[]): void {
    if (!Array.isArray(symbols)) {
      this.sendToClient(clientId, {
        type: 'error',
        data: { message: 'Symbols must be an array' },
        timestamp: new Date()
      });
      return;
    }

    symbols.forEach(symbol => {
      const upperSymbol = symbol.toUpperCase();
      const subscribers = this.subscriptions.get(upperSymbol);
      
      if (subscribers) {
        subscribers.delete(clientId);
        
        // Clean up empty subscriptions
        if (subscribers.size === 0) {
          this.subscriptions.delete(upperSymbol);
        }
      }
    });

    this.sendToClient(clientId, {
      type: 'unsubscription_confirmed',
      data: { symbols: symbols.map(s => s.toUpperCase()) },
      timestamp: new Date()
    });

    console.log(`Client ${clientId} unsubscribed from: ${symbols.join(', ')}`);
  }

  private handleClientDisconnect(clientId: string): void {
    // Remove client from all subscriptions
    this.subscriptions.forEach((subscribers, symbol) => {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.subscriptions.delete(symbol);
      }
    });

    this.clients.delete(clientId);
    console.log(`Client ${clientId} disconnected. Total clients: ${this.clients.size}`);
  }

  private sendToClient(clientId: string, message: WSMessage): void {
    const client = this.clients.get(clientId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  private broadcastToSubscribers(symbol: string, message: WSMessage): void {
    const subscribers = this.subscriptions.get(symbol.toUpperCase());
    if (subscribers) {
      subscribers.forEach(clientId => {
        this.sendToClient(clientId, message);
      });
    }
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for broadcasting data
  public broadcastPriceUpdate(symbol: string, priceData: any): void {
    const message: PriceUpdateMessage = {
      type: 'price_update',
      data: {
        symbol: symbol.toUpperCase(),
        price: priceData.price,
        change: priceData.change,
        changePercent: priceData.changePercent
      },
      timestamp: new Date()
    };

    this.broadcastToSubscribers(symbol, message);
  }

  public broadcastInsightUpdate(insight: any): void {
    const message: InsightUpdateMessage = {
      type: 'insight_update',
      data: insight,
      timestamp: new Date()
    };

    // Broadcast to all clients subscribed to the symbol
    this.broadcastToSubscribers(insight.symbol, message);
  }

  public broadcastMarketAlert(alert: any): void {
    const message: WSMessage = {
      type: 'alert',
      data: alert,
      timestamp: new Date()
    };

    // Broadcast to all clients
    this.clients.forEach((client, clientId) => {
      this.sendToClient(clientId, message);
    });
  }

  // Start periodic data broadcasting
  private startDataBroadcasting(): void {
    // Update prices every 30 seconds for subscribed symbols
    setInterval(async () => {
      const subscribedSymbols = Array.from(this.subscriptions.keys());
      
      if (subscribedSymbols.length === 0) return;

      try {
        const stocksData = await stockDataService.getMultipleStocksData(subscribedSymbols);
        
        stocksData.forEach(stock => {
          this.broadcastPriceUpdate(stock.symbol, {
            price: stock.price,
            change: stock.change,
            changePercent: stock.changePercent
          });
        });
      } catch (error) {
        console.error('Error broadcasting price updates:', error);
      }
    }, 30000); // 30 seconds

    // Generate AI insights every 5 minutes for popular symbols
    setInterval(async () => {
      const popularSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
      
      try {
        for (const symbol of popularSymbols) {
          const insight = await aiService.generateTradingSignal(symbol);
          if (insight) {
            this.broadcastInsightUpdate(insight);
          }
        }
      } catch (error) {
        console.error('Error generating AI insights:', error);
      }
    }, 300000); // 5 minutes

    console.log('Data broadcasting started');
  }

  // Get WebSocket statistics
  public getStats(): any {
    return {
      totalClients: this.clients.size,
      totalSubscriptions: this.subscriptions.size,
      subscriptions: Object.fromEntries(
        Array.from(this.subscriptions.entries()).map(([symbol, clients]) => [
          symbol,
          clients.size
        ])
      )
    };
  }

  // Graceful shutdown
  public shutdown(): void {
    this.wss.close(() => {
      console.log('WebSocket server closed');
    });
  }
}
