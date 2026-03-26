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
      team_name_en,
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

    // Columns A–O (15 columns)
    const row = [
      id,                                    // A: id
      team_name,                             // B: team_name (Hebrew)
      league || '',                          // C: league
      season || '',                          // D: season
      type || 'regular',                     // E: type
      category || '',                        // F: category
      image_url,                             // G: image_url
      additional_images || '',               // H: additional_images
      is_world_cup || 'false',               // I: is_world_cup
      international_team || '',              // J: international_team
      available_sizes || 'S,M,L,XL,XXL',    // K: available_sizes
      tags || '',                            // L: tags
      is_long_sleeve || 'false',             // M: is_long_sleeve
      new Date().toISOString(),              // N: created_at
      team_name_en || '',                    // O: team_name_en
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:O`,
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
