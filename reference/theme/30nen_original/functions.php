<?php
add_theme_support('post-thumbnails');
?>

<?php // カテゴリー用画像を投稿画面に表示
// カテゴリ追加画面に画像入力フィールドを追加
add_action('category_add_form_fields', 'add_category_image_field');
function add_category_image_field() {
    ?>
    <div class="form-field">
        <label for="category_image">カテゴリ画像URL</label>
        <input type="text" name="category_image" id="category_image" value="" />
        <p class="description">画像のURLを入力してください（例：メディアライブラリから画像URLをコピー）</p>
    </div>
    <?php
}

// カテゴリ編集画面に画像入力フィールドを追加
add_action('category_edit_form_fields', 'edit_category_image_field');
function edit_category_image_field($term) {
    $value = get_term_meta($term->term_id, 'category_image', true);
    ?>
    <tr class="form-field">
        <th scope="row"><label for="category_image">カテゴリ画像URL</label></th>
        <td>
            <input type="text" name="category_image" id="category_image" value="<?php echo esc_attr($value); ?>" />
            <p class="description">画像のURLを入力してください（例：メディアライブラリから画像URLをコピー）</p>
        </td>
    </tr>
    <?php
}

// 保存処理（追加・更新）
add_action('created_category', 'save_category_image');
add_action('edited_category', 'save_category_image');
function save_category_image($term_id) {
    if (isset($_POST['category_image'])) {
        update_term_meta($term_id, 'category_image', sanitize_text_field($_POST['category_image']));
    }
}

?>

<?php
// 投稿タイプ「post」にアーカイブ（lineup）を設定しつつ、他の設定を保持
function post_has_archive($args, $post_type){
    if ('post' === $post_type) {
        $args['has_archive'] = 'lineup';
    }
    return $args;
}
add_filter('register_post_type_args', 'post_has_archive', 10, 2);
?>


<?php // カテゴリーにふりがな入力フィールドを追加
function add_category_kana_field($term) {
    $value = get_term_meta($term->term_id, 'category_kana', true);
    ?>
    <tr class="form-field">
        <th scope="row" valign="top"><label for="category_kana">ふりがな</label></th>
        <td>
            <input type="text" name="category_kana" id="category_kana" value="<?php echo esc_attr($value); ?>">
            <p class="description">カテゴリーの読み仮名を入力してください。</p>
        </td>
    </tr>
    <?php
}
add_action('edit_category_form_fields', 'add_category_kana_field');

// 保存処理
function save_category_kana_field($term_id) {
    if (isset($_POST['category_kana'])) {
        update_term_meta($term_id, 'category_kana', sanitize_text_field($_POST['category_kana']));
    }
}
add_action('edited_category', 'save_category_kana_field');
?>


<?php
// ユーザーにカスタムプロフィールフィールドを追加
function add_custom_user_profile_fields($user) {
    ?>
    <h3>追加プロフィール情報</h3>
    <table class="form-table">
        <tr>
            <th><label for="birthplace">住所</label></th>
            <td>
                <input type="text" name="birthplace" id="birthplace" value="<?php echo esc_attr(get_the_author_meta('birthplace', $user->ID)); ?>" class="regular-text" />
            </td>
        </tr>
        <tr>
            <th><label for="age">年齢</label></th>
            <td>
                <input type="number" name="age" id="age" value="<?php echo esc_attr(get_the_author_meta('age', $user->ID)); ?>" class="small-text" />
            </td>
        </tr>
        <tr>
            <th><label for="instagram">Instagram URL</label></th>
            <td>
                <input type="url" name="instagram" id="instagram" value="<?php echo esc_attr(get_the_author_meta('instagram', $user->ID)); ?>" class="regular-text" />
            </td>
        </tr>
        <tr>
            <th><label for="x_account">X (旧Twitter) URL</label></th>
            <td>
                <input type="url" name="x_account" id="x_account" value="<?php echo esc_attr(get_the_author_meta('x_account', $user->ID)); ?>" class="regular-text" />
            </td>
        </tr>
        <tr>
            <th><label for="youtube">YouTube チャンネル URL</label></th>
            <td>
                <input type="url" name="youtube" id="youtube" value="<?php echo esc_attr(get_the_author_meta('youtube', $user->ID)); ?>" class="regular-text" />
            </td>
        </tr>
        <tr>
            <th><label for="website">Webサイト</label></th>
            <td>
                <input type="url" name="website" id="website" value="<?php echo esc_attr(get_the_author_meta('website', $user->ID)); ?>" class="regular-text" />
            </td>
        </tr>
    </table>
    <?php
}
add_action('show_user_profile', 'add_custom_user_profile_fields');
add_action('edit_user_profile', 'add_custom_user_profile_fields');

function save_custom_user_profile_fields($user_id) {
    if (!current_user_can('edit_user', $user_id)) return false;

    update_user_meta($user_id, 'birthplace', $_POST['birthplace']);
    update_user_meta($user_id, 'age', $_POST['age']);
    update_user_meta($user_id, 'instagram', $_POST['instagram']);
    update_user_meta($user_id, 'x_account', $_POST['x_account']);
    update_user_meta($user_id, 'youtube', $_POST['youtube']);
    update_user_meta($user_id, 'website', $_POST['website']);
}
add_action('personal_options_update', 'save_custom_user_profile_fields');
add_action('edit_user_profile_update', 'save_custom_user_profile_fields');
?>



<?php // メディアアップローダーを有効に
function custom_user_profile_enqueue_scripts($hook) {
    if ($hook != 'profile.php' && $hook != 'user-edit.php') return;
    wp_enqueue_media();
    wp_enqueue_script('custom-profile-image', get_theme_file_uri('/common/js/custom-profile-image.js'), array('jquery'), null, true);
}
add_action('admin_enqueue_scripts', 'custom_user_profile_enqueue_scripts');

// プロフィール画像のフィールドを追加
function add_profile_image_field($user) {
    $image_url = esc_url(get_the_author_meta('custom_profile_image', $user->ID));
    ?>
    <h3>プロフィール画像</h3>
    <table class="form-table">
        <tr>
            <th><label for="custom_profile_image">画像</label></th>
            <td>
                <img id="custom-profile-preview" src="<?php echo $image_url ? $image_url : 'https://via.placeholder.com/150'; ?>" style="max-width: 150px; height: auto;"><br>
                <input type="hidden" name="custom_profile_image" id="custom_profile_image" value="<?php echo $image_url; ?>" />
                <button type="button" class="button" id="upload-profile-image">画像を選択</button>
            </td>
        </tr>
    </table>
    <?php
}
add_action('show_user_profile', 'add_profile_image_field');
add_action('edit_user_profile', 'add_profile_image_field');

function save_profile_image_field($user_id) {
    if (!current_user_can('edit_user', $user_id)) return false;
    update_user_meta($user_id, 'custom_profile_image', esc_url_raw($_POST['custom_profile_image']));
}
add_action('personal_options_update', 'save_profile_image_field');
add_action('edit_user_profile_update', 'save_profile_image_field');
?>



<?php // TOPページの共通関数 ?>

<?php 
function output_post_card($post_id = null, $show_face_icon = true, $show_category_name = true, $show_time = true) {
    $post_id = $post_id ?: get_the_ID();

    $thumb = has_post_thumbnail($post_id)
        ? get_the_post_thumbnail($post_id, 'large')
        : '';

    $categories = get_the_category($post_id);
    $cat_name = !empty($categories) ? esc_html($categories[0]->name) : '';

    $face_icon_html = '';
    if ($show_face_icon && !empty($categories)) {
        $custom_img = get_field('category_image', 'category_' . $categories[0]->term_id);
        if ($custom_img) {
            $face_icon_html = '<img class="face_icon" src="' . esc_url($custom_img) . '" alt="顔ぶれ">';
        }
    }

    $date_format = $show_time ? 'n月j日 G時i分' : 'Y年n月j日';

    echo '<a href="' . get_permalink($post_id) . '">';
    echo '<div class="potion mt-10">' . $thumb . $face_icon_html . '</div>';

    if ($show_category_name && $cat_name) {
        echo '<p class="cat">【' . $cat_name . '】</p>';
    }

    echo '<p class="date">' . get_the_date($date_format, $post_id) . '</p>';
    echo '<h2>' . get_the_title($post_id) . '</h2>';
    echo '</a>';
}




function output_post_list($args = []) {
    $query = new WP_Query($args);
    if ($query->have_posts()):
        while ($query->have_posts()): $query->the_post(); ?>
            <li>
                <a href="<?php the_permalink(); ?>">
                    <?php if (has_post_thumbnail()) {
                        the_post_thumbnail('large');
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
}

function output_category_faces() {
	wp_cache_delete('last_changed', 'terms'); //
    $categories = get_categories(array(
    'hide_empty' => false,
    'exclude' => get_cat_ID('未分類'),
    'orderby' => 'term_order',
	'parent'     => 0,    //
));

    foreach ($categories as $cat) {
        $category_image_url = get_theme_file_uri('common/jpg/line-up.png');
        $custom_image = get_term_meta($cat->term_id, 'category_image', true);
        if (!empty($custom_image)) {
            $category_image_url = esc_url($custom_image);
        }

        $category_link = get_category_link($cat->term_id);

        echo '<li>';
        echo '<a class="sd" href="' . esc_url($category_link) . '">';
        echo '<img src="' . esc_url($category_image_url) . '" alt="' . esc_attr($cat->name) . '">';
        echo '<div class="date01 appear"></div>';
        echo '<div class="date02 appear"></div>';
        echo '<div class="date03 appear"></div>';
        echo '<div class="date04 appear"></div>';
        echo '</a>';
        echo '</li>';
    }
}
?>

<?php
add_action('pre_get_posts', function ($query) {
    if (!is_admin() && $query->is_main_query() && is_front_page()) {
        $paged = get_query_var('paged') ?: 1;
        $query->set('paged', $paged);
    }
});

// Contact Form 7のメール送信前にフック
add_filter('wpcf7_before_send_mail', 'custom_dynamic_mail_recipient');
function custom_dynamic_mail_recipient($contact_form) {
    $submission = WPCF7_Submission::get_instance();
    if ($submission) {
        $data = $submission->get_posted_data();
        $selected = $data['contact_to'];

        $mail = $contact_form->prop('mail');

        switch ($selected) {
            case '1/10957':
                $mail['recipient'] = 'saico34@gmail.com';
                break;
            case 'わたしのレシーヘン':
                $mail['recipient'] = 'shigeyasusaki@gmail.com';
                break;
        }

        $contact_form->set_properties(array('mail' => $mail));
    }
    return $contact_form;
}

?>

<?php
// === カテゴリ追加画面 ===
add_action('category_add_form_fields', function () {
  $users = get_users([
    'role__in' => ['administrator','editor','author','contributor'],
    'orderby'  => 'display_name',
    'order'    => 'ASC',
    'fields'   => ['ID','display_name','user_login'],
  ]);
  if (!$users) return; ?>
  <div class="form-field term-group">
    <label>このカテゴリで表示するユーザー</label>
    <div style="max-height:260px; overflow:auto; border:1px solid #ddd; padding:.6em;">
      <?php foreach ($users as $u): ?>
        <div style="display:flex; align-items:center; gap:.5em; margin:.25em 0;">
          <label style="flex:1 1 auto;">
            <input type="checkbox" name="cat_user_ids_raw[]" value="<?php echo esc_attr($u->ID); ?>">
            <?php echo esc_html($u->display_name . " (@{$u->user_login})"); ?>
          </label>
          <input type="number" name="cat_user_order[<?php echo esc_attr($u->ID); ?>]" value="0" step="1" style="width:70px;" placeholder="順番">
        </div>
      <?php endforeach; ?>
    </div>
    <p class="description">数字が小さいほど前に表示されます（同じ数字なら名前順）</p>
  </div>
<?php });

// === カテゴリ編集画面 ===
add_action('category_edit_form_fields', function ($term) {
  $saved_ids = (array) get_term_meta($term->term_id, 'cat_user_ids', true);
  $orders    = (array) get_term_meta($term->term_id, 'cat_user_order', true);

  $users = get_users([
    'role__in' => ['administrator','editor','author','contributor'],
    'orderby'  => 'display_name',
    'order'    => 'ASC',
    'fields'   => ['ID','display_name','user_login'],
  ]); ?>
  <tr class="form-field term-group-wrap">
    <th scope="row"><label>このカテゴリで表示するユーザー</label></th>
    <td>
      <div style="max-height:320px; overflow:auto; border:1px solid #ddd; padding:.6em;">
        <?php foreach ($users as $u):
          $checked = in_array($u->ID, $saved_ids, true);
          $ord     = isset($orders[$u->ID]) ? (int) $orders[$u->ID] : 0; ?>
          <div style="display:flex; align-items:center; gap:.5em; margin:.25em 0;">
            <label style="flex:1 1 auto;">
              <input type="checkbox" name="cat_user_ids_raw[]" value="<?php echo esc_attr($u->ID); ?>" <?php checked($checked); ?>>
              <?php echo esc_html($u->display_name . " (@{$u->user_login})"); ?>
            </label>
            <input type="number" name="cat_user_order[<?php echo esc_attr($u->ID); ?>]" value="<?php echo esc_attr($ord); ?>" step="1" style="width:70px;" placeholder="順番">
          </div>
        <?php endforeach; ?>
      </div>
      <p class="description">数字が小さいほど前に表示（未入力=0）</p>
    </td>
  </tr>
<?php });

// === 保存ロジック（追加・編集共通） ===
function _save_category_users_with_order($term_id){
  $ids_raw = isset($_POST['cat_user_ids_raw']) ? array_map('intval', (array) $_POST['cat_user_ids_raw']) : [];
  $orders  = isset($_POST['cat_user_order'])   ? array_map('intval', (array) $_POST['cat_user_order'])   : [];

  // 選択されたIDだけを対象に [id => order] を作る
  $selected = [];
  foreach ($ids_raw as $id) {
    $selected[$id] = $orders[$id] ?? 0;
  }

  // order昇順で並べ替え（同点は表示名の五十音順で安定化）
  if (!empty($selected)) {
    uasort($selected, function($a_order, $b_order) { return $a_order <=> $b_order; });
    // 2次ソート：同じorderの中でdisplay_name昇順
    $sameBuckets = [];
    foreach ($selected as $id => $ord) { $sameBuckets[$ord][] = $id; }
    $sorted_ids = [];
    foreach ($sameBuckets as $ord => $ids) {
      usort($ids, function($a,$b){
        $an = get_the_author_meta('display_name', $a);
        $bn = get_the_author_meta('display_name', $b);
        return strnatcasecmp($an, $bn);
      });
      $sorted_ids = array_merge($sorted_ids, $ids);
    }
  } else {
    $sorted_ids = [];
  }

  update_term_meta($term_id, 'cat_user_ids',   $sorted_ids);
  update_term_meta($term_id, 'cat_user_order', $orders); // UI再表示用
}
add_action('created_category', '_save_category_users_with_order');
add_action('edited_category',  '_save_category_users_with_order');



// ユーザープロフィールにカテゴリー選択欄を追加
function add_user_category_field($user) {
    $categories = get_categories(array(
        'hide_empty' => false,
        'parent'     => 0,
        'exclude'    => get_cat_ID('未分類'),
        'orderby'    => 'term_order',
    ));
    $saved = get_user_meta($user->ID, 'assigned_category', true);
    ?>
    <h3>担当カテゴリー</h3>
    <table class="form-table">
        <tr>
            <th>カテゴリー</th>
            <td>
                <select name="assigned_category">
                    <option value="">-- 選択してください --</option>
                    <?php foreach ($categories as $cat) : ?>
                        <option value="<?php echo $cat->term_id; ?>" 
                            <?php selected($saved, $cat->term_id); ?>>
                            <?php echo esc_html($cat->name); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </td>
        </tr>
    </table>
<?php 
}
add_action('edit_user_profile', 'add_user_category_field');
add_action('show_user_profile', 'add_user_category_field');

// 保存処理
function save_user_category_field($user_id) {
    if (isset($_POST['assigned_category'])) {
        update_user_meta($user_id, 'assigned_category', intval($_POST['assigned_category']));
    }
}
add_action('edit_user_profile_update', 'save_user_category_field');
add_action('personal_options_update', 'save_user_category_field');

// 投稿保存時に担当カテゴリーを自動設定
function auto_assign_category($post_id, $post) {
    // 自動保存は無視
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    // 投稿タイプが'post'のみ対象
    if ($post->post_type !== 'post') return;

    $user_id = get_current_user_id();
    $assigned = get_user_meta($user_id, 'assigned_category', true);

    if (!empty($assigned)) {
        wp_set_post_categories($post_id, array(intval($assigned)));
    }
}
add_action('save_post', 'auto_assign_category', 10, 2);

add_filter( 'wp_insert_post_data', function( $data ) {
    if ( empty( trim( $data['post_title'] ) ) && $data['post_status'] !== 'auto-draft' ) {
        $now = new DateTimeImmutable( 'now', new DateTimeZone( 'Asia/Tokyo' ) );
        $data['post_title'] = $now->format( 'G時i分' ) . 'の日記';
        $data['post_name']  = '';  // スラッグも自動生成させる
    }
    return $data;
} );