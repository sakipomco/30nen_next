// 共通の「もっと見る」ボタン処理
document.addEventListener('DOMContentLoaded', function () {
    const loadMoreBtn = document.getElementById('load-more');
    const postContainer = document.getElementById('post-container');

    if (!loadMoreBtn) return;

    loadMoreBtn.addEventListener('click', function () {
        const currentPage = parseInt(this.dataset.page);
        const nextPage = currentPage + 1;
        const categoryId = this.dataset.cat || ''; // front-page では空文字になる

        const params = new URLSearchParams({
            action: 'load_more_posts',
            paged: nextPage,
        });

        if (categoryId) {
            params.append('category', categoryId);
        }

        fetch(ajaxurl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        })
        .then(response => response.text())
        .then(data => {
            if (data.trim() === '') {
                loadMoreBtn.style.display = 'none';
            } else {
                postContainer.insertAdjacentHTML('beforeend', data);
                loadMoreBtn.dataset.page = nextPage;
            }
        });
    });
});