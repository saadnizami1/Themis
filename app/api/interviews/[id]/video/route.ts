import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { caseUnlocked } from '@/lib/case-lock';
import { storeFile, retrieveFile, createSignedUpload, createSignedDownloadUrl } from '@/lib/storage';

async function authorizeWitness(id: string, token: string | null) {
  if (!token) return null;
  const interview = await prisma.interview.findUnique({
    where: { id },
    select: { accessToken: true },
  });
  if (!interview || interview.accessToken !== token) return null;
  return interview;
}

// Step 1 (production): mint a signed URL so the browser uploads the recording
// directly to Supabase Storage, recordings never pass through the serverless
// function (which caps request bodies at ~4.5 MB).
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = req.nextUrl.searchParams.get('token');
  if (!(await authorizeWitness(params.id, token))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const key = `${params.id}-${Date.now()}.webm`;
  const signed = await createSignedUpload('videos', key);
  if (!signed) {
    // Supabase not configured (local dev), client should POST the blob instead
    return NextResponse.json({ mode: 'proxy' });
  }
  return NextResponse.json({ mode: 'direct', signedUrl: signed.signedUrl, storedPath: signed.storedPath });
}

// Step 2: record the stored path after a direct upload (JSON body),
// or accept the raw blob as a dev fallback when Supabase isn't configured.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = req.nextUrl.searchParams.get('token');
  if (!(await authorizeWitness(params.id, token))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const contentType = req.headers.get('content-type') || '';

  let storedPath: string;
  if (contentType.includes('application/json')) {
    const body = await req.json();
    storedPath = String(body.storedPath || '');
    // Only accept paths this interview's signed-upload step could have produced
    if (!storedPath.startsWith(`supabase://videos/${params.id}-`)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }
  } else {
    const buffer = Buffer.from(await req.arrayBuffer());
    const key = `${params.id}-${Date.now()}.webm`;
    storedPath = await storeFile('videos', key, buffer, 'video/webm');
  }

  await prisma.interview.update({
    where: { id: params.id },
    data: { videoPath: storedPath },
  });

  return NextResponse.json({ ok: true });
}

// Serve video (authenticated officers only; PIN-locked cases need the key)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  const officerId = (session.user as { id?: string }).id;

  const interview = await prisma.interview.findFirst({
    where: {
      id: params.id,
      case: { officerId },
    },
    include: { case: { select: { id: true, pinHash: true } } },
  });

  if (!interview || !interview.videoPath) {
    return new NextResponse('Not found', { status: 404 });
  }
  if (!caseUnlocked(interview.case, req)) {
    return new NextResponse('This case is PIN-protected', { status: 403 });
  }

  // Prefer a time-limited signed URL so the recording streams straight from
  // storage (fast, supports range requests) instead of through this function.
  const signedUrl = await createSignedDownloadUrl(interview.videoPath);
  if (signedUrl) return NextResponse.redirect(signedUrl);

  const buffer = await retrieveFile(interview.videoPath);
  if (!buffer) return new NextResponse('Not found', { status: 404 });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'video/webm',
      'Content-Disposition': `inline; filename="interview-${params.id}.webm"`,
    },
  });
}
