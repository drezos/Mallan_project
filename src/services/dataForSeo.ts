
/**
 * DataForSEO Service
 * 
 * Integrates with DataForSEO APIs for:
 * 1. Google Ads Search Volume (monthly absolute volumes)
 * 2. Google Trends Explore (weekly relative trends)
 * 3. SERP Organic (ranking positions)
 * 
 * IMPORTANT: include_adult_keywords must be TRUE for gambling keywords!
 */

import axios, { AxiosInstance } from 'axios';
import { brands, intentKeywords, apiConfig, BrandConfig } from '../config/brandKeywords';

// =============================================================================
// TYPES
// =============================================================================

export interface SearchVolumeResult {
  keyword: string;
  searchVolume: number | null;
  competition: string | null;
  competitionIndex: number | null;
  cpc: number | null;
  monthlySearches: Array<{
    year: number;
    month: number;
    searchVolume: number;
  }>;
}

export interface TrendDataPoint {
  dateFrom: string;
  dateTo: string;
  values: (number | null)[];
}

export interface TrendResult {
  keywords: string[];
  data: TrendDataPoint[];
  averages: number[];
}

export interface SerpResult {
  keyword: string;
  totalResults: number;
  items: Array<{
    position: number;
    domain: string;
    url: string;
    title: string;
    description: string;
    type: string;
  }>;
}

export interface BrandSearchVolume {
  brandId: string;
  brandName: string;
  totalVolume: number;
  keywords: SearchVolumeResult[];
  fetchedAt: Date;
}

// =============================================================================
// DATAFORSEO CLIENT
// =============================================================================

class DataForSEOService {
  private client: AxiosInstance;
  private locationCode: number;
  private languageCode: string;

  constructor() {
    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;

    if (!login || !password) {
      console.warn('⚠️ DataForSEO credentials not configured. Using mock data.');
    }

    const auth = Buffer.from(`${login}:${password}`).toString('base64');

    this.client = axios.create({
      baseURL: 'https://api.dataforseo.com/v3',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 second timeout for large requests
    });

    this.locationCode = apiConfig.dataForSeo.location_code;
    this.languageCode = apiConfig.dataForSeo.language_code;
  }

  // ===========================================================================
  // 1. GOOGLE ADS SEARCH VOLUME (Monthly)
  // ===========================================================================

  /**
   * Fetch search volumes for a list of keywords
   * Cost: ~$0.075 per request (up to 1000 keywords)
   * 
   * IMPORTANT: include_adult_keywords: true is REQUIRED for gambling keywords!
   */
  async getSearchVolume(keywords: string[]): Promise<SearchVolumeResult[]> {
    try {
      const response = await this.client.post('/keywords_data/google_ads/search_volume/live', [{
        location_code: this.locationCode,
        language_code: this.languageCode,
        keywords: keywords.slice(0, 1000), // Max 1000 per request
        include_adult_keywords: true, // CRITICAL for gambling!
        search_partners: true
      }]);

      if (response.data.tasks?.[0]?.result) {
        return response.data.tasks[0].result.map((item: any) => ({
          keyword: item.keyword,
          searchVolume: item.search_volume,
          competition: item.competition,
          competitionIndex: item.competition_index,
          cpc: item.cpc,
          monthlySearches: item.monthly_searches?.map((m: any) => ({
            year: m.year,
            month: m.month,
            searchVolume: m.search_volume
          })) || []
        }));
      }

      return [];
    } catch (error) {
      console.error('❌ DataForSEO Search Volume error:', error);
      throw error;
    }
  }

  /**
   * Fetch search volumes for all brand keywords and aggregate by brand
   */
  async getBrandSearchVolumes(): Promise<BrandSearchVolume[]> {
    const allKeywords = brands.flatMap(brand => brand.keywords);
    
    console.log(`📊 Fetching search volumes for ${allKeywords.length} keywords...`);
    
    const results = await this.getSearchVolume(allKeywords);
    
    // Create a map for quick lookup
    const volumeMap = new Map<string, SearchVolumeResult>();
    results.forEach(r => volumeMap.set(r.keyword.toLowerCase(), r));

    // Aggregate by brand
    const brandVolumes: BrandSearchVolume[] = brands.map(brand => {
      const brandKeywordResults = brand.keywords.map(kw => {
        const result = volumeMap.get(kw.toLowerCase());
        return result || {
          keyword: kw,
          searchVolume: null,
          competition: null,
          competitionIndex: null,
          cpc: null,
          monthlySearches: []
        };
      });

      const totalVolume = brandKeywordResults.reduce((sum, r) => {
        return sum + (r.searchVolume || 0);
      }, 0);

      return {
        brandId: brand.id,
        brandName: brand.displayName,
        totalVolume,
        keywords: brandKeywordResults,
        fetchedAt: new Date()
      };
    });

    return brandVolumes;
  }

  // ===========================================================================
  // 2. GOOGLE TRENDS EXPLORE (Weekly)
  // ===========================================================================

  /**
   * Fetch Google Trends data for keyword comparison
   * Cost: ~$0.009 per request (up to 5 keywords to compare)
   * 
   * Note: Returns relative interest (0-100), not absolute volumes
   */
  async getTrends(
    keywords: string[],
    dateFrom: string,
    dateTo: string
  ): Promise<TrendResult | null> {
    try {
      // Google Trends can only compare 5 keywords at a time
      const keywordsToUse = keywords.slice(0, 5);

      const response = await this.client.post('/keywords_data/google_trends/explore/live', [{
        location_name: 'Netherlands',
        language_code: this.languageCode,
        keywords: keywordsToUse,
        date_from: dateFrom,
        date_to: dateTo,
        type: 'web'
      }]);

      if (response.data.tasks?.[0]?.result?.[0]) {
        const result = response.data.tasks[0].result[0];
        const graphData = result.items?.find((i: any) => i.type === 'google_trends_graph');

        if (graphData) {
          return {
            keywords: result.keywords,
            data: graphData.data.map((d: any) => ({
              dateFrom: d.date_from,
              dateTo: d.date_to,
              values: d.values
            })),
            averages: graphData.averages || []
          };
        }
      }

      return null;
    } catch (error) {
      console.error('❌ DataForSEO Trends error:', error);
      throw error;
    }
  }

  /**
   * Fetch trends comparing top brands (your brand vs competitors)
   * Uses primary keyword for each brand for cleaner comparison
   */
  async getBrandTrends(brandIds?: string[]): Promise<TrendResult | null> {
    // Get brands to compare (max 5 for Google Trends)
    let brandsToCompare = brandIds 
      ? brands.filter(b => brandIds.includes(b.id))
      : brands.slice(0, 5);

    // Use primary keyword (usually brand + casino) for each
    const primaryKeywords = brandsToCompare.map(b => {
      // Find the "brand casino" variant, or use first keyword
      const casinoKeyword = b.keywords.find(k => k.includes('casino') && !k.includes('.'));
      return casinoKeyword || b.keywords[0];
    });

    // Date range: last 12 months for weekly data
    const dateTo = new Date().toISOString().split('T')[0];
    const dateFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return this.getTrends(primaryKeywords, dateFrom, dateTo);
  }

  // ===========================================================================
  // 3. SERP ORGANIC (Weekly)
  // ===========================================================================

  /**
   * Fetch SERP results for a keyword
   * Cost: ~$0.002 per keyword
   */
  async getSerpResults(keyword: string, depth: number = 10): Promise<SerpResult | null> {
    try {
      const response = await this.client.post('/serp/google/organic/live/advanced', [{
        keyword,
        location_code: this.locationCode,
        language_code: this.languageCode,
        depth
      }]);

      if (response.data.tasks?.[0]?.result?.[0]) {
        const result = response.data.tasks[0].result[0];
        const organicItems = result.items?.filter((i: any) => i.type === 'organic') || [];

        return {
          keyword,
          totalResults: result.se_results_count || 0,
          items: organicItems.map((item: any) => ({
            position: item.rank_group,
            domain: item.domain,
            url: item.url,
            title: item.title,
            description: item.description || '',
            type: item.type
          }))
        };
      }

      return null;
    } catch (error) {
      console.error('❌ DataForSEO SERP error:', error);
      throw error;
    }
  }

  /**
   * Fetch SERP results for all intent keywords
   */
  async getIntentKeywordRankings(): Promise<Map<string, SerpResult>> {
    const results = new Map<string, SerpResult>();
    
    // Get all intent keywords
    const allIntentKeywords = intentKeywords.flatMap(cat => cat.keywords);
    
    console.log(`🔍 Fetching SERP results for ${allIntentKeywords.length} intent keywords...`);

    // Fetch in batches to avoid rate limits
    for (const keyword of allIntentKeywords) {
      try {
        const result = await this.getSerpResults(keyword);
        if (result) {
          results.set(keyword, result);
        }
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Failed to fetch SERP for "${keyword}":`, error);
      }
    }

    return results;
  }

  /**
   * Find where brands rank for a specific keyword
   */
  async getBrandRankingsForKeyword(keyword: string): Promise<Array<{
    brandId: string;
    brandName: string;
    position: number | null;
    url: string | null;
  }>> {
    const serpResult = await this.getSerpResults(keyword, 20);
    if (!serpResult) return [];

    return brands.map(brand => {
      // Check if any brand domain appears in results
      const match = serpResult.items.find(item => {
        const domain = item.domain.toLowerCase();
        return brand.website.toLowerCase().includes(domain) || 
               domain.includes(brand.website.toLowerCase().replace('.nl', '').replace('.com', ''));
      });

      return {
        brandId: brand.id,
        brandName: brand.displayName,
        position: match?.position || null,
        url: match?.url || null
      };
    });
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Check API credentials and balance
   */
  async checkStatus(): Promise<{
    isConfigured: boolean;
    balance?: number;
    error?: string;
  }> {
    try {
      const response = await this.client.get('/appendix/user_data');
      
      if (response.data.tasks?.[0]?.result?.[0]) {
        return {
          isConfigured: true,
          balance: response.data.tasks[0].result[0].money?.balance || 0
        };
      }

      return { isConfigured: false, error: 'Could not fetch user data' };
    } catch (error: any) {
      return { 
        isConfigured: false, 
        error: error.message || 'Failed to connect to DataForSEO' 
      };
    }
  }
}

// Export singleton instance
export const dataForSEOService = new DataForSEOService();
export default dataForSEOService;
