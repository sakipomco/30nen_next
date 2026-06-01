<?php get_header(); ?>

<section class="TOP_F_content module01">
    <div class="fixed">
        <h1>
            <a href="/">
                <img src="<?php echo esc_url(get_theme_file_uri('common/jpg/30nen_logo_noren_plus.jpg')); ?>" alt="30年商店：ロゴ">
            </a>
        </h1>
        <?php
        // 「共通設定」ページのスラッグからページIDを取得
        $common_page = get_page_by_path('common-settings');
        $common_id = $common_page->ID;

        // 画像フィールドの取得（返り値＝配列として設定しておくと便利）
        $logo = get_field('free_img', $common_id);
        $text = get_field('free', $common_id);
        ?>
        <div class="free_img">
        <?php if( $logo ): ?>
        <img src="<?php echo esc_url($logo['url']); ?>" alt="<?php echo esc_attr($logo['alt']); ?>">
        <?php endif; ?>
        </div>
        <?php if (wp_is_mobile()): ?>
		<p style="margin-top: -5px;"><?php echo nl2br(esc_html($text)); ?></p>
		<?php else: ?>
		<p><?php echo nl2br(esc_html($text)); ?></p>
		<?php endif; ?>
        <ul class="sns flex">
            <li><a target="_blank" href="https://www.instagram.com/30nen_syouten/">instagram</a></li>
            <span class="sns-separator">|</span>
            <li><a target="_blank" href="https://x.com/30nensyouten">x</a></li>
        </ul>
<?php if (wp_is_mobile()) : ?>
<div style="text-align: center; margin-top: 20px;">
    <a href="https://30nen.com/about/#wanted">
        <img src="https://30nen.com/wp-content/uploads/2026/05/kakite_kotira3.png" alt="書き手募集はこちらから！" style="width: 125px;">
    </a>
</div>
<?php endif; ?>
        <a href="/about" class="link_btn">三十年商店とは？</a>
    </div>
</section>

<section class="module02">
    <ul class="bread_crumbs flex">
        <li>三十年商店</li>
    </ul>

    <!-- 最新記事 -->
    <div class="Top_article latest">
        <h3 class="common_title01">最新</h3>
        <?php
        $latest = new WP_Query(['post_type' => 'post', 'posts_per_page' => 1]);
        if ($latest->have_posts()) {
            $latest->the_post();
            output_post_card(null, true, false, true);
            wp_reset_postdata();
        }
        ?>
    </div>


    <!-- 記事一覧 -->
    <div class="list mt-40">
        <h3 class="common_title01">記事一覧</h3>
        <ul id="post-container" class="list_inner flex mt-10">
            <?php
            $paged = get_query_var('paged') ? get_query_var('paged') : 1;
            $is_sp = wp_is_mobile(); // ← スマホ判定！

            $posts_per_page = 12;
            $base_offset = $is_sp ? 0 : 1; // スマホは0、PCは1記事スキップ
            $offset = $base_offset + ($paged - 1) * $posts_per_page; // ← ページ数に応じて計算！

            $custom_query = new WP_Query([
                'post_type'      => 'post',
                'posts_per_page' => $posts_per_page,
                'paged'          => $paged,
                'offset'         => $offset,
            ]);

            if ($custom_query->have_posts()) {
                while ($custom_query->have_posts()) {
                    $custom_query->the_post();
                    echo '<li>';
                    output_post_card(null, false, true, false); // 顔なし・カテゴリ表示・時間なし
                    echo '</li>';
                }
                wp_reset_postdata();
            }
            ?>
        </ul>
       <div class="pagination">
            <?php
            $pagination_links = paginate_links([
                'total'        => $custom_query->max_num_pages,
                'current'      => $paged,
                'mid_size'     => 2,
                'end_size'     => 1,
                'prev_text'    => '«',
                'next_text'    => '»',
                'type'         => 'array',
            ]);

            if ($pagination_links) {
                echo '<ul class="pagination">';
                foreach ($pagination_links as $link) {
                    $class = strpos($link, 'current') !== false ? ' class="active"' : '';
                    echo '<li' . $class . '>' . $link . '</li>';
                }
                echo '</ul>';
            }
            ?>
        </div>
    </div>



    <div class="pc copy_right">
        <small>©30YEARS ARCADE<br>This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.</small>
    </div>
</section>

<section class="module03">
    <div class="fixed">

        <!-- 顔ぶれ（カテゴリ一覧） -->
        <div class="linenap mt-20">
            <h3 class="common_title01">小商店</h3>
            <ul class="line-up flex">
                <?php output_category_faces(); ?>
            </ul>
        </div>

        <!-- 検索（仮置き） -->
        <div class="serch mt-40">
            <h3 class="common_title01">検索</h3>
            <?php get_search_form(); ?>
        </div>

        <!-- アーカイブ -->
        <div class="archive mt-40">
            <h3 class="common_title01">アーカイブ</h3>
            <ul>
                <?php
                wp_get_archives([
                    'type' => 'monthly',
                    'limit' => 24,
                    'show_post_count' => false,
                ]);
                ?>
            </ul>
        </div>

    </div>
</section>

<?php get_footer(); ?>
