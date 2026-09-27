/**
 * AI College Notice Assistant — shared local data store (Phase 2)
 *
 * Notices, students, and settings live in localStorage for the demo.
 * Later phases can keep the same methods and swap the body for MySQL/API:
 *   Phase 3–4: fill extractedText via PDF/OCR
 *   Phase 5–6: fill summary / classification
 *   Phase 7:   richer audience matching
 *   Phase 10:  replace get/set with HTTP + MySQL
 */
(function (window) {
  "use strict";

  var KEYS = {
    notices: "acna.notices",
    students: "acna.students",
    settings: "acna.settings"
  };

  var MAX_FILE_BYTES = 350 * 1024;
  var ALLOWED_TYPES = {
    "application/pdf": true,
    "image/jpeg": true,
    "image/png": true,
    "image/webp": true,
    "image/gif": true
  };

  function uid(prefix) {
    return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDate(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d.getTime())) {
      var parts = String(iso).split("-");
      if (parts.length === 3) {
        d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    }
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function todayStamp() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function defaultSettings() {
    return {
      collegeName: "Demo College of Engineering",
      academicYear: "2026–27"
    };
  }

  function seedNotices() {
    var now = Date.now();
    return [
      {
        id: "n_seed_exam",
        title: "Mid-Semester Exam Timetable",
        body: "Mid-semester examinations for Semester 4 begin on 15 October 2026. Students should check the seating arrangement on the department notice board and carry their ID cards.",
        category: "exam",
        status: "published",
        important: true,
        eventDate: "2026-10-15",
        audience: { all: true, branch: "", semester: "", division: "" },
        attachment: null,
        extractedText: null,
        summary: null,
        classification: null,
        createdAt: now - 86400000 * 2,
        updatedAt: now - 86400000 * 2,
        createdBy: "admin@college.com"
      },
      {
        id: "n_seed_event",
        title: "Technical Workshop: Embedded Systems",
        body: "The ECE department will host a one-day workshop on embedded systems. Registration is open for Semester 4 Division A students. Venue: Lab 2.",
        category: "event",
        status: "published",
        important: false,
        eventDate: "2026-10-10",
        audience: {
          all: false,
          branch: "Electronics & Computer Engineering",
          semester: "4",
          division: "A"
        },
        attachment: null,
        extractedText: null,
        summary: null,
        classification: null,
        createdAt: now - 86400000,
        updatedAt: now - 86400000,
        createdBy: "admin@college.com"
      },
      {
        id: "n_seed_pending",
        title: "Holiday Notice — Draft",
        body: "College will remain closed on 2 October 2026 for Gandhi Jayanti. This notice is pending final approval before it is shown to students.",
        category: "general",
        status: "pending",
        important: false,
        eventDate: "2026-10-02",
        audience: { all: true, branch: "", semester: "", division: "" },
        attachment: null,
        extractedText: null,
        summary: null,
        classification: null,
        createdAt: now,
        updatedAt: now,
        createdBy: "admin@college.com"
      }
    ];
  }

  function seedStudents() {
    return [
      {
        id: "s_seed_suyog",
        name: "Suyog",
        email: "student@college.com",
        branch: "Electronics & Computer Engineering",
        semester: "4",
        division: "A",
        active: true,
        locked: true
      },
      {
        id: "s_seed_b",
        name: "Demo Student B",
        email: "studentb@college.com",
        branch: "Computer Engineering",
        semester: "3",
        division: "B",
        active: true,
        locked: false
      },
      {
        id: "s_seed_c",
        name: "Demo Student C",
        email: "studentc@college.com",
        branch: "Mechanical Engineering",
        semester: "2",
        division: "A",
        active: true,
        locked: false
      }
    ];
  }

  function ensureSeed() {
    if (localStorage.getItem(KEYS.notices) == null) {
      write(KEYS.notices, seedNotices());
    }
    if (localStorage.getItem(KEYS.students) == null) {
      write(KEYS.students, seedStudents());
    }
    if (localStorage.getItem(KEYS.settings) == null) {
      write(KEYS.settings, defaultSettings());
    }
  }

  function restoreDemo() {
    write(KEYS.notices, seedNotices());
    write(KEYS.students, seedStudents());
    write(KEYS.settings, defaultSettings());
  }

  function getNotices() {
    ensureSeed();
    return read(KEYS.notices, []);
  }

  function saveNotices(list) {
    write(KEYS.notices, list);
  }

  function getNotice(id) {
    var list = getNotices();
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function normalizeNotice(data, existing) {
    existing = existing || {};
    var audience = data.audience || existing.audience || {};
    return {
      id: existing.id || uid("n"),
      title: String(data.title || "").trim(),
      body: String(data.body || "").trim(),
      category: data.category || "general",
      status: data.status || "published",
      important: !!data.important,
      eventDate: data.eventDate || null,
      audience: {
        all: audience.all !== false,
        branch: audience.branch || "",
        semester: audience.semester || "",
        division: audience.division || ""
      },
      attachment: data.attachment === undefined ? existing.attachment || null : data.attachment,
      extractedText: existing.extractedText || null,
      summary: existing.summary || null,
      classification: existing.classification || null,
      createdAt: existing.createdAt || Date.now(),
      updatedAt: Date.now(),
      createdBy: existing.createdBy || (data.createdBy || "")
    };
  }

  function upsertNotice(data, existingId) {
    var list = getNotices();
    var existing = existingId ? getNotice(existingId) : null;
    var notice = normalizeNotice(data, existing || {});
    if (!notice.title || !notice.body) {
      return { ok: false, message: "Title and notice text are required." };
    }
    if (existing) {
      list = list.map(function (item) {
        return item.id === existing.id ? notice : item;
      });
    } else {
      list.unshift(notice);
    }
    saveNotices(list);
    return { ok: true, notice: notice };
  }

  function deleteNotice(id) {
    saveNotices(
      getNotices().filter(function (item) {
        return item.id !== id;
      })
    );
  }

  function getStudents() {
    ensureSeed();
    return read(KEYS.students, []);
  }

  function saveStudents(list) {
    write(KEYS.students, list);
  }

  function addStudent(data) {
    var name = String(data.name || "").trim();
    var email = String(data.email || "").trim().toLowerCase();
    if (!name || !email) {
      return { ok: false, message: "Name and email are required." };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, message: "Enter a valid email address." };
    }
    var list = getStudents();
    var exists = list.some(function (s) {
      return s.email === email;
    });
    if (exists) {
      return { ok: false, message: "A student with this email already exists." };
    }
    var student = {
      id: uid("s"),
      name: name,
      email: email,
      branch: String(data.branch || "").trim() || "Unassigned",
      semester: String(data.semester || "").trim() || "—",
      division: String(data.division || "").trim().toUpperCase() || "—",
      active: true,
      locked: false
    };
    list.push(student);
    saveStudents(list);
    return { ok: true, student: student };
  }

  function setStudentActive(id, active) {
    var list = getStudents().map(function (s) {
      if (s.id === id && !s.locked) s.active = !!active;
      return s;
    });
    saveStudents(list);
  }

  function deleteStudent(id) {
    var list = getStudents();
    var target = null;
    list.forEach(function (s) {
      if (s.id === id) target = s;
    });
    if (!target) return { ok: false, message: "Student not found." };
    if (target.locked) {
      return { ok: false, message: "The demo login student cannot be deleted." };
    }
    saveStudents(
      list.filter(function (s) {
        return s.id !== id;
      })
    );
    return { ok: true };
  }

  function getSettings() {
    ensureSeed();
    return read(KEYS.settings, defaultSettings());
  }

  function saveSettings(patch) {
    var next = Object.assign({}, getSettings(), patch);
    write(KEYS.settings, next);
    return next;
  }

  function noticeMatchesStudent(notice, student) {
    if (!notice || notice.status !== "published") return false;
    var aud = notice.audience || { all: true };
    if (aud.all) return true;
    if (!student) return false;
    if (aud.branch && aud.branch !== student.branch) return false;
    if (aud.semester && String(aud.semester) !== String(student.semester)) return false;
    if (aud.division && String(aud.division).toUpperCase() !== String(student.division).toUpperCase()) {
      return false;
    }
    return true;
  }

  function publishedForStudent(student) {
    return getNotices()
      .filter(function (n) {
        return noticeMatchesStudent(n, student);
      })
      .sort(function (a, b) {
        return b.updatedAt - a.updatedAt;
      });
  }

  function upcomingEvents(notices, fromDate) {
    var from = fromDate || todayStamp();
    return (notices || getNotices())
      .filter(function (n) {
        return n.eventDate && n.eventDate >= from && n.status === "published";
      })
      .sort(function (a, b) {
        return a.eventDate < b.eventDate ? -1 : 1;
      });
  }

  function stats() {
    var notices = getNotices();
    var students = getStudents();
    var byCategory = {};
    var pending = 0;
    var published = 0;
    var important = 0;
    notices.forEach(function (n) {
      byCategory[n.category] = (byCategory[n.category] || 0) + 1;
      if (n.status === "pending" || n.status === "draft") pending += 1;
      if (n.status === "published") published += 1;
      if (n.important) important += 1;
    });
    return {
      totalNotices: notices.length,
      published: published,
      pending: pending,
      important: important,
      upcoming: upcomingEvents(notices).length,
      activeStudents: students.filter(function (s) {
        return s.active;
      }).length,
      byCategory: byCategory
    };
  }

  function readAttachment(file) {
    return new Promise(function (resolve, reject) {
      if (!file) {
        resolve(null);
        return;
      }
      if (!ALLOWED_TYPES[file.type]) {
        reject(new Error("Upload a PDF or image (JPG, PNG, WebP, GIF)."));
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        reject(
          new Error(
            "This demo stores files in the browser. Please use a file under 350 KB. Full document handling arrives with later phases."
          )
        );
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: reader.result
        });
      };
      reader.onerror = function () {
        reject(new Error("Could not read the selected file."));
      };
      reader.readAsDataURL(file);
    });
  }

  function fileLabel(attachment) {
    if (!attachment) return "";
    var kb = Math.max(1, Math.round(attachment.size / 1024));
    return attachment.name + " (" + kb + " KB)";
  }

  ensureSeed();

  window.ACNAStore = {
    KEYS: KEYS,
    MAX_FILE_BYTES: MAX_FILE_BYTES,
    escapeHtml: escapeHtml,
    formatDate: formatDate,
    todayStamp: todayStamp,
    getNotices: getNotices,
    getNotice: getNotice,
    upsertNotice: upsertNotice,
    deleteNotice: deleteNotice,
    getStudents: getStudents,
    addStudent: addStudent,
    setStudentActive: setStudentActive,
    deleteStudent: deleteStudent,
    getSettings: getSettings,
    saveSettings: saveSettings,
    restoreDemo: restoreDemo,
    publishedForStudent: publishedForStudent,
    upcomingEvents: upcomingEvents,
    stats: stats,
    readAttachment: readAttachment,
    fileLabel: fileLabel
  };
})(window);
