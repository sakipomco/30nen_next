
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
                        <li>沿革</li>
                    </ul>

                    <div class="box">
                        <h3 class="common_title01">沿革</h3>
                        <h4 class="common_title04"><strong>令和6年 | 2024年</strong></h4>
                        <div class="day_box flex mt-20">
                            <div class="txt">
                                <h5>7月</h5>
                                <p>三十年商店創業  「三十年、日記を書いてみませんか」と店主が声がけした書き手12人ではじまる</p>
                            </div>
                            <figure><img class="img_auto" src="<?php echo esc_url (get_theme_file_uri('/common/jpg/30nen_history_01.jpg')); ?>" alt=""><figcaption>吉祥寺 いせや総本店にて決起会</figcaption></figure>
                        </div>
                        <div class="day_box flex mt-20">
                            <div class="txt_100">
                                <h5>8月</h5>
                                <p>「書き手募集」への応募から、初のメンバー加入</p>
                            </div>
                        </div>
                        <div class="day_box flex mt-40">
                            <div class="txt">
                                <h5>9月</h5>
                                <p>Studioで作成されたデザイン性の高いサイト最新事例｜2024年9月版  に選出</p>
                            </div>
                            <figure><img class="img_auto" src="<?php echo esc_url (get_theme_file_uri('/common/jpg/30nen_history_02.jpg')); ?>" alt=""></figure>
                        </div>
                        <div class="day_box flex mt-20">
                            <div class="txt">
                                <h5>10月</h5>
                                <p>関田浩平氏［月刊カレンダー10月］へ、初めての広告出稿</p>
                            </div>
                            <figure><img class="img_auto" src="<?php echo esc_url (get_theme_file_uri('/common/jpg/30nen_history_03.jpg')); ?>" alt=""></figure>
                        </div>
                        <div class="day_box flex mt-20 last_line_none">
                            <div class="txt">
                                <h5>12月</h5>
                                <p>オリジナルグッズ作成（ステッカー）</p>
                            </div>
                            <figure><img class="img_auto" src="<?php echo esc_url (get_theme_file_uri('/common/jpg/30nen_history_04.jpg')); ?>" alt=""></figure>
                        </div>
                        <h4 class="common_title04"><strong>令和7年 | 2025年</span></strong></h4>
                        <div class="day_box flex mt-20">
                            <div class="txt">
                                <h5>1月</h5>
                                <p>北鎌倉 スミカ探求舎にて新年会</p>
                            </div>
                            <figure><img class="img_auto" src="<?php echo esc_url (get_theme_file_uri('/common/jpg/30nen_history_05.jpg')); ?>" alt=""></figure>
                        </div>
                        <div class="day_box flex mt-20 last_line_none">
                            <div class="txt_100">
                                <h5>6月</h5>
                                <p>StudioからWordpressへ移行</p>
                            </div>
                        </div>
                    </div>
                    <div class="box">
                        <ul class="bread_crumbs flex">
                            <li><a href="/">三十年商店</a></li>
                            <li>沿革</li>
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
