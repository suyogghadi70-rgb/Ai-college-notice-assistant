/**
 * AI College Notice Assistant — Phase 1 authentication
 *
 * Demo-only session using localStorage. Later phases can replace
 * DEMO_USERS and login() with a MySQL/API-backed auth module without
 * changing dashboard pages.
 */
(function (window) {
  "use strict";

  var STORAGE_KEY = "acna.session";
  var REMEMBER_KEY = "acna.remember";

  /** Hardcoded Phase 1 demo accounts. Replace with API in Phase 10. */
  var DEMO_USERS = {
    admin: {
      email: "admin@college.com",
      password: "admin123",
      role: "admin",
      name: "Administrator"
    },
    student: {
      email: "student@college.com",
      password: "student123",
      role: "student",
      name: "Suyog",
      branch: "Electronics & Computer Engineering",
      semester: "4",
      division: "A"
    }
  };

  function getSession() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function setSession(user) {
    var session = {
      email: user.email,
      role: user.role,
      name: user.name,
      branch: user.branch || null,
      semester: user.semester || null,
      division: user.division || null,
      loggedInAt: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function findUser(email, password, role) {
    var key;
    for (key in DEMO_USERS) {
      if (!Object.prototype.hasOwnProperty.call(DEMO_USERS, key)) continue;
      var user = DEMO_USERS[key];
      if (
        user.email.toLowerCase() === String(email).trim().toLowerCase() &&
        user.password === password &&
        user.role === role
      ) {
        return user;
      }
    }
    return null;
  }

  function dashboardFor(role) {
    return role === "admin" ? "admin-dashboard.html" : "student-dashboard.html";
  }

  /**
   * Protect a dashboard page. Call on admin/student pages.
   * @param {"admin"|"student"} requiredRole
   */
  function requireAuth(requiredRole) {
    var session = getSession();
    if (!session) {
      window.location.replace("index.html");
      return null;
    }
    if (requiredRole && session.role !== requiredRole) {
      window.location.replace(dashboardFor(session.role));
      return null;
    }
    return session;
  }

  function redirectIfLoggedIn() {
    var session = getSession();
    if (session) {
      window.location.replace(dashboardFor(session.role));
    }
  }

  function login(email, password, role, remember) {
    var user = findUser(email, password, role);
    if (!user) {
      return { ok: false, message: "Invalid email, password, or role. Please try the demo credentials." };
    }
    setSession(user);
    if (remember) {
      localStorage.setItem(
        REMEMBER_KEY,
        JSON.stringify({ email: user.email, role: user.role })
      );
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
    return { ok: true, user: user, redirect: dashboardFor(user.role) };
  }

  function logout() {
    clearSession();
    window.location.replace("index.html");
  }

  function getRemembered() {
    try {
      var raw = localStorage.getItem(REMEMBER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  window.ACNAAuth = {
    DEMO_USERS: DEMO_USERS,
    getSession: getSession,
    requireAuth: requireAuth,
    redirectIfLoggedIn: redirectIfLoggedIn,
    login: login,
    logout: logout,
    getRemembered: getRemembered
  };
})(window);

document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("login-form");
  if (!form || !window.ACNAAuth) return;

  window.ACNAAuth.redirectIfLoggedIn();

  var emailInput = document.getElementById("email");
  var passwordInput = document.getElementById("password");
  var errorBox = document.getElementById("login-error");
  var toggleBtn = document.getElementById("toggle-password");
  var remembered = window.ACNAAuth.getRemembered();

  if (remembered) {
    emailInput.value = remembered.email || "";
    var roleInput = document.querySelector('input[name="role"][value="' + remembered.role + '"]');
    if (roleInput) roleInput.checked = true;
    document.getElementById("remember").checked = true;
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      var hidden = passwordInput.type === "password";
      passwordInput.type = hidden ? "text" : "password";
      toggleBtn.setAttribute("aria-label", hidden ? "Hide password" : "Show password");
      toggleBtn.innerHTML = hidden
        ? '<i class="bi bi-eye-slash"></i>'
        : '<i class="bi bi-eye"></i>';
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    errorBox.classList.remove("show");
    errorBox.textContent = "";

    var email = emailInput.value.trim();
    var password = passwordInput.value;
    var roleEl = document.querySelector('input[name="role"]:checked');
    var remember = document.getElementById("remember").checked;

    if (!email || !password || !roleEl) {
      errorBox.innerHTML = '<i class="bi bi-exclamation-circle"></i> Please fill in email, password, and role.';
      errorBox.classList.add("show");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorBox.innerHTML = '<i class="bi bi-exclamation-circle"></i> Enter a valid email address.';
      errorBox.classList.add("show");
      return;
    }

    var result = window.ACNAAuth.login(email, password, roleEl.value, remember);
    if (!result.ok) {
      errorBox.innerHTML = '<i class="bi bi-exclamation-circle"></i> ' + result.message;
      errorBox.classList.add("show");
      return;
    }

    window.location.href = result.redirect;
  });
});
