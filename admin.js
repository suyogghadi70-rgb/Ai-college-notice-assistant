/**
 * Admin dashboard — Phase 2
 * Notice upload/management, student records, analytics, settings.
 */
(function () {
  "use strict";

  var session = window.ACNAAuth.requireAuth("admin");
  if (!session) return;

  var Store = window.ACNAStore;

  function qs(id) {
    return document.getElementById(id);
  }

  qs("profile-name").textContent = session.name;
  qs("profile-email").textContent = session.email;

  var navButtons = document.querySelectorAll("[data-nav]");
  var views = document.querySelectorAll(".view");
  var toast = qs("admin-toast");
  var sidebar = qs("sidebar");
  var overlay = qs("overlay");
  var pendingAttachment = undefined;
  var removeAttachment = false;

  function showToast(message, success) {
    toast.textContent = message;
    toast.classList.toggle("success", !!success);
    toast.classList.add("show");
    window.setTimeout(function () {
      toast.classList.remove("show");
    }, 2800);
  }

  function closeSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  }

  function btnLabel(name) {
    var map = {
      notices: "Notices",
      students: "Students",
      analytics: "Analytics",
      settings: "Settings"
    };
    return map[name] || "Admin Dashboard";
  }

  function showView(name) {
    views.forEach(function (view) {
      view.classList.toggle("active", view.id === "view-" + name);
    });
    navButtons.forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-nav") === name);
    });
    qs("topbar-title").textContent =
      name === "dashboard" ? "AI College Notice Assistant" : btnLabel(name);
    qs("topbar-subtitle").textContent =
      name === "dashboard" ? "Admin Dashboard" : "AI College Notice Assistant";
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

  function badge(kind, label) {
    return '<span class="badge ' + kind + '">' + Store.escapeHtml(label) + "</span>";
  }

  function renderDashboard() {
    var stats = Store.stats();
    var settings = Store.getSettings();
    qs("stat-total").textContent = String(stats.totalNotices);
    qs("stat-students").textContent = String(stats.activeStudents);
    qs("stat-pending").textContent = String(stats.pending);
    qs("stat-upcoming").textContent = String(stats.upcoming);
    qs("college-banner").textContent =
      settings.collegeName +
      " · " +
      settings.academicYear +
      " — publish notices that students can view immediately.";

    var recent = Store.getNotices().slice(0, 5);
    var box = qs("recent-notices");
    if (!recent.length) {
      box.innerHTML =
        '<div class="empty-state"><i class="bi bi-inbox"></i><p>No notices available yet.</p></div>';
      return;
    }
    box.innerHTML =
      '<div class="notice-list">' +
      recent
        .map(function (n) {
          return (
            '<button type="button" class="notice-card" data-edit="' +
            Store.escapeHtml(n.id) +
            '"><h4>' +
            Store.escapeHtml(n.title) +
            "</h4><div class=\"notice-meta\">" +
            badge(n.category, n.category) +
            badge(n.status, n.status) +
            (n.important ? badge("important", "Important") : "") +
            "</div><p>" +
            Store.escapeHtml(n.body.slice(0, 140)) +
            (n.body.length > 140 ? "…" : "") +
            "</p></button>"
          );
        })
        .join("") +
      "</div>";
  }

  function filteredNotices() {
    var q = (qs("notice-search").value || "").trim().toLowerCase();
    var status = qs("filter-status").value;
    var category = qs("filter-category").value;
    return Store.getNotices().filter(function (n) {
      if (status && n.status !== status) return false;
      if (category && n.category !== category) return false;
      if (!q) return true;
      return (
        n.title.toLowerCase().indexOf(q) !== -1 || n.body.toLowerCase().indexOf(q) !== -1
      );
    });
  }

  function renderNoticeTable() {
    var list = filteredNotices();
    var body = qs("notice-table-body");
    if (!list.length) {
      body.innerHTML =
        '<tr><td colspan="6"><div class="empty-state"><i class="bi bi-inbox"></i><p>No notices match these filters.</p></div></td></tr>';
      return;
    }
    body.innerHTML = list
      .map(function (n) {
        return (
          "<tr><td><strong>" +
          Store.escapeHtml(n.title) +
          "</strong>" +
          (n.attachment
            ? '<div class="file-chip"><i class="bi bi-paperclip"></i> ' +
              Store.escapeHtml(n.attachment.name) +
              "</div>"
            : "") +
          "</td><td>" +
          badge(n.category, n.category) +
          "</td><td>" +
          badge(n.status, n.status) +
          (n.important ? " " + badge("important", "Important") : "") +
          "</td><td>" +
          Store.escapeHtml(n.eventDate ? Store.formatDate(n.eventDate) : "—") +
          "</td><td>" +
          Store.escapeHtml(Store.formatDate(n.updatedAt)) +
          '</td><td><div class="row-actions">' +
          '<button type="button" class="btn-tiny" data-edit="' +
          Store.escapeHtml(n.id) +
          '">Edit</button>' +
          '<button type="button" class="btn-tiny danger" data-delete="' +
          Store.escapeHtml(n.id) +
          '">Delete</button></div></td></tr>'
        );
      })
      .join("");
  }

  function renderStudents() {
    var list = Store.getStudents();
    qs("student-table-body").innerHTML = list
      .map(function (s) {
        return (
          "<tr><td>" +
          Store.escapeHtml(s.name) +
          "</td><td>" +
          Store.escapeHtml(s.email) +
          "</td><td>" +
          Store.escapeHtml(s.branch) +
          "</td><td>" +
          Store.escapeHtml(s.semester + " / " + s.division) +
          "</td><td>" +
          badge(s.active ? "published" : "pending", s.active ? "Active" : "Inactive") +
          '</td><td><div class="row-actions">' +
          (s.locked
            ? '<span class="muted">Demo login</span>'
            : '<button type="button" class="btn-tiny" data-toggle-student="' +
              Store.escapeHtml(s.id) +
              '" data-active="' +
              (s.active ? "0" : "1") +
              '">' +
              (s.active ? "Deactivate" : "Activate") +
              '</button><button type="button" class="btn-tiny danger" data-delete-student="' +
              Store.escapeHtml(s.id) +
              '">Delete</button>') +
          "</div></td></tr>"
        );
      })
      .join("");
  }

  function renderAnalytics() {
    var stats = Store.stats();
    var notices = Store.getNotices();
    qs("an-published").textContent = String(stats.published);
    qs("an-important").textContent = String(stats.important);
    qs("an-pending").textContent = String(stats.pending);
    qs("an-files").textContent = String(
      notices.filter(function (n) {
        return !!n.attachment;
      }).length
    );
    var max = 1;
    Object.keys(stats.byCategory).forEach(function (key) {
      if (stats.byCategory[key] > max) max = stats.byCategory[key];
    });
    var cats = ["general", "exam", "event", "academic", "urgent"];
    qs("category-bars").innerHTML = cats
      .map(function (cat) {
        var n = stats.byCategory[cat] || 0;
        var pct = Math.round((n / max) * 100);
        return (
          '<div class="bar-row"><span><strong>' +
          cat.charAt(0).toUpperCase() +
          cat.slice(1) +
          "</strong><strong>" +
          n +
          '</strong></span><div class="bar"><i style="width:' +
          pct +
          '%"></i></div></div>'
        );
      })
      .join("");
  }

  function renderSettings() {
    var s = Store.getSettings();
    qs("set-college").value = s.collegeName;
    qs("set-year").value = s.academicYear;
  }

  function refresh() {
    renderDashboard();
    renderNoticeTable();
    renderStudents();
    renderAnalytics();
    renderSettings();
  }

  function openNoticeModal(id) {
    var form = qs("notice-form");
    form.reset();
    qs("notice-form-error").classList.remove("show");
    qs("notice-id").value = id || "";
    pendingAttachment = undefined;
    removeAttachment = false;
    qs("n-all").checked = true;
    qs("audience-fields").classList.add("hidden");
    qs("n-file-label").textContent = "";
    qs("notice-modal-title").textContent = id ? "Edit Notice" : "Create Notice";
    if (id) {
      var n = Store.getNotice(id);
      if (!n) return;
      qs("n-title").value = n.title;
      qs("n-body").value = n.body;
      qs("n-category").value = n.category;
      qs("n-status").value = n.status;
      qs("n-event").value = n.eventDate || "";
      qs("n-important").checked = !!n.important;
      qs("n-all").checked = !n.audience || n.audience.all !== false;
      qs("audience-fields").classList.toggle("hidden", qs("n-all").checked);
      qs("n-branch").value = (n.audience && n.audience.branch) || "";
      qs("n-semester").value = (n.audience && n.audience.semester) || "";
      qs("n-division").value = (n.audience && n.audience.division) || "";
      qs("n-file-label").textContent = n.attachment
        ? "Current file: " + Store.fileLabel(n.attachment)
        : "No file attached.";
    }
    qs("notice-modal").classList.add("show");
  }

  function closeNoticeModal() {
    qs("notice-modal").classList.remove("show");
  }

  qs("n-all").addEventListener("change", function () {
    qs("audience-fields").classList.toggle("hidden", qs("n-all").checked);
  });

  qs("btn-new-notice").addEventListener("click", function () {
    openNoticeModal();
  });
  qs("qa-create").addEventListener("click", function () {
    showView("notices");
    openNoticeModal();
  });
  qs("qa-manage").addEventListener("click", function () {
    showView("notices");
  });
  qs("qa-students").addEventListener("click", function () {
    showView("students");
  });
  qs("btn-cancel-notice").addEventListener("click", closeNoticeModal);
  qs("notice-modal").addEventListener("click", function (event) {
    if (event.target === qs("notice-modal")) closeNoticeModal();
  });

  qs("n-file").addEventListener("change", function () {
    var file = qs("n-file").files[0];
    if (!file) return;
    Store.readAttachment(file)
      .then(function (att) {
        pendingAttachment = att;
        removeAttachment = false;
        qs("n-file-label").textContent = "Ready to save: " + Store.fileLabel(att);
        qs("notice-form-error").classList.remove("show");
      })
      .catch(function (err) {
        pendingAttachment = undefined;
        qs("n-file").value = "";
        qs("notice-form-error").innerHTML =
          '<i class="bi bi-exclamation-circle"></i> ' + Store.escapeHtml(err.message);
        qs("notice-form-error").classList.add("show");
      });
  });

  qs("notice-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var existingId = qs("notice-id").value || null;
    var payload = {
      title: qs("n-title").value,
      body: qs("n-body").value,
      category: qs("n-category").value,
      status: qs("n-status").value,
      important: qs("n-important").checked,
      eventDate: qs("n-event").value || null,
      audience: {
        all: qs("n-all").checked,
        branch: qs("n-branch").value,
        semester: qs("n-semester").value,
        division: qs("n-division").value
      },
      createdBy: session.email
    };
    if (pendingAttachment) payload.attachment = pendingAttachment;
    else if (removeAttachment) payload.attachment = null;

    var result = Store.upsertNotice(payload, existingId);
    if (!result.ok) {
      qs("notice-form-error").innerHTML =
        '<i class="bi bi-exclamation-circle"></i> ' + Store.escapeHtml(result.message);
      qs("notice-form-error").classList.add("show");
      return;
    }
    closeNoticeModal();
    refresh();
    showView("notices");
    showToast("Notice saved.", true);
  });

  document.addEventListener("click", function (event) {
    var edit = event.target.closest("[data-edit]");
    var del = event.target.closest("[data-delete]");
    var tog = event.target.closest("[data-toggle-student]");
    var delS = event.target.closest("[data-delete-student]");
    if (edit) {
      showView("notices");
      openNoticeModal(edit.getAttribute("data-edit"));
    } else if (del) {
      if (window.confirm("Delete this notice?")) {
        Store.deleteNotice(del.getAttribute("data-delete"));
        refresh();
        showToast("Notice deleted.", true);
      }
    } else if (tog) {
      Store.setStudentActive(tog.getAttribute("data-toggle-student"), tog.getAttribute("data-active") === "1");
      refresh();
    } else if (delS) {
      if (window.confirm("Remove this student record?")) {
        var res = Store.deleteStudent(delS.getAttribute("data-delete-student"));
        if (!res.ok) showToast(res.message, false);
        refresh();
      }
    }
  });

  ["notice-search", "filter-status", "filter-category"].forEach(function (id) {
    qs(id).addEventListener("input", renderNoticeTable);
    qs(id).addEventListener("change", renderNoticeTable);
  });
  qs("btn-clear-filters").addEventListener("click", function () {
    qs("notice-search").value = "";
    qs("filter-status").value = "";
    qs("filter-category").value = "";
    renderNoticeTable();
  });

  qs("student-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var err = qs("student-form-error");
    err.classList.remove("show");
    var result = Store.addStudent({
      name: qs("st-name").value,
      email: qs("st-email").value,
      branch: qs("st-branch").value,
      semester: qs("st-semester").value,
      division: qs("st-division").value
    });
    if (!result.ok) {
      err.innerHTML = '<i class="bi bi-exclamation-circle"></i> ' + Store.escapeHtml(result.message);
      err.classList.add("show");
      return;
    }
    event.target.reset();
    refresh();
    showToast("Student added.", true);
  });

  qs("settings-form").addEventListener("submit", function (event) {
    event.preventDefault();
    Store.saveSettings({
      collegeName: qs("set-college").value.trim() || "Demo College of Engineering",
      academicYear: qs("set-year").value.trim() || "2026–27"
    });
    refresh();
    showToast("Settings saved.", true);
  });

  qs("btn-restore").addEventListener("click", function () {
    if (!window.confirm("Replace all notices, students, and settings with the demo set?")) return;
    Store.restoreDemo();
    refresh();
    showToast("Demo data restored.", true);
  });

  refresh();
})();
