import { google } from 'googleapis';
import { getValidAccessToken } from './tokenManager';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

export async function getGa4Metrics(tenantId: string): Promise<{
  sessions: number;
  users: number;
  newUsers: number;
  bounceRate: number;
  topSources: Array<{ source: string; sessions: number }>;
}> {
  const access_token = await getValidAccessToken(tenantId, 'google');

  oauth2Client.setCredentials({ access_token });

  const analyticsdata = google.analyticsdata({ version: 'v1beta', auth: oauth2Client });
  const property = `properties/${process.env.GA4_PROPERTY_ID}`;
  const dateRanges = [{ startDate: '7daysAgo', endDate: 'today' }];

  const [overallResponse, sourcesResponse] = await Promise.all([
    analyticsdata.properties.runReport({
      property,
      requestBody: {
        dateRanges,
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'newUsers' },
          { name: 'bounceRate' },
        ],
      },
    }),
    analyticsdata.properties.runReport({
      property,
      requestBody: {
        dateRanges,
        dimensions: [{ name: 'sessionSource' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 5,
      },
    }),
  ]);

  const row = overallResponse.data.rows?.[0];
  const sessions = parseInt(row?.metricValues?.[0]?.value ?? '0', 10);
  const users = parseInt(row?.metricValues?.[1]?.value ?? '0', 10);
  const newUsers = parseInt(row?.metricValues?.[2]?.value ?? '0', 10);
  const bounceRate = parseFloat(row?.metricValues?.[3]?.value ?? '0') * 100;

  const topSources = (sourcesResponse.data.rows ?? []).map((r) => ({
    source: r.dimensionValues?.[0]?.value ?? '(unknown)',
    sessions: parseInt(r.metricValues?.[0]?.value ?? '0', 10),
  }));

  return { sessions, users, newUsers, bounceRate, topSources };
}
