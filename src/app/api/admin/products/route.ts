import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { invalidateJerseysCache } from '@/lib/google-sheets';
import { SHEET_NAME } from '@/lib/constants';

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      team_name,
      league,
      season,
      type,
      category,
      image_url,
      additional_images,
      is_world_cup,
      international_team,
      available_sizes,
      tags,
      is_long_sleeve,
    } = body;

    if (!id || !team_name || !image_url) {
      return NextResponse.json(
        { error: 'Missing required fields: id, team_name, image_url' },
        { status: 400 }
      );
    }

    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const row = [
      id,
      team_name,
      league || '',
      season || '',
      type || 'regular',
      category || '',
      image_url,
      additional_images || '',
      is_world_cup || 'false',
      international_team || '',
      available_sizes || 'S,M,L,XL,XXL',
      tags || '',
      is_long_sleeve || 'false',
      new Date().toISOString(),
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:N`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });

    // Bust the cache so the new product shows up
    invalidateJerseysCache();

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Admin POST /products error:', error);
    return NextResponse.json(
      { error: 'Failed to add product' },
      { status: 500 }
    );
  }
}
