// 画像フォルダの一覧を返す API（画像ピッカー用）。
// GET /api/media?page=1&y=2025&m=07 → { urls, totalPages, page, yearMonths }
// y=年・m=月は任意（付けなければ全件）。yearMonths はプルダウンの選択肢用。
// ログイン必須。

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/auth/session';
import {
  listUploadedImageFiles,
  collectYearMonths,
  filterByYearMonth,
} from '@/lib/media';

const PER_PAGE = 48;

export async function GET(req: NextRequest) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const page = Math.max(1, Number(req.nextUrl.searchParams.get('page')) || 1);
  const yParam = req.nextUrl.searchParams.get('y') ?? '';
  const mParam = req.nextUrl.searchParams.get('m') ?? '';
  const year = /^\d{4}$/.test(yParam) ? yParam : '';
  const month = year && /^\d{2}$/.test(mParam) ? mParam : '';

  const allFiles = await listUploadedImageFiles();
  const yearMonths = collectYearMonths(allFiles);
  const files = filterByYearMonth(allFiles, year, month);

  const total = files.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const start = (page - 1) * PER_PAGE;
  const urls = files.slice(start, start + PER_PAGE).map((f) => f.url);

  return NextResponse.json({ urls, totalPages, page, yearMonths });
}
