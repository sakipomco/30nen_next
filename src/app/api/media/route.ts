// 画像フォルダの一覧を返す API（画像ピッカー用）。
// GET /api/media?page=1 → { urls: string[], totalPages: number }
// ログイン必須。

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/auth/session';
import { listUploadedImageFiles } from '@/lib/media';

const PER_PAGE = 48;

export async function GET(req: NextRequest) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const page = Math.max(1, Number(req.nextUrl.searchParams.get('page')) || 1);
  const files = await listUploadedImageFiles();
  const total = files.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const start = (page - 1) * PER_PAGE;
  const urls = files.slice(start, start + PER_PAGE).map((f) => f.url);

  return NextResponse.json({ urls, totalPages, page });
}
