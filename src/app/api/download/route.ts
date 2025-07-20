// src/app/api/download/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Image URL is required', { status: 400 });
  }

  try {
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    const imageBlob = await imageResponse.blob();
    const headers = new Headers();
    headers.set('Content-Type', imageBlob.type);
    headers.set(
      'Content-Disposition',
      `attachment; filename="arty-ai-${Date.now()}.png"`
    );

    return new NextResponse(imageBlob, { status: 200, headers });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Download Error:', errorMessage);
    return new NextResponse(errorMessage, { status: 500 });
  }
}
