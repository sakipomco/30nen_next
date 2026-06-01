<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&family=Noto+Serif+JP:wght@200..900&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Zen+Old+Mincho:wght@400;500;600;700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="<?php echo esc_url (get_theme_file_uri('common/css/style.css')); ?>?v=2" type="text/css">
    <title>三十年商店</title>
    <?php wp_head(); ?>
</head>
<body>
    <main id="common" class="sub_common about lineup_page">
        <div class="hamburger_menu">
            <div class="menu_btn">
                <img src="<?php echo esc_url (get_theme_file_uri('common/jpg/sp_menu01.png')); ?>" alt="">
                <p class="menu_btn02">閉</p>
            </div>
            <nav class="menu_list">
                <a href="<?php echo esc_url(home_url('/about')); ?>" class="link_btn">初めての方はこちら</a>
                <div class="linenap">
                    <h3 class="common_title01">小商店</h3>
                    <ul class="line-up flex">
                            <?php
                            $categories = get_categories(array(
                                'hide_empty' => false,
                                'exclude' => get_cat_ID('未分類'),
                                'orderby' => 'term_order',
								'parent'     => 0,           //
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
                    <!-- 検索 -->
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
                    <ul class="sp_link">
                        <li><a href="<?php echo esc_url(home_url('/about')); ?>">当店について</a></li>
                        <li><a href="<?php echo esc_url(home_url('/history')); ?>">沿革</a></li>
                        <li><a href="<?php echo esc_url(home_url('/about#wanted')); ?>">書き手募集</a></li>
                        <li><a href="<?php echo esc_url(home_url('/howtouse')); ?>">利用規約</a></li>
                        <li><a href="<?php echo esc_url(home_url('/privacy')); ?>">プライバシーポリシー</a></li>
                    </ul>
                </div>
            </nav>
        </div>
        <div class="inner_1400">
            <div class="flex">
                <header>
                    <ul>
                    <li><a href="<?php echo esc_url(home_url('/about')); ?>">当店について</a></li>
                        <li><a href="<?php echo esc_url(home_url('/history')); ?>">沿革</a></li>
                        <li><a href="<?php echo esc_url(home_url('/about#wanted')); ?>">書き手募集</a></li>
                        <li><a href="<?php echo esc_url(home_url('/howtouse')); ?>">利用規約</a></li>
                        <li><a href="<?php echo esc_url(home_url('/privacy')); ?>">プライバシーポリシー</a></li>
                    </ul>
                </header>