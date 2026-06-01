
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
                        <a href="/about/" class="link_btn">三十年商店とは？</a>
                    </div>
                </section>
                <section class="module02">
                    <ul class="bread_crumbs flex">
                        <li><a href="/">三十年商店</a></li>
                        <li>プライバシーポリシー</li>
                    </ul>
                    <div class="box">
                        <h3 class="common_title01">プライバシーポリシー</h3>
                        <p>当ブログをご覧いただき、誠にありがとうございます。［三十年商店］（以下、本サイト）は、ご訪問者が安心してご利用頂けるよう、個人情報の保護に最大限の注意を払います。 本サイトの個人情報保護方針は以下の通りです。</p>
                        <h4 class="common_title02">個人情保護方針</h4>
                        <p>ご利用者の登録された個人および法人の情報については、本サイトにおいての機能やサービスを提供するためのみに利用します。個人及び法人の登録情報の保護に細心の注意を払います。ご利用者の同意なく、適用範囲を超えて登録情報を利用することはありません。</p>
                        <p>ご利用者の登録された個人および法人の情報については、本サイトにおいての機能やサービスを提供するためのみに利用します。個人及び法人の登録情報の保護に細心の注意を払います。ご利用者の同意なく、適用範囲を超えて登録情報を利用することはありません。</p>
                        <p>ご利用者が本サイトのサービス（含む”お問い合わせ”）をご利用の際に記載した個人・法人情報は、守秘義務を徹底し厳重に管理致します。また、サイトのセキュリティの向上に努め、より安心してご利用頂けるように配慮してまいります。</p>
                        <p>ご利用者からご提供頂いた個人・法人のプライベートな情報は、ご利用者の同意がない限り第三者に開示することはありません。ただし、法律に基づき公的機関から要請があった場合や、法令に特別の規定がある場合、お客様や公衆の生命、健康、資産等に重大な損害が発生する恐れがある場合には、適用外となります。</p>
                        <p>個人情報保護のため、必要に応じて本方針を改定する場合がございます。改定が行われた場合、利用者がその内容を知ることができるよう、速やかにホームページに公開し、プライバシーポリシーに記載致します。</p>
                        <h4 class="common_title02">当サイトへのコメントについて</h4>
                        <p>当サイトでは、スパム・荒らしへの対応として、コメントの際に使用されたIPアドレスを記録しています。</p>
                        <p>これはブログの標準機能としてサポートされている機能で、スパム・荒らしへの対応以外にこのIPアドレスを使用することはありません。</p>
                        <p>また、メールアドレスとURLの入力に関しては、任意となっております。全てのコメントは管理人が事前にその内容を確認し、承認した上での掲載となりますことをあらかじめご了承下さい。</p>
                        <p>加えて、次の各号に掲げる内容を含むコメントは管理人の裁量によって承認せず、削除する事があります。</p>
                        <ul>
                            <li>特定の自然人または法人を誹謗し、中傷するもの。</li>
                            <li>極度にわいせつな内容を含むもの。</li>
                            <li>禁制品の取引に関するものや、他者を害する行為の依頼など、法律によって禁止されている物品、行為の依頼や斡旋などに関するもの。</li>
                            <li>その他、公序良俗に反し、または管理人によって承認すべきでないと認められるもの。</li>
                        </ul>
                        <h4 class="common_title02">著作権・肖像権について</h4>
                        <p>当サイトに記載されてある文章・画像については、著作権法で定められている引用の範囲を超えて、無断で転用・使用することを禁じます。引用をする際は、「引用元の明示」をお守りください。</p>
                        <h4 class="common_title02">お問い合わせ</h4>
                        <p>本サイトは、上記個人情報保護方針を遵守し、ご訪問者が安心してご利用頂きながら、役立つ情報を配信するサイト構築と運営に取り組んでまいります。</p>
                        <p>方針に関するお問い合わせは<a href="/contact">お問い合わせフォーム</a>よりご連絡ください。</p>


                    </div>
                    <div class="box">
                        <ul class="bread_crumbs flex">
                            <li><a href="/">三十年商店</a></li>
                            <li>プライバシーポリシー</li>
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
