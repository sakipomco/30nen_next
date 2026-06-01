<form role="search" method="get" id="searchform" class="searchform" action="<?php echo esc_url(home_url('/')); ?>">
  <div class="search-form_wrapper">
    <!-- 検索入力欄 -->
    <input type="text" name="s" id="s" class="search-form_input" placeholder="ワード検索" required>
    <!-- 検索ボタン -->
    <button type="submit" id="searchsubmit" class="search-form_button">
      検索
    </button>
  </div>
</form>