// 画像ファイルを /api/upload に送り、保存された公開URL（/uploads/...）を受け取る小さな共通関数。
// 本文エディタの「画像」ボタンと、アイキャッチ画像の設定欄の両方から使う。

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
  };

  if (!res.ok || !data.url) {
    throw new Error(data.error ?? 'アップロードに失敗しました。');
  }
  return data.url;
}
