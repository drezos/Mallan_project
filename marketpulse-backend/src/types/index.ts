// MarketPulse Type Definitions

// ============================================
// Database Types
// ============================================

export interface User {
  id: number;
  email: string;
  clerk_id: string | null;
  brand_name: string;
  created_at: Date;
}

export interface DailySignal {
  id: number;
  date: Date;
  user_id: number;
  region_id: number;
  brand_id: number;
  search_volume: number;
  keyword: string;
  created_at: Date;
}

export interface CalculatedMetrics {
  id: number;
  date: Date;
  user_id: number;
  market_share_momentum: number;
  competitive_pressure: number;
  sentiment_score: number;
  created_at: Date;
}

export interface Alert {
  id: number;
  user_id: number;
  alert_type: AlertType;
  severity: Severity;
  message: string;
  competitor_name?: string;
  metric_value?: number;
  created_at: Date;
  is_read: boolean;
}

export interface Competitor {
  id: number;
  user_id: number;
  competitor_name: string;
  brand_keywords: string[];
  search_rank: number | null;
  created_at: Date;
}

export interface IntentKeyword {
  id: number;
  keyword: string;
  intent_type: IntentType;
  region_id: number;
  language: string;
}

// ============================================
// Enum Types
// ============================================

export type AlertType = 
  | 'emerging_threat'
  | 'intent_shift'
  | 'sentiment_velocity'
  | 'competitive_pressure'
  | 'market_opportunity';

export type Severity = 'high' | 'medium' | 'low';

export type IntentType = 
  | 'comparison'
  | 'problem'
  | 'regulation'
  | 'product'
  | 'review'
  | 'brand';

// ============================================
// API Response Types
// ============================================

export interface MetricsResponse {
  date: string;
  marketShareMomentum: number;
  competitivePressure: number;
  sentimentScore: number;
  brandHeat: number;
  weekOverWeekChange: number;
}

export interface CompetitorResponse {
  id: number;
  name: string;
  searchVolume: number;
  growthRate: number;
  weeklyTrend: 'up' | 'down' | 'stable';
  riskLevel: 'high' | 'medium' | 'low';
  marketShare: number;
}

export interface AlertResponse {
  id: number;
  type: AlertType;
  severity: Severity;
  message: string;
  competitorName?: string;
  metricValue?: number;
  createdAt: string;
  isRead: boolean;
}

export interface DashboardResponse {
  lastUpdated: string;
  metrics: MetricsResponse;
  alerts: AlertResponse[];
  competitors: CompetitorResponse[];
  trendData: TrendDataPoint[];
}

export interface TrendDataPoint {
  date: string;
  yourBrand: number;
  marketAverage: number;
}

// ============================================
// DataForSEO Types
// ============================================

export interface DataForSEORequest {
  keywords: string[];
  location_code: number;
  language_code: string;
  date_from?: string;
  date_to?: string;
}

export interface DataForSEOResponse {
  tasks: DataForSEOTask[];
}

export interface DataForSEOTask {
  id: string;
  status_code: number;
  status_message: string;
  result: DataForSEOResult[];
}

export interface DataForSEOResult {
  keyword: string;
  location_code: number;
  search_volume: number;
  competition: number;
  competition_level: string;
  cpc: number;
  monthly_searches: MonthlySearch[];
}

export interface MonthlySearch {
  year: number;
  month: number;
  search_volume: number;
}

// ============================================
// Configuration Types
// ============================================

export interface BrandConfig {
  name: string;
  keywords: string[];
}

export interface MarketConfig {
  regionId: number;
  regionName: string;
  languageCode: string;
  currency: string;
}

export interface AppConfig {
  brand: BrandConfig;
  competitors: BrandConfig[];
  market: MarketConfig;
  intentKeywords: Record<IntentType, string[]>;
}
