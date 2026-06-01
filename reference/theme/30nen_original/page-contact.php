
                <?php get_header(); ?>
                <section class="module01">
                    <div class="fixed">
                        <h1>
                        <a href="/"><img src="<?php echo esc_url (get_theme_file_uri('/common/jpg/30nen_logo_noren_plus.jpg')); ?>" alt="30年商店：ロゴ"></a>
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
                            <p><?php echo nl2br(esc_html($text)); ?></p>
                            <ul class="sns flex">
                                <li><a target="_blank" href="https://www.instagram.com/30nen_syouten/">instagram</a></li>
                                <span class="sns-separator">|</span>
                                <li><a target="_blank" href="https://x.com/30nensyouten">x</a></li>
                            </ul>
                        <a href="/about" class="link_btn">三十年商店とは？</a>
                    </div>
                </section>
                <section class="module02">
                    <ul class="bread_crumbs flex">
                        <li><a href="/">三十年商店</a></li>
                        <li>お便りフォーム</li>
                    </ul>
                    <div class="box">
                        <h3 class="common_title01">お便りフォーム</h3>
                        <?php echo do_shortcode('[contact-form-7 id="3847473" title="コンタクトフォーム 1"]'); ?>
                    </div>
                    <div class="box">
                        <ul class="bread_crumbs flex">
                            <li><a href="/">三十年商店</a></li>
                            <li>お便りフォーム</li>
                        </ul>
                    </div>
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
