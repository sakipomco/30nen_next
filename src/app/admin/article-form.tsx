'use client';
// 記事の入力フォーム（新規作成・編集で使い回す）。
// ボタンは「下書き保存」「投稿する」の2つ。どちらを押したかは name="intent" の値でサーバーに伝わる。
//
// 自動保存（サーバー下書き）:
//   ・10秒ごとに、内容が前回保存から変わっていれば下書きとしてDBに保存する。
//   ・新規は最初の自動保存で「下書き」として作られ、その id を見えない欄に入れる
//     → 以後の自動保存も、手動「投稿する」も同じ記事を更新する（重複しない）。
//   ・公開中(published)の記事は自動保存しない（書きかけが公開ページに出るのを防ぐ）。

import { useActionState, useEffect, useRef, useState } from 'react';
import {
  type ArticleFormState,
  autosaveArticleAction,
} from '@/app/actions/articles';
import { RichEditor } from './rich-editor';
import { FeaturedImage } from './featured-image';

type ArticleAction = (
  prevState: ArticleFormState,
  formData: FormData,
) => Promise<ArticleFormState>;

type Props = {
  action: ArticleAction;
  // この人が選べる連載（サーバー側でログイン中の人に合わせて用意して渡す）。
  categories: { id: number; name: string; depth: number }[];
  // 編集のときだけ渡す初期値（新規作成のときは undefined）
  initial?: {
    id: number;
    title: string;
    content: string;
    status?: 'draft' | 'published'; // 公開中なら自動保存しない
    featuredImagePath?: string | null; // アイキャッチ画像の初期値（保存済みのパス）
    categoryId?: number | null; // 連載の初期値（保存済み）
    publishedAtInput?: string; // 公開日時の初期値（'YYYY-MM-DDTHH:MM'・日本時間）。未公開なら空。
  };
};

// 現在時刻を「14:30」の形で返す（自動保存の表示用）。
function nowHm(): string {
  return new Date().toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ArticleForm({ action, categories, initial }: Props) {
  const [state, formAction, pending] = useActionState<
    ArticleFormState,
    FormData
  >(action, undefined);

  // 公開中の記事は自動保存しない（新規・下書きのみ自動保存する）。
  const autosaveEnabled = !initial || initial.status !== 'published';

  // 自動保存の状態表示（「自動保存しました 14:30」など）。
  const [autoSaveStatus, setAutoSaveStatus] = useState('');

  // 現在の記事id。新規は空。自動保存で下書きが作られたら確定する。
  // React管理（state）にして、見えない id 欄に確実に反映する（再描画で消えないように）。
  const [articleId, setArticleId] = useState(
    initial?.id ? String(initial.id) : '',
  );

  // 自動保存で使う覚え書き（再描画に影響しないよう ref で持つ）。
  const formRef = useRef<HTMLFormElement>(null);
  const idRef = useRef(initial?.id ? String(initial.id) : ''); // 自動保存の中から読む現在id（stateは閉包内で古くなるためref併用）
  const lastSavedRef = useRef<string | null>(null); // 前回保存した内容のスナップショット
  const savingRef = useRef(false); // 二重保存ガード
  const pendingRef = useRef(false); // 手動保存中フラグ（自動保存とぶつけない）
  // 手動保存中フラグを ref に同期（自動保存とぶつからないようにするため）。
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  // 連載の初期選択：編集なら保存済みの連載／選択肢が1つだけなら自動でそれ／それ以外は未選択。
  const defaultCategoryId =
    initial?.categoryId != null
      ? String(initial.categoryId)
      : categories.length === 1
        ? String(categories[0].id)
        : '';

  // フォームの今の入力内容を読み取る（自動保存の比較・送信に使う）。
  function readSnapshot() {
    const f = formRef.current;
    if (!f) return null;
    const val = (name: string) => {
      const el = f.elements.namedItem(name);
      return el instanceof HTMLInputElement || el instanceof HTMLSelectElement
        ? el.value
        : '';
    };
    return {
      title: val('title'),
      content: val('content'),
      categoryId: val('categoryId'),
      featuredImage: val('featuredImage'),
      publishedAt: val('publishedAt'),
    };
  }

  // 自動保存の本体。内容が変わっていれば下書きとして保存する。
  async function runAutosave() {
    if (!autosaveEnabled || savingRef.current || pendingRef.current) return;
    const snap = readSnapshot();
    if (!snap) return;

    const key = JSON.stringify(snap);
    if (key === lastSavedRef.current) return; // 前回から変化なし

    // まだ何も書いていない新規（タイトルも本文も空）は保存しない。
    const contentText = snap.content.replace(/<[^>]*>/g, '').trim();
    if (!idRef.current && snap.title.trim() === '' && contentText === '') return;

    savingRef.current = true;
    setAutoSaveStatus('自動保存中…');
    try {
      const res = await autosaveArticleAction({
        id: idRef.current ? Number(idRef.current) : null,
        title: snap.title,
        content: snap.content,
        categoryId: snap.categoryId ? Number(snap.categoryId) : null,
        featuredImage: snap.featuredImage || null,
        publishedAt: snap.publishedAt || null,
      });
      if (res.ok) {
        idRef.current = String(res.id);
        // 見えない id 欄に反映（手動「投稿する」も同じ記事を更新＝重複しない）。
        setArticleId(String(res.id));
        lastSavedRef.current = key;
        setAutoSaveStatus(`自動保存しました ${nowHm()}`);
      } else {
        setAutoSaveStatus('自動保存できませんでした（手動で保存してください）');
      }
    } catch {
      setAutoSaveStatus('自動保存できませんでした（手動で保存してください）');
    } finally {
      savingRef.current = false;
    }
  }

  // 10秒ごとに自動保存を試みる＋タブを離れるときも保存。
  useEffect(() => {
    if (!autosaveEnabled) return;
    // 起動時の内容を「保存済み」として覚える（開いた直後に無駄保存しない）。
    lastSavedRef.current = JSON.stringify(readSnapshot());
    const timer = setInterval(runAutosave, 10000);
    const onHide = () => {
      if (document.visibilityState === 'hidden') void runAutosave();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onHide);
    };
    // 起動時に一度だけ仕掛ける（runAutosave は ref 経由で最新値を読む）。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 「投稿する」(公開)を押したとき、アイキャッチ画像が未設定なら確認する（A案：必須にはしない）。
  // hidden input(name="featuredImage")の値が空＝未設定。キャンセルなら送信を止める。
  // 下書き保存のときは呼ばない。
  function handlePublishClick(e: React.MouseEvent<HTMLButtonElement>) {
    const form = e.currentTarget.form;
    const featured = form?.elements.namedItem('featuredImage');
    const isSet =
      featured instanceof HTMLInputElement && featured.value.trim() !== '';
    if (!isSet) {
      const ok = window.confirm(
        'アイキャッチ画像が未設定です。このまま公開しますか？',
      );
      if (!ok) e.preventDefault(); // キャンセル → 送信中止
    }
  }

  // プレビュー処理中の表示。
  const [previewBusy, setPreviewBusy] = useState(false);

  // 「プレビュー」ボタン：今の編集内容で別タブに公開ページの見え方を表示する。
  // - まだ id が無い新規でも、autosave を1回まわせば下書きとして id が確定する。
  // - 公開中の記事は autosave が止まっている（書きかけが公開に出るのを防ぐため）。
  //   そのときは id がすでにあるので、そのままプレビューを開く（最新の編集中は反映されない）。
  async function handlePreviewClick() {
    if (previewBusy) return;
    setPreviewBusy(true);
    try {
      // 公開中以外は最新内容を1回保存してからプレビューを開く（書いた直後を見られるように）。
      if (autosaveEnabled) {
        const snap = readSnapshot();
        const contentText = (snap?.content ?? '').replace(/<[^>]*>/g, '').trim();
        // タイトルも本文も空のまま新規プレビューはできない（保存条件と同じ）。
        if (!idRef.current && (!snap || (snap.title.trim() === '' && contentText === ''))) {
          alert('プレビューする内容（タイトルか本文）を入力してください。');
          return;
        }
        await runAutosave();
      }
      const id = idRef.current;
      if (!id) {
        alert('保存に失敗したためプレビューを開けません。少し書いてから再度お試しください。');
        return;
      }
      window.open(`/preview/${id}`, '_blank', 'noopener,noreferrer');
    } finally {
      setPreviewBusy(false);
    }
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      {/* 対象の記事id。新規は空（自動保存で確定したら入る）。React管理で再描画に強い。 */}
      <input type="hidden" name="id" value={articleId} readOnly />

      <label className="flex flex-col gap-1 text-sm">
        タイトル
        <input
          type="text"
          name="title"
          required
          defaultValue={initial?.title ?? ''}
          className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
      </label>

      <div className="flex flex-col gap-1 text-sm">
        本文
        <RichEditor name="content" initialHTML={initial?.content} />
      </div>

      <FeaturedImage name="featuredImage" initialPath={initial?.featuredImagePath} />

      <label className="flex flex-col gap-1 text-sm">
        公開日時
        <input
          type="datetime-local"
          name="publishedAt"
          defaultValue={initial?.publishedAtInput ?? ''}
          className="w-fit rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
        />
        <span className="text-xs text-zinc-500">
          空欄のまま「投稿する」を押すと今すぐ公開します。日時を選ぶと、その日時で公開します（過去の日付にも設定できます）。
        </span>
      </label>

      {/* 連載（カテゴリ）。未分類を作らないため必須。担当が1つだけなら自動で選ばれる。 */}
      <label className="flex flex-col gap-1 text-sm">
        連載
        {categories.length === 0 ? (
          <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
            連載がまだ登録されていません。管理者に連載の作成を依頼してください。
          </span>
        ) : (
          <select
            name="categoryId"
            required
            defaultValue={defaultCategoryId}
            className="w-fit rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500"
          >
            {/* 選択肢が1つに定まらないときだけ「選んでください」を出す */}
            {!defaultCategoryId && <option value="">連載を選んでください</option>}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {'　'.repeat(c.depth) + c.name}
              </option>
            ))}
          </select>
        )}
      </label>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-3">
        {/* 下書き保存 */}
        <button
          type="submit"
          name="intent"
          value="draft"
          disabled={pending}
          className="rounded-md border border-zinc-300 px-4 py-2 text-base text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-60"
        >
          {pending ? '保存中…' : '下書き保存'}
        </button>
        {/* 投稿する（公開） */}
        <button
          type="submit"
          name="intent"
          value="publish"
          disabled={pending}
          onClick={handlePublishClick}
          className="rounded-md bg-zinc-900 px-4 py-2 text-base font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
        >
          {pending ? '送信中…' : initial?.status === 'published' ? '更新する' : '投稿する'}
        </button>
        {/* プレビュー（公開ページと同じ見た目で別タブ表示） */}
        <button
          type="button"
          onClick={handlePreviewClick}
          disabled={pending || previewBusy}
          className="rounded-md border border-zinc-300 px-4 py-2 text-base text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-60"
        >
          {previewBusy ? 'プレビュー準備中…' : 'プレビュー'}
        </button>

        {/* 自動保存の状態（小さく表示） */}
        <span className="text-xs text-zinc-500">
          {autosaveEnabled
            ? autoSaveStatus
            : '公開中の記事は自動保存されません。編集後は「更新する」で保存してください。'}
        </span>
      </div>
    </form>
  );
}
