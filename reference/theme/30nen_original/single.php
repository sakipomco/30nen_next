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
                        <li>
                            <?php
                            $category = get_the_category();
                            if (!empty($category)) {
                                $cat_link = get_category_link($category[0]->term_id);
                                echo '<a href="' . esc_url($cat_link) . '">' . esc_html($category[0]->name) . '</a>';
                            }
                            ?>
                        </li>
                        <li><?php the_title(); ?></li>
                    </ul>
                    <div class="box">
                        <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
                        <div class="common_title03 flex">
                            <?php
                            $categories = get_the_category();
                            if (!empty($categories)) {
                                $cat = $categories[0];

                                // カテゴリー画像
                                $category_image = get_term_meta($cat->term_id, 'category_image', true);
                                $category_image = !empty($category_image) ? esc_url($category_image) : get_theme_file_uri('common/jpg/line-up.png');

                                // カテゴリー名
                                $category_name = esc_html($cat->name);

                                // ふりがな（term meta に保存しているもの）
                                $category_kana = get_term_meta($cat->term_id, 'category_kana', true);
                            ?>
                                <div class="margin"><img src="<?php echo $category_image; ?>" alt="<?php echo $category_name; ?>"></div>
                                <p><?php echo $category_name; ?><br><span class="letter_sp"><?php echo esc_html($category_kana); ?></span></p>
                            <?php } ?>
                        </div>
                        <div class="main_txt">
                            <p class="Post_date"><?php echo get_the_date('Y年n月j日'); ?></p>
                            <h3 class="title"><?php the_title(); ?></h3>
                            <div class="img_auto"><?php echo the_content(); ?></div>
                            <ul class="category_arrow flex">
                                <li>
                                    <?php
                                    $next_post = get_next_post(true); // ← 同様に true を渡す
                                    if (!empty($next_post)) :
                                    ?>
                                        <a href="<?php echo get_permalink($next_post->ID); ?>">
                                            <img src="<?php echo esc_url(get_theme_file_uri('/common/jpg/Icon_arrow_left.png')); ?>" alt="次の記事">
                                        </a>
                                    <?php endif; ?>
                                </li>
                                <li>
                                    <?php
                                    $prev_post = get_previous_post(true); // ← 引数 true で「同カテゴリ」指定
                                    if (!empty($prev_post)) :
                                    ?>
                                        <a href="<?php echo get_permalink($prev_post->ID); ?>">
                                            <img src="<?php echo esc_url(get_theme_file_uri('/common/jpg/Icon_arrow_left.png')); ?>" alt="前の記事">
                                        </a>
                                    <?php endif; ?>
                                </li>
                            </ul>
                        </div>
                        <?php endwhile; endif; ?>
                    <div class="box mt-40">
                        <h3 class="common_title01">関連記事</h3>
                       <ul class="detail_random mt-20">
                            <?php
                            $current_id = get_the_ID(); // 現在の投稿IDを取得
                            $categories = wp_get_post_categories($current_id); // カテゴリーIDを取得

                            $args = array(
                                'post__not_in'   => array($current_id),
                                'posts_per_page' => 3,
                                'orderby'        => 'rand',
                                'post_status'    => 'publish',
                                'category__in'   => $categories, // 追加：同じカテゴリに限定
                            );

                            $random_posts = new WP_Query($args);

                            if ($random_posts->have_posts()) :
                                while ($random_posts->have_posts()) : $random_posts->the_post();
                            ?>
                                <li>
                                    <a href="<?php the_permalink(); ?>">
                                        <div class="flex">
                                            <figure>
                                                <?php if (has_post_thumbnail()) : ?>
                                                    <?php the_post_thumbnail('large'); ?>
                                                <?php else : ?>
                                                    <img src="<?php echo esc_url(get_theme_file_uri('/common/jpg/dammy_img01.jpg')); ?>" alt="<?php the_title_attribute(); ?>">
                                                <?php endif; ?>
                                            </figure>
                                            <div class="text">
                                                <h3><?php the_title(); ?></h3>
                                                <p><?php echo wp_trim_words(get_the_excerpt(), 60, '...'); ?></p>
                                            </div>
                                        </div>
                                    </a>
                                </li>
                            <?php
                                endwhile;
                                wp_reset_postdata();
                            endif;
                            ?>
                        </ul>
                    </div>
                    <?php
                    $author_id = get_the_author_meta('ID');
                    $author_name = get_the_author_meta('display_name', $author_id);
                    $birthplace = get_the_author_meta('birthplace', $author_id);
                    $age = get_the_author_meta('age', $author_id);
                    $instagram = get_the_author_meta('instagram', $author_id);
                    $avatar = get_avatar_url($author_id); // WordPressのプロフィール画像
                    ?>

                    <div class="box writer mt-40">
                        <h3 class="common_title01">書き手</h3>
                        <div class="lineup_profile mb-40 flex">
                                <?php
                                $author_id = get_the_author_meta('ID');
                                $custom_avatar = get_the_author_meta('custom_profile_image', $author_id);
                                $avatar_url = $custom_avatar ? esc_url($custom_avatar) : get_avatar_url($author_id);
                                ?>
                                <figure><img src="<?php echo $avatar_url; ?>" alt="<?php echo esc_attr(get_the_author_meta('display_name', $author_id)); ?>"></figure>

                            <div class="profile_text">
                                <h2><?php echo esc_html($author_name); ?></h2>
                                <p class="text_01"><?php echo esc_html($birthplace); ?>／<?php echo esc_html($age); ?>歳</p>
                                <?php
                                    $instagram = get_the_author_meta('instagram', $author_id);
                                    $x_account = get_the_author_meta('x_account', $author_id);
                                    $youtube = get_the_author_meta('youtube', $author_id);
                                    $website = get_the_author_meta('website', $author_id);
                                    ?>

                                    <?php if (!empty($instagram) || !empty($x_account) || !empty($youtube) || !empty($website)) : ?>
                                        <div class="sns flex">
                                            <?php if (!empty($instagram)) : ?>
                                                <a href="<?php echo esc_url($instagram); ?>" target="_blank" rel="noopener">
                                                    <img src="<?php echo get_theme_file_uri('/common/jpg/Icon_insta.svg'); ?>" alt="Instagram">
                                                </a>
                                            <?php endif; ?>
                                            <?php if (!empty($x_account)) : ?>
                                                <a href="<?php echo esc_url($x_account); ?>" target="_blank" rel="noopener">
                                                    <img src="<?php echo get_theme_file_uri('/common/jpg/Icon_x.svg'); ?>" alt="X（旧Twitter）">
                                                </a>
                                            <?php endif; ?>
                                            <?php if (!empty($youtube)) : ?>
                                                <a href="<?php echo esc_url($youtube); ?>" target="_blank" rel="noopener">
                                                    <img src="<?php echo get_theme_file_uri('/common/jpg/youtube.svg'); ?>" alt="YouTube">
                                                </a>
                                            <?php endif; ?>
                                            <?php if (!empty($website)) : ?>
                                                <a href="<?php echo esc_url($website); ?>" target="_blank" rel="noopener">
                                                    <img src="<?php echo get_theme_file_uri('/common/jpg/website.svg'); ?>" alt="Webサイト">
                                                </a>
                                            <?php endif; ?>
                                        </div>
                                    <?php endif; ?>

                            </div>
                        </div>
                    </div>
                    <div class="box mt-40">
                    <ul class="category_thumbnail flex">
                        <li>
                            <?php
                            $next_post = get_next_post(false);
                            if (!empty($next_post)) :
                                $next_thumbnail = get_the_post_thumbnail_url($next_post->ID, 'large');
                                if (!$next_thumbnail) {
                                    $next_thumbnail = esc_url(get_theme_file_uri('/common/jpg/dammy_img01.jpg'));
                                }
                            ?>
                                <a href="<?php echo get_permalink($next_post->ID); ?>" class="arrow-link next">
                                    <img src="https://30nen.com/wp-content/themes/30nen_original/common/jpg/Icon_arrow_left.png" alt="次の記事へ" class="arrow-icon arrow-right">
                                    <img src="<?php echo $next_thumbnail; ?>" alt="<?php echo esc_attr(get_the_title($next_post->ID)); ?>">
                                    <p><?php echo get_the_date('n月j日 G時i分', $next_post->ID); ?></p>
                                </a>
                            <?php endif; ?>
                        </li>
                        <li>
                            <?php
                            $prev_post = get_previous_post(false);
                            if (!empty($prev_post)) :
                                $prev_thumbnail = get_the_post_thumbnail_url($prev_post->ID, 'large');
                                if (!$prev_thumbnail) {
                                    $prev_thumbnail = esc_url(get_theme_file_uri('/common/jpg/dammy_img01.jpg'));
                                }
                            ?>
                                <a href="<?php echo get_permalink($prev_post->ID); ?>" class="arrow-link prev">
                                    <img src="https://30nen.com/wp-content/themes/30nen_original/common/jpg/Icon_arrow_left.png" alt="前の記事へ" class="arrow-icon arrow-left">
                                    <img src="<?php echo $prev_thumbnail; ?>" alt="<?php echo esc_attr(get_the_title($prev_post->ID)); ?>">
                                    <p><?php echo get_the_date('n月j日 G時i分', $prev_post->ID); ?></p>
                                </a>
                            <?php endif; ?>
                        </li>
                    </ul>
                                        </div>
                    <ul class="bread_crumbs flex">
                        <li><a href="/">三十年商店</a></li>
                        <li>
                            <?php
                            $category = get_the_category();
                            if (!empty($category)) {
                                $cat_link = get_category_link($category[0]->term_id);
                                echo '<a href="' . esc_url($cat_link) . '">' . esc_html($category[0]->name) . '</a>';
                            }
                            ?>
                        </li>
                        <li><?php the_title(); ?></li>
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
								'parent'     => 0,    //
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
