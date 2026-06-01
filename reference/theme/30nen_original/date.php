<?php get_header(); ?>
                <section class="module01">
                    <div class="fixed contact_form">
                        <h1>
                            <a href="/">
                                <img src="<?php echo esc_url(get_theme_file_uri('common/jpg/30nen_logo_noren_plus.jpg')); ?>" alt="30年商店：ロゴ">
                            </a>
                        </h1>
                        <h3 class="common_title01 mt-20">お便りフォーム</h3>
                        <?php echo do_shortcode('[contact-form-7 id="3847473" title="コンタクトフォーム 1"]'); ?>
                    </div>
                </section>
                <section class="module02">
                    <ul class="bread_crumbs flex">
                        <li><a href="/">三十年商店</a></li>
                        <li><?php echo get_the_date('Y年n月'); ?></li>
                    </ul>
                    <div class="box">
                    <h3 class="common_title01">記事一覧</h3>
                        <div class="list mt-20">
                         <ul id="post-container" class="list_inner flex mt-10">
                            <?php
                            if (have_posts()):
                                while (have_posts()): the_post(); ?>
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
                            else:
                                echo '<li>投稿が見つかりませんでした。</li>';
                            endif;
                            ?>
                        </ul>
                        <?php
                        global $wp_query;

                        $pagination_links = paginate_links([
                            'total'        => $wp_query->max_num_pages,
                            'current'      => max(1, get_query_var('paged')),
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
                                echo "<li{$class}>{$link}</li>";
                            }
                            echo '</ul>';
                        }
                        ?>
                        </div>
                    </div>




                    <ul class="bread_crumbs flex">
                        <li><a href="/">三十年商店</a></li>
                        <li><?php echo get_the_date('Y年n月'); ?></li>
                    </ul>
                    <div class="pc copy_right">
                        <small>©30YEARS ARCADE<br>This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.</small>
                    </div>
                </section>
                <section class="module03">
                    <div class="fixed">
                        <div class="linenap mt-20">
                        <h3 class="common_title01">小商店</h3>
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
                       <?php get_search_form(); ?>
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