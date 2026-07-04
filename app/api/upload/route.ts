import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { storeFile } from '@/lib/storage';
import pdfParse from 'pdf-parse';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Extract the text once at upload time; the interview engine reads the
  // cached text instead of re-parsing the PDF on every turn.
  let text = '';
  try {
    const parsed = await pdfParse(buffer);
    text = parsed.text.slice(0, 3000);
  } catch {
    text = '';
  }

  const storedPath = await storeFile('reports', `${uuidv4()}.pdf`, buffer, 'application/pdf');

  return NextResponse.json({ path: storedPath, text });
}
