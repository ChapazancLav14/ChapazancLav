//auth.js
import { auth } from "./data.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorDiv = document.getElementById("error");

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const mainBtn = document.getElementById("mainBtn");
const resendBtn = document.getElementById("resendBtn");

const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");

let mode = "login";
let registerStep = "email";

let resendCooldown = 60;
let resendTimer = null;

onAuthStateChanged(auth, (user) => {
  if (user && user.emailVerified) {
    window.location.href = "home.html";
  }
});

// ===============================
// MODE
// ===============================
function setMode(newMode) {
  mode = newMode;
  registerStep = "email";

  errorDiv.innerText = "";
  errorDiv.className = "";

  loginTab.classList.toggle("active", mode === "login");
  registerTab.classList.toggle("active", mode === "register");

  resendBtn.classList.add("hidden");

  passwordInput.value = "";
  emailInput.value = emailInput.value; // keep email

  if (mode === "login") {
    authTitle.innerText = "Login";
    authSubtitle.innerText = "Welcome back. Continue your progress.";
    passwordInput.classList.remove("hidden");
    passwordInput.placeholder = "Password";
    mainBtn.innerText = "Login";
  } else {
    authTitle.innerText = "Create account";
    authSubtitle.innerText = "First enter your email.";
    passwordInput.classList.add("hidden");
    passwordInput.value = "";
    mainBtn.innerText = "Continue";
  }
}

loginTab.onclick = () => setMode("login");
registerTab.onclick = () => setMode("register");

// ===============================
// HELPERS
// ===============================
function showError(message, showResend = false) {
  errorDiv.className = "";
  errorDiv.innerText = message;

  if (showResend) {
    resendBtn.classList.remove("hidden");
  }
}

function showSuccess(message, showResend = false) {
  errorDiv.className = "success";
  errorDiv.innerText = message;

  if (showResend) {
    resendBtn.classList.remove("hidden");
  }
}

function setLoading(button, isLoading, text) {
  button.disabled = isLoading;
  button.innerText = isLoading ? "Please wait..." : text;
}

function isValidEmail(email) {
  email = email.toLowerCase();
  emailInput.value = email;

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!regex.test(email)) {
    return { valid: false, message: "Invalid email format" };
  }

  const badGmail = ["gamil.com", "gmail.cmo", "gmial.com", "gmail.con"];

  for (let bad of badGmail) {
    if (email.endsWith("@" + bad)) {
      return { valid: false, message: "Did you mean @gmail.com ?" };
    }
  }

  return { valid: true };
}

function getEmail() {
  const email = emailInput.value.trim();
  const check = isValidEmail(email);

  if (!check.valid) {
    showError(check.message);
    return null;
  }

  return email;
}

function getPassword() {
  const password = passwordInput.value.trim();

  if (password.length < 6) {
    showError("Password must be at least 6 characters");
    return null;
  }

  return password;
}

function startResendCooldown() {
  resendBtn.disabled = true;
  resendBtn.innerText = `Resend in ${resendCooldown}s`;

  resendTimer = setInterval(() => {
    resendCooldown--;
    resendBtn.innerText = `Resend in ${resendCooldown}s`;

    if (resendCooldown <= 0) {
      clearInterval(resendTimer);
      resendCooldown = 60;
      resendBtn.disabled = false;
      resendBtn.innerText = "Resend Verification";
    }
  }, 1000);
}

// ===============================
// MAIN BUTTON
// ===============================
mainBtn.onclick = async () => {
  if (mode === "login") {
    await login();
    return;
  }

  if (registerStep === "email") {
    const email = getEmail();
    if (!email) return;

    registerStep = "password";

    authSubtitle.innerText =
      "Now create a password. After registration, verify your email.";
    passwordInput.classList.remove("hidden");
    passwordInput.focus();
    mainBtn.innerText = "Create account";
    return;
  }

  await register();
};

// ===============================
// REGISTER
// ===============================
async function register() {
  errorDiv.innerText = "";
  errorDiv.className = "";

  const email = getEmail();
  const password = getPassword();

  if (!email || !password) return;

  setLoading(mainBtn, true, "Create account");

  try {
    const userCred = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    await sendEmailVerification(userCred.user);
    await signOut(auth);

    showSuccess("Verification email sent! Check your inbox.", true);
    setMode("login");
  } catch (err) {
    showError(cleanFirebaseError(err.message));
  } finally {
    setLoading(mainBtn, false, mode === "login" ? "Login" : "Create account");
  }
}

// ===============================
// LOGIN
// ===============================
async function login() {
  errorDiv.innerText = "";
  errorDiv.className = "";

  const email = getEmail();
  const password = getPassword();

  if (!email || !password) return;

  setLoading(mainBtn, true, "Login");

  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);

    await userCred.user.reload();

    if (!userCred.user.emailVerified) {
      showSuccess("Please verify your email first.", true);
      return;
    }

    window.location.href = "home.html";
  } catch (err) {
    showError(cleanFirebaseError(err.message));
  } finally {
    setLoading(mainBtn, false, "Login");
  }
}

// ===============================
// RESEND VERIFICATION
// ===============================
resendBtn.onclick = async () => {
  errorDiv.innerText = "";
  errorDiv.className = "";

  const email = getEmail();
  const password = getPassword();

  if (!email || !password) return;

  resendBtn.disabled = true;

  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);

    await userCred.user.reload();

    if (userCred.user.emailVerified) {
      showSuccess("Your email is already verified. You can log in.");
      resendBtn.classList.add("hidden");
      return;
    }

    await sendEmailVerification(userCred.user);

    showSuccess("Verification email resent!", true);
    startResendCooldown();
  } catch (err) {
    resendBtn.disabled = false;
    showError(cleanFirebaseError(err.message));
  }
};

// ===============================
// ENTER KEY
// ===============================
passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    mainBtn.click();
  }
});

emailInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    mainBtn.click();
  }
});

// ===============================
// ERRORS
// ===============================
function cleanFirebaseError(message) {
  if (message.includes("auth/email-already-in-use")) {
    return "This email is already registered.";
  }

  if (message.includes("auth/invalid-credential")) {
    return "Wrong email or password.";
  }

  if (message.includes("auth/user-not-found")) {
    return "No account found with this email.";
  }

  if (message.includes("auth/wrong-password")) {
    return "Wrong password.";
  }

  if (message.includes("auth/too-many-requests")) {
    return "Too many attempts. Try again later.";
  }

  if (message.includes("auth/network-request-failed")) {
    return "Network error. Check your internet connection.";
  }

  return message;
}
