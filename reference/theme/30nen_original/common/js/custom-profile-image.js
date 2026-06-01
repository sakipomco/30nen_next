jQuery(document).ready(function ($) {
    $('#upload-profile-image').on('click', function (e) {
        e.preventDefault();
        var mediaUploader;
        if (mediaUploader) {
            mediaUploader.open();
            return;
        }
        mediaUploader = wp.media({
            title: 'プロフィール画像を選択',
            button: {
                text: '画像を選択'
            },
            multiple: false
        });
        mediaUploader.on('select', function () {
            var attachment = mediaUploader.state().get('selection').first().toJSON();
            $('#custom_profile_image').val(attachment.url);
            $('#custom-profile-preview').attr('src', attachment.url);
        });
        mediaUploader.open();
    });
});
