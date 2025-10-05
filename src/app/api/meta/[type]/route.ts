
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  const type = params.type;
  if (!type) {
    return NextResponse.json({ error: 'Missing component type' }, { status: 400 });
  }

  try {
    const filePath = path.join(process.cwd(), 'src', 'components', 'meta', `${type}.meta.json`);
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const metadata = JSON.parse(fileContent);
      return NextResponse.json(metadata);
    } else {
      return NextResponse.json({ error: 'Metadata not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Error reading metadata for ${type}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
