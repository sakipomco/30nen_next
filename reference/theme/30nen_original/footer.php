<footer class="footer_icon">
                    <div class="w_100">
                        <ul>
                            
                            <li><a target="_blank" href="https://www.instagram.com/30nen_syouten/"><img src="<?php echo esc_url (get_theme_file_uri('common/jpg/Icon_insta.svg')); ?>"></a></li>
                            <li><a target="_blank" href="https://x.com/30nensyouten"><img src="<?php echo esc_url (get_theme_file_uri('common/jpg/Icon_x.svg')); ?>"></a></li>
                            <li><a href="<?php echo esc_url(home_url('/contact')); ?>"><img src="<?php echo esc_url (get_theme_file_uri('common/jpg/Icon_mail.svg')); ?>"></a></li>
                        </ul>
                    </div>
                    <div class="sp copy_right">
                        <small>©30YEARS ARCADE<br>This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.</small>
                    </div>
                    
                </footer>
            </div>
        </div>
</main>
<script src="<?php echo esc_url (get_theme_file_uri('common/js/common.js')); ?>"></script>
<script src="<?php echo esc_url (get_theme_file_uri('common/js/custom-profile-image.js')); ?>"></script>
<script>
jQuery(document).ready(function($) {
    var currentPage = 2;

    $('#load-more').on('click', function() {
        $.ajax({
            url: '<?php echo admin_url('admin-ajax.php'); ?>'
            type: 'POST',
            data: {
                action: 'load_more_posts',
                page: currentPage
            },
            success: function(response) {
                if (response) {
                    $('#post-container').append(response);
                    currentPage++;
                } else {
                    $('#load-more').hide(); // 投稿がなければボタンを非表示
                }
            }
        });
    });
});
</script>
<script>
document.addEventListener('DOMContentLoaded', function () {
    const loadMoreBtn = document.getElementById('load-more');
    const postContainer = document.getElementById('post-container');

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function () {
            const page = parseInt(loadMoreBtn.dataset.page);

            loadMoreBtn.disabled = true;
            loadMoreBtn.textContent = '読み込み中...';

            fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                body: new URLSearchParams({
                    action: 'load_more_posts',
                    page: page
                })
            })
            .then(response => response.text())
            .then(data => {
                if (data.trim()) {
                    postContainer.insertAdjacentHTML('beforeend', data);
                    loadMoreBtn.dataset.page = page + 1;
                    loadMoreBtn.disabled = false;
                    loadMoreBtn.textContent = 'もっと探る';
                } else {
                    loadMoreBtn.textContent = 'これ以上ありません';
                }
            })
            .catch(error => {
                console.error(error);
                loadMoreBtn.textContent = 'エラーが発生しました';
            });
        });
    }
});
</script>
<?php wp_footer(); ?>
</body>
</html>