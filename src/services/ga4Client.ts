import { google } from 'googleapis';
import { getValidAccessToken } from './tokenManager';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

export async function getGa4Metrics(tenantId: string): Promise<{ sessions: number; users: number }> {
  const access_token = await getValidAccessToken(tenantId, 'google');

  oauth2Client.setCredentials({
    access_token,
  });

  const analyticsdata = google.analyticsdata({ version: 'v1beta', auth: oauth2Client });

  const response = await analyticsdata.properties.runReport({
    property: `properties/${process.env.GA4_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
      ],
    },
  });

  const row = response.data.rows?.[0];
  const sessions = parseInt(row?.metricValues?.[0]?.value ?? '0', 10);
  const users = parseInt(row?.metricValues?.[1]?.value ?? '0', 10);

  return { sessions, users };
}
