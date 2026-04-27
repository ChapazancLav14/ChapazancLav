//physics.js
function goBack() {
  window.location.href = "subjects.html";
}

function scrollToSection(id) {
  const el = document.getElementById(id);

  const offset = 20;
  const y = el.getBoundingClientRect().top + window.pageYOffset - offset;

  const maxScroll = document.body.scrollHeight - window.innerHeight;

  window.scrollTo({
    top: Math.min(y, maxScroll),
    behavior: "smooth",
  });
}

function openPage(page) {
  const pageName = page.split("/").pop().replace(".html", "");
  localStorage.setItem("currentPage", pageName);

  window.location.href = page;
}