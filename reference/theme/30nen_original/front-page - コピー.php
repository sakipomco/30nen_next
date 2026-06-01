                <?php get_header(); ?>
                <section class="module01">
                    <div class="fixed">
                        <h1>
                            <a href="/30nen"><img src="<?php echo esc_url (get_theme_file_uri('common/jpg/30nen_logo_noren_plus.jpg')); ?>" alt="30年商店：ロゴ"></a>
                        </h1>
                        <p>ここに並ぶのは、<br>何気ない日常の断片や、<br>とりとめのない思考、<br>暮らしのメモの独り言のような心ウチ。<br>手にとれる商品やサービスは無いけれど、<br>その時々に探している答えのヒントが、<br>いつかの誰かのお供になる石が、<br>きっとここに。<br>三十年商店、どうぞご贔屓に。</p>
                        <ul class="sns flex">
                            <li><a target="_blank" href="https://www.instagram.com/30nen_syouten/">instagram</a></li>
                            <li><a target="_blank" href="https://x.com/30nensyouten">x</a></li>
                        </ul>
						<a href="https://30nen.com/about/#wanted">
    <img src="https://30nen.com/wp-content/uploads/2026/05/kakite_kotira.png" alt="書き手募集はこちらから！">
</a>
                        <a href="/30nen/about/" class="link_btn">三十年商店とは？</a>
                    </div>
                </section>

                <section class="module02">
                    <ul class="bread_crumbs flex">
                        <li>三十年商店</li>
                    </ul>
                    <div class="Top_article latest">
                    <h3 class="common_title01">最新</h3>
                    <?php
                        $args = array(
                            'post_type' => 'post',
                            'posts_per_page' => 1,
                            'paged' => 1,
                        );
                        $query = new WP_Query($args);
                        if ($query->have_posts()):
                            while ($query->have_posts()): $query->the_post(); ?>
                                        <a href="<?php the_permalink(); ?>">
                                            <div class="potion mt-10">
                                            <?php if (has_post_thumbnail()) {
                                            the_post_thumbnail('medium');
                                        } else { ?>
                                            <img src="<?php echo esc_url(get_theme_file_uri('common/jpg/dammy.jpg')); ?>" alt="">
                                        <?php } ?>
                                        <?php
                                        $face_icon_url = get_theme_file_uri('common/jpg/face_dammy.jpg'); // デフォルト画像

                                        $categories = get_the_category();
                                        if (!empty($categories)) {
                                            $cat_id = $categories[0]->term_id;
                                            $category_image = get_term_meta($cat_id, 'category_image', true);
                                            if (!empty($category_image)) {
                                                $face_icon_url = esc_url($category_image);
                                            }
                                        }
                                        ?>
                                        <img class="face_icon" src="<?php echo $face_icon_url; ?>" alt="顔ぶれ">
                                            </div>
                                            <p class="date"><?php echo get_the_date('n月j日 G時i分'); ?></p>
                                            <h2><?php the_title(); ?></h2>
                                        </a>
                                        <?php endwhile;
                            wp_reset_postdata();
                        endif;
                        ?>
                    </div>
                    <div class="list mt-40">
    <h3 class="common_title01">記事一覧</h3>
    <ul id="post-container" class="list_inner flex mt-10">
        <?php
        $args = array(
    'post_type' => 'post',
    'posts_per_page' => 12,
    'offset' => 1, // 最新記事をスキップ
    'paged' => 1,  // 形式維持のため入れておくが使われない
);
        $query = new WP_Query($args);
        if ($query->have_posts()):
            while ($query->have_posts()): $query->the_post(); ?>
                <li>
                    <a href="<?php the_permalink(); ?>">
                        <?php if (has_post_thumbnail()) {
                            the_post_thumbnail('medium');
                        } else { ?>
                            <img src="<?php echo esc_url(get_theme_file_uri('common/jpg/dammy.jpg')); ?>" alt="">
                        <?php } ?>
                        <p class="writer">
                        <?php
                        $category = get_the_category();
                        if (!empty($category)) {
                            echo '【' . esc_html($category[0]->name) . '】';
                        }
                        ?>
                    <span class="date"><?php echo get_the_date('Y年n月j日'); ?></span>
                    </p>
                        <h2><?php the_title(); ?></h2>
                    </a>
                </li>
            <?php endwhile;
            wp_reset_postdata();
        endif;
        ?>
    </ul>
</div>

<div style="text-align: center;">
    <button id="load-more" data-page="2">もっと探る</button>
</div>
                    <div class="pc copy_right">
                        <small>©30YEARS ARCADE</small>
                    </div>
                </section>
                <section class="module03">
                    <div class="fixed">
                    <div class="linenap mt-20">
                        <h3 class="common_title01">顔ぶれ</h3>
                        <ul class="line-up flex">
                            <?php
                            $categories = get_categories(array(
                                'hide_empty' => false, // 投稿のないカテゴリも含める場合は false
                                'exclude' => get_cat_ID('未分類'), // または 'uncategorized'
                            ));

                            foreach ($categories as $cat) {
                                // デフォルト画像をセット
                                $category_image_url = get_theme_file_uri('common/jpg/line-up.png');

                                // カスタムフィールド画像があれば差し替え
                                $custom_image = get_term_meta($cat->term_id, 'category_image', true);
                                if (!empty($custom_image)) {
                                    $category_image_url = esc_url($custom_image);
                                }

                                $category_link = get_category_link($cat->term_id);
                            ?>
                                <li>
                                    <a class="sd" href="<?php echo esc_url($category_link); ?>">
                                        <img src="<?php echo esc_url($category_image_url); ?>" alt="<?php echo esc_attr($cat->name); ?>">
                                        <div class="date01 appear"></div>
                                        <div class="date02 appear"></div>
                                        <div class="date03 appear"></div>
                                        <div class="date04 appear"></div>
                                    </a>
                                </li>
                            <?php } ?>
                        </ul>

                    </div>
                    <div class="serch mt-40">
                        <h3 class="common_title01">検索</h3>
                        <p>検索窓を入れる※プライグイン実装</p>
                    </div>
                    <div class="archive mt-40">
                    <h3 class="common_title01">アーカイブ</h3>
                        <ul>
                            <?php
                                wp_get_archives(array(
                                    'type'            => 'monthly',
                                    'limit'           => 24, // 表示する月数（必要なら増やす）
                                    'show_post_count' => false, // 件数表示したい場合は true
                                ));
                            ?>
                        </ul>
                    </div>
                    </div>
                </section>
                <?php get_footer(); ?>
