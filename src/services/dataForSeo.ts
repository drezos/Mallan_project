// DataForSEO API Service
// Fetches Google Trends data for Netherlands iGaming market

import axios, { AxiosInstance } from 'axios';

// ===========================================
// CONFIGURATION
// ===========================================

const DATAFORSEO_API_URL = 'https://api.dataforseo.com/v3';
const NETHERLANDS_LOCATION_CODE = 2528; // Netherlands location code for DataForSEO
const LANGUAGE_CODE = 'nl'; // Dutch

// Your brand keywords
export const BRAND_KEYWORDS = [
  'jacks.nl',
  'jacks casino',
  'jack casino'
];

// Competitor keywords (brand searches)
export const COMPETITOR_KEYWORDS: Record<string, string[]> = {
  'Toto': ['toto casino', 'toto sport'],
  'Unibet': ['unibet', 'unibet casino'],
  'Bet365': ['bet365', 'bet365 casino'],
  'BetCity': ['betcity', 'betcity casino'],
  'Holland Casino': ['holland casino', 'holland casino online'],
  'Circus': ['circus casino', 'circus.nl'],
  'JACKS': ['jacks.nl', 'jacks casino'], // Your brand for comparison
  '711': ['711 casino', '711.nl'],
  'Kansino': ['kansino', 'kansino casino'],
  'BetMGM': ['betmgm', 'betmgm nederland'],
  'LeoVegas': ['leovegas', 'leovegas casino']
};

// Intent keywords by category (Dutch)
export const INTENT_KEYWORDS: Record<string, string[]> = {
  comparison: [
    'beste online casino',
    'online casino vergelijken',
    'top casino nederland',
    'casino review'
  ],
  problem: [
    'casino uitbetaling',
    'casino klacht',
    'casino problemen',
    'geld terug casino'
  ],
  regulation: [
    'casino vergunning',
    'legaal gokken nederland',
    'ksa vergunning',
    'verantwoord gokken'
  ],
  product: [
    'casino bonus',
    'casino slots',
    'live casino',
    'sport wedden',
    'gratis spins'
  ],
  review: [
    'casino ervaring',
    'casino betrouwbaar',
    'casino veilig',
    'casino test'
  ]
};

// ===========================================
// TYPES
// ===========================================

export interface TrendDataPoint {
  date: string;
  value: number;
}

export interface KeywordTrendResult {
  keyword: string;
  data: TrendDataPoint[];
  averageValue: number;
  latestValue: number;
  weeklyChange: number;
}

export interface CompetitorTrendResult {
  name: string;
  keywords: string[];
  totalVolume: number;
  averageValue: number;
  weeklyChange: number;
  trendData: TrendDataPoint[];
}

export interface IntentCategoryResult {
  category: string;
  keywords: string[];
  totalVolume: number;
  weeklyChange: number;
  trendData: TrendDataPoint[];
}

export interface MarketOverview {
  totalMarketVolume: number;
  weeklyChange: number;
  brandShare: number;
  competitors: CompetitorTrendResult[];
  intentCategories: IntentCategoryResult[];
  lastUpdated: string;
}

// DataForSEO API Response Types
interface DataForSEOTrendItem {
  position: number;
  type: string;
  title?: string;
  keywords?: string[];
  data?: {
    date_from: string;
    date_to: string;
    values: number[] | null;
  };
}

interface DataForSEOTask {
  id: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  result_count: number;
  result: Array<{
    keywords: string[];
    type: string;
    location_code: number;
    language_code: string;
    check_url: string;
    datetime: string;
    items_count: number;
    items: DataForSEOTrendItem[];
  }>;
}

interface DataForSEOResponse {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: DataForSEOTask[];
}

// ===========================================
// SERVICE CLASS
// ===========================================

export class DataForSEOService {
  private client: AxiosInstance;
  private isConfigured: boolean = false;

  constructor() {
    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;

    if (!login || !password) {
      console.warn('DataForSEO credentials not configured. Service will return mock data.');
      this.isConfigured = false;
      this.client = axios.create(); // Dummy client
    } else {
      this.isConfigured = true;
      const auth = Buffer.from(`${login}:${password}`).toString('base64');
      
      this.client = axios.create({
        baseURL: DATAFORSEO_API_URL,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });
    }
  }

  // Check if service is properly configured
  public isReady(): boolean {
    return this.isConfigured;
  }

  // ===========================================
  // CORE API METHODS
  // ===========================================

  /**
   * Fetch Google Trends data for up to 5 keywords
   * Uses the Live endpoint for instant results
   */
  async fetchTrends(keywords: string[], dateFrom?: string, dateTo?: string): Promise<DataForSEOResponse | null> {
    if (!this.isConfigured) {
      console.log('DataForSEO not configured, skipping API call');
      return null;
    }

    // DataForSEO limits to 5 keywords per request
    const keywordsToFetch = keywords.slice(0, 5);
    
    // Default to last 90 days if not specified
    const now = new Date();
    const defaultDateTo = now.toISOString().split('T')[0];
    const defaultDateFrom = new Date(now.setDate(now.getDate() - 90)).toISOString().split('T')[0];

    const payload = [{
      keywords: keywordsToFetch,
      location_code: NETHERLANDS_LOCATION_CODE,
      language_code: LANGUAGE_CODE,
      type: 'web', // Google Web Search
      date_from: dateFrom || defaultDateFrom,
      date_to: dateTo || defaultDateTo
    }];

    try {
      const response = await this.client.post<DataForSEOResponse>(
        '/keywords_data/google_trends/explore/live',
        payload
      );
      
      return response.data;
    } catch (error: any) {
      console.error('DataForSEO API error:', error.response?.data || error.message);
      throw new Error(`DataForSEO API error: ${error.message}`);
    }
  }

  /**
   * Parse trend data from DataForSEO response
   */
  private parseTrendData(response: DataForSEOResponse): KeywordTrendResult[] {
    const results: KeywordTrendResult[] = [];
    
    if (!response.tasks || response.tasks.length === 0) {
      return results;
    }

    const task = response.tasks[0];
    if (!task.result || task.result.length === 0) {
      return results;
    }

    const result = task.result[0];
    const keywords = result.keywords || [];
    
    // Find the trend item (type: "google_trends_graph")
    const trendItem = result.items?.find(item => 
      item.type === 'google_trends_graph' || item.data?.values
    );

    if (!trendItem || !trendItem.data?.values) {
      // Return empty results with keywords
      return keywords.map(kw => ({
        keyword: kw,
        data: [],
        averageValue: 0,
        latestValue: 0,
        weeklyChange: 0
      }));
    }

    const values = trendItem.data.values;
    const dateFrom = new Date(trendItem.data.date_from);
    
    // Convert values to data points (weekly intervals typically)
    const dataPoints: TrendDataPoint[] = values.map((value, index) => {
      const date = new Date(dateFrom);
      date.setDate(date.getDate() + (index * 7)); // Weekly data points
      return {
        date: date.toISOString().split('T')[0],
        value: value || 0
      };
    });

    // Calculate metrics for each keyword
    // Note: Google Trends returns relative values, not per-keyword
    const avgValue = values.reduce((a, b) => a + (b || 0), 0) / values.length;
    const latestValue = values[values.length - 1] || 0;
    const previousValue = values[values.length - 2] || latestValue;
    const weeklyChange = previousValue > 0 
      ? ((latestValue - previousValue) / previousValue) * 100 
      : 0;

    // For now, return the same trend for all keywords in the batch
    // (This is how Google Trends works - it compares relative popularity)
    return keywords.map(keyword => ({
      keyword,
      data: dataPoints,
      averageValue: Math.round(avgValue),
      latestValue: Math.round(latestValue),
      weeklyChange: Math.round(weeklyChange * 10) / 10
    }));
  }

  // ===========================================
  // HIGH-LEVEL DATA FETCHING METHODS
  // ===========================================

  /**
   * Fetch trend data for your brand keywords
   */
  async fetchBrandTrends(): Promise<KeywordTrendResult[]> {
    if (!this.isConfigured) {
      return this.getMockBrandTrends();
    }

    try {
      const response = await this.fetchTrends(BRAND_KEYWORDS);
      if (!response) return this.getMockBrandTrends();
      return this.parseTrendData(response);
    } catch (error) {
      console.error('Error fetching brand trends:', error);
      return this.getMockBrandTrends();
    }
  }

  /**
   * Fetch trend data for all competitors
   * Makes multiple API calls (one per competitor, batched)
   */
  async fetchCompetitorTrends(): Promise<CompetitorTrendResult[]> {
    if (!this.isConfigured) {
      return this.getMockCompetitorTrends();
    }

    const results: CompetitorTrendResult[] = [];

    for (const [name, keywords] of Object.entries(COMPETITOR_KEYWORDS)) {
      try {
        const response = await this.fetchTrends(keywords);
        if (!response) continue;

        const trendResults = this.parseTrendData(response);
        
        // Aggregate results for this competitor
        const totalVolume = trendResults.reduce((sum, r) => sum + r.latestValue, 0);
        const avgValue = trendResults.length > 0 
          ? trendResults.reduce((sum, r) => sum + r.averageValue, 0) / trendResults.length 
          : 0;
        const avgChange = trendResults.length > 0
          ? trendResults.reduce((sum, r) => sum + r.weeklyChange, 0) / trendResults.length
          : 0;

        results.push({
          name,
          keywords,
          totalVolume: Math.round(totalVolume),
          averageValue: Math.round(avgValue),
          weeklyChange: Math.round(avgChange * 10) / 10,
          trendData: trendResults[0]?.data || []
        });

        // Rate limiting: wait 200ms between requests
        await this.sleep(200);
      } catch (error) {
        console.error(`Error fetching trends for ${name}:`, error);
      }
    }

    return results.length > 0 ? results : this.getMockCompetitorTrends();
  }

  /**
   * Fetch intent keyword trends by category
   */
  async fetchIntentTrends(): Promise<IntentCategoryResult[]> {
    if (!this.isConfigured) {
      return this.getMockIntentTrends();
    }

    const results: IntentCategoryResult[] = [];

    for (const [category, keywords] of Object.entries(INTENT_KEYWORDS)) {
      try {
        const response = await this.fetchTrends(keywords);
        if (!response) continue;

        const trendResults = this.parseTrendData(response);
        
        const totalVolume = trendResults.reduce((sum, r) => sum + r.latestValue, 0);
        const avgChange = trendResults.length > 0
          ? trendResults.reduce((sum, r) => sum + r.weeklyChange, 0) / trendResults.length
          : 0;

        results.push({
          category,
          keywords,
          totalVolume: Math.round(totalVolume),
          weeklyChange: Math.round(avgChange * 10) / 10,
          trendData: trendResults[0]?.data || []
        });

        // Rate limiting
        await this.sleep(200);
      } catch (error) {
        console.error(`Error fetching trends for ${category}:`, error);
      }
    }

    return results.length > 0 ? results : this.getMockIntentTrends();
  }

  /**
   * Fetch complete market overview
   * This is the main method to call for dashboard data
   */
  async fetchMarketOverview(): Promise<MarketOverview> {
    console.log('Fetching market overview...');
    console.log('DataForSEO configured:', this.isConfigured);

    const [brandTrends, competitorTrends, intentTrends] = await Promise.all([
      this.fetchBrandTrends(),
      this.fetchCompetitorTrends(),
      this.fetchIntentTrends()
    ]);

    // Calculate total market volume (sum of all competitors)
    const totalMarketVolume = competitorTrends.reduce((sum, c) => sum + c.totalVolume, 0);
    
    // Calculate your brand's share
    const brandVolume = brandTrends.reduce((sum, b) => sum + b.latestValue, 0);
    const brandShare = totalMarketVolume > 0 
      ? (brandVolume / totalMarketVolume) * 100 
      : 0;

    // Calculate overall market weekly change
    const marketWeeklyChange = competitorTrends.length > 0
      ? competitorTrends.reduce((sum, c) => sum + c.weeklyChange, 0) / competitorTrends.length
      : 0;

    return {
      totalMarketVolume,
      weeklyChange: Math.round(marketWeeklyChange * 10) / 10,
      brandShare: Math.round(brandShare * 10) / 10,
      competitors: competitorTrends,
      intentCategories: intentTrends,
      lastUpdated: new Date().toISOString()
    };
  }

  // ===========================================
  // MOCK DATA (Fallback when API not configured)
  // ===========================================

  private getMockBrandTrends(): KeywordTrendResult[] {
    return BRAND_KEYWORDS.map(keyword => ({
      keyword,
      data: this.generateMockTrendData(65, 85),
      averageValue: 72,
      latestValue: 78,
      weeklyChange: 8.2
    }));
  }

  private getMockCompetitorTrends(): CompetitorTrendResult[] {
    const mockData: CompetitorTrendResult[] = [
      { name: 'Toto', keywords: ['toto casino'], totalVolume: 4500, averageValue: 85, weeklyChange: 5.2, trendData: this.generateMockTrendData(80, 90) },
      { name: 'Unibet', keywords: ['unibet'], totalVolume: 3800, averageValue: 72, weeklyChange: -2.1, trendData: this.generateMockTrendData(68, 78) },
      { name: 'Bet365', keywords: ['bet365'], totalVolume: 5200, averageValue: 88, weeklyChange: 3.5, trendData: this.generateMockTrendData(82, 92) },
      { name: 'BetCity', keywords: ['betcity'], totalVolume: 2100, averageValue: 45, weeklyChange: 12.8, trendData: this.generateMockTrendData(38, 52) },
      { name: 'Holland Casino', keywords: ['holland casino'], totalVolume: 6800, averageValue: 92, weeklyChange: 1.2, trendData: this.generateMockTrendData(88, 96) },
      { name: 'Circus', keywords: ['circus casino'], totalVolume: 1200, averageValue: 28, weeklyChange: -5.4, trendData: this.generateMockTrendData(24, 32) },
      { name: 'JACKS', keywords: ['jacks.nl'], totalVolume: 2400, averageValue: 52, weeklyChange: 8.2, trendData: this.generateMockTrendData(45, 60) },
      { name: '711', keywords: ['711 casino'], totalVolume: 980, averageValue: 22, weeklyChange: 15.3, trendData: this.generateMockTrendData(18, 28) },
      { name: 'Kansino', keywords: ['kansino'], totalVolume: 1500, averageValue: 35, weeklyChange: 6.7, trendData: this.generateMockTrendData(30, 40) },
      { name: 'BetMGM', keywords: ['betmgm'], totalVolume: 1800, averageValue: 40, weeklyChange: 22.4, trendData: this.generateMockTrendData(32, 48) },
      { name: 'LeoVegas', keywords: ['leovegas'], totalVolume: 2800, averageValue: 58, weeklyChange: -1.8, trendData: this.generateMockTrendData(54, 62) }
    ];
    return mockData;
  }

  private getMockIntentTrends(): IntentCategoryResult[] {
    return [
      { category: 'comparison', keywords: INTENT_KEYWORDS.comparison, totalVolume: 12500, weeklyChange: -3.2, trendData: this.generateMockTrendData(60, 75) },
      { category: 'problem', keywords: INTENT_KEYWORDS.problem, totalVolume: 4800, weeklyChange: 18.5, trendData: this.generateMockTrendData(35, 55) },
      { category: 'regulation', keywords: INTENT_KEYWORDS.regulation, totalVolume: 2200, weeklyChange: 8.4, trendData: this.generateMockTrendData(20, 35) },
      { category: 'product', keywords: INTENT_KEYWORDS.product, totalVolume: 18500, weeklyChange: 2.1, trendData: this.generateMockTrendData(70, 85) },
      { category: 'review', keywords: INTENT_KEYWORDS.review, totalVolume: 6200, weeklyChange: -1.5, trendData: this.generateMockTrendData(45, 60) }
    ];
  }

  private generateMockTrendData(min: number, max: number): TrendDataPoint[] {
    const data: TrendDataPoint[] = [];
    const now = new Date();
    
    for (let i = 12; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * 7));
      
      // Add some realistic variation
      const baseValue = min + Math.random() * (max - min);
      const trend = (12 - i) * 0.5; // Slight upward trend
      const noise = (Math.random() - 0.5) * 10;
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(baseValue + trend + noise)
      });
    }
    
    return data;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const dataForSEOService = new DataForSEOService();

