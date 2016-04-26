(function () {
  var directories = ["info.html", "lesson01", "lesson02", "lesson03", "lesson04", "lesson05", "lesson06", "lesson06b", "lesson07"];
  var links = document.querySelectorAll('nav li');
  var iframe = document.getElementById("lesson");
  var select = function (index) {
    iframe.src = directories[index];
    document.querySelector('nav li.active').classList.remove('active');
    links[index].classList.add("active");
  }
  for (var i = 0; i < links.length; i++) {
    (function (index) {
      links[index].addEventListener('click', function () { select(index) }, false);
    })(i);
  }
  select(0);
})();