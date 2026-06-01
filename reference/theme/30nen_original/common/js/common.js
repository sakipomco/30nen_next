document.addEventListener('DOMContentLoaded', function () {
    const menuBtn = document.querySelector('.menu_btn');
    const hamburgerMenu = document.querySelector('.hamburger_menu');

    menuBtn.addEventListener('click', function () {
        hamburgerMenu.classList.toggle('active');
    });
});

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('p, a, h3').forEach(function(el) {
    // .pagination 内の要素は除外
    if (el.closest('.pagination')) return;

    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    const texts = [];
    while (walker.nextNode()) {
      texts.push(walker.currentNode);
    }
    texts.forEach(function(textNode) {
      const replacedText = textNode.nodeValue.replace(/([A-Za-z0-9]+)/g, '<span class="en">$1</span>');
      if (replacedText !== textNode.nodeValue) {
        const temp = document.createElement('span');
        temp.innerHTML = replacedText;
        while (temp.firstChild) {
          textNode.parentNode.insertBefore(temp.firstChild, textNode);
        }
        textNode.parentNode.removeChild(textNode);
      }
    });
  });
});
