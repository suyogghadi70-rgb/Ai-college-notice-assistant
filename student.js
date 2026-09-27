/**
 * Student dashboard — Phase 2
 * Reads published notices from the shared local store. AI Q&A comes later.
 */
(function () {
  "use strict";

  var session = window.ACNAAuth.requireAuth("student");
  if (!session) return;

  var Store = window.ACNAStore;

  function qs(id) {
    return document.getElementById(id);
  }

  var student = {
    name: session.name || "Suyog",
    email: session.email,
    branch: session.branch || "Electronics & Computer Engineering",
    semester: session.semester || "4",
    division: session.division || "A"
  };

  qs("welcome-name").textContent = student.name;
  qs("profile-name").textContent = student.name;
  qs("profile-email").textContent = student.email;
  qs("profile-branch").textContent = student.branch;
  qs("profile-semester").textContent = student.semester;
  qs("profile-division").textContent = student.division;
  qs("sidebar-name").textContent = student.name;
  qs("sidebar-email").textContent = student.email;

  var navButtons = document.querySelectorAll("[data-nav]");
  var views = document.querySelectorAll(".view");
  var sidebar = qs("sidebar");
  var overlay = qs("overlay");

  function closeSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  }

  function showView(name) {
    views.forEach(function (view) {
      view.classList.toggle("active", view.id === "view-" + name);
    });
    navButtons.forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-nav") === name);
    });
    closeSidebar();
  }

  navButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      showView(btn.getAttribute("data-nav"));
    });
  });

  qs("menu-toggle").addEventListener("click", function () {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("show");
  });
  overlay.addEventListener("click", closeSidebar);
  qs("logout-btn").addEventListener("click", function () {
    window.ACNAAuth.logout();
  });

  function emptyHtml(message) {
    return (
      '<div class="empty-state"><i class="bi bi-inbox"></i><p>' +
      Store.escapeHtml(message) +
      "</p></div>"
    );
  }

  function cardHtml(n) {
    return (
      '<button type="button" class="notice-card" data-open="' +
      Store.escapeHtml(n.id) +
      '"><h4>' +
      Store.escapeHtml(n.title) +
      '</h4><div class="notice-meta">' +
      '<span class="badge ' +
      Store.escapeHtml(n.category) +
      '">' +
      Store.escapeHtml(n.category) +
      "</span>" +
      (n.important ? '<span class="badge important">Important</span>' : "") +
      (n.eventDate
        ? '<span class="muted">' + Store.escapeHtml(Store.formatDate(n.eventDate)) + "</span>"
        : "") +
      (n.attachment
        ? '<span class="file-chip"><i class="bi bi-paperclip"></i> File</span>'
        : "") +
      "</div><p>" +
      Store.escapeHtml(n.body.slice(0, 160)) +
      (n.body.length > 160 ? "…" : "") +
      "</p></button>"
    );
  }

  function listHtml(items, emptyMessage) {
    if (!items.length) return emptyHtml(emptyMessage);
    return (
      '<div class="notice-list">' +
      items.map(cardHtml).join("") +
      "</div>"
    );
  }

  function openDetail(id) {
    var n = Store.getNotice(id);
    if (!n) return;
    qs("detail-title").textContent = n.title;
    qs("detail-meta").innerHTML =
      '<span class="badge ' +
      Store.escapeHtml(n.category) +
      '">' +
      Store.escapeHtml(n.category) +
      "</span>" +
      (n.important ? '<span class="badge important">Important</span>' : "") +
      (n.eventDate
        ? '<span class="muted">Date: ' + Store.escapeHtml(Store.formatDate(n.eventDate)) + "</span>"
        : "");
    qs("detail-body").textContent = n.body;
    var fileBox = qs("detail-file");
    fileBox.innerHTML = "";
    if (n.attachment && n.attachment.dataUrl) {
      if (n.attachment.type.indexOf("image/") === 0) {
        fileBox.innerHTML =
          '<p class="file-chip"><i class="bi bi-paperclip"></i> ' +
          Store.escapeHtml(n.attachment.name) +
          '</p><img class="preview-frame" alt="" src="' +
          n.attachment.dataUrl +
          '" />';
      } else {
        fileBox.innerHTML =
          '<p><a class="file-chip" href="' +
          n.attachment.dataUrl +
          '" target="_blank" rel="noopener">' +
          '<i class="bi bi-box-arrow-up-right"></i> Open ' +
          Store.escapeHtml(n.attachment.name) +
          "</a></p>";
      }
    } else if (n.attachment) {
      fileBox.innerHTML =
        '<p class="muted">Attachment: ' + Store.escapeHtml(n.attachment.name) + "</p>";
    }
    qs("detail-modal").classList.add("show");
  }

  function closeDetail() {
    qs("detail-modal").classList.remove("show");
  }

  qs("btn-close-detail").addEventListener("click", closeDetail);
  qs("detail-modal").addEventListener("click", function (event) {
    if (event.target === qs("detail-modal")) closeDetail();
  });

  document.addEventListener("click", function (event) {
    var open = event.target.closest("[data-open]");
    if (open) openDetail(open.getAttribute("data-open"));
  });

  function render() {
    var notices = Store.publishedForStudent(student);
    var q = (qs("student-search").value || "").trim().toLowerCase();
    var filtered = notices.filter(function (n) {
      if (!q) return true;
      return n.title.toLowerCase().indexOf(q) !== -1 || n.body.toLowerCase().indexOf(q) !== -1;
    });
    var important = notices.filter(function (n) {
      return n.important;
    });
    var upcoming = Store.upcomingEvents(notices);

    qs("st-total").textContent = String(notices.length);
    qs("st-important").textContent = String(important.length);
    qs("st-upcoming").textContent = String(upcoming.length);

    qs("dash-notices").innerHTML = listHtml(notices.slice(0, 4), "No notices available yet.");
    qs("all-notices").innerHTML = listHtml(filtered, "No notices available yet.");
    qs("important-notices").innerHTML = listHtml(important, "No important notices right now.");

    if (!upcoming.length) {
      qs("dash-events").innerHTML = emptyHtml("No upcoming events.");
      qs("calendar-list").innerHTML = emptyHtml("No upcoming events.");
    } else {
      var rows = upcoming
        .map(function (n) {
          return (
            '<button type="button" class="notice-card" data-open="' +
            Store.escapeHtml(n.id) +
            '"><h4>' +
            Store.escapeHtml(Store.formatDate(n.eventDate)) +
            " · " +
            Store.escapeHtml(n.title) +
            "</h4><p>" +
            Store.escapeHtml(n.body.slice(0, 120)) +
            (n.body.length > 120 ? "…" : "") +
            "</p></button>"
          );
        })
        .join("");
      qs("dash-events").innerHTML = '<div class="notice-list">' + rows + "</div>";
      qs("calendar-list").innerHTML = '<div class="notice-list">' + rows + "</div>";
    }
  }

  qs("student-search").addEventListener("input", render);
  render();
})();
