// auth.js
import { auth } from "./data.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  signOut,
  OAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorDiv = document.getElementById("error");

const mainBtn = document.getElementById("mainBtn");
const resendBtn = document.getElementById("resendBtn");
const registerTab = document.getElementById("registerTab");
const microsoftBtn = document.getElementById("microsoftBtn");

let mode = "login";
let resendCooldown = 60;
let resendTimer = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    if (user.providerData.some((p) => p.providerId === "microsoft.com")) {
      window.location.href = "home.html";
      return;
    }

    if (user.emailVerified) {
      window.location.href = "home.html";
    }
  }
});

function showError(message) {
  errorDiv.className = "";
  errorDiv.innerText = message;
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

mainBtn.onclick = async () => {
  if (mode === "login") {
    await login();
  } else {
    await register();
  }
};

registerTab.onclick = () => {
  mode = "register";
  errorDiv.innerText = "";
  errorDiv.className = "";
  resendBtn.classList.add("hidden");
  mainBtn.innerHTML = `<span>Create account</span><b>→</b>`;
};

async function register() {
  errorDiv.innerText = "";
  errorDiv.className = "";

  const email = getEmail();
  const password = getPassword();

  if (!email || !password) return;

  setLoading(mainBtn, true, "Create account");

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);

    await sendEmailVerification(userCred.user);
    await signOut(auth);

    showSuccess("Verification email sent! Check your inbox.", true);

    mode = "login";
    mainBtn.innerHTML = `<span>Log in</span><b>→</b>`;
  } catch (err) {
    showError(cleanFirebaseError(err.message));
  } finally {
    mainBtn.disabled = false;
    mainBtn.innerHTML =
      mode === "login"
        ? `<span>Log in</span><b>→</b>`
        : `<span>Create account</span><b>→</b>`;
  }
}

async function login() {
  errorDiv.innerText = "";
  errorDiv.className = "";

  const email = getEmail();
  const password = getPassword();

  if (!email || !password) return;

  setLoading(mainBtn, true, "Log in");

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
    mainBtn.disabled = false;
    mainBtn.innerHTML = `<span>Log in</span><b>→</b>`;
  }
}

microsoftBtn.onclick = async () => {
  errorDiv.innerText = "";
  errorDiv.className = "";

  const provider = new OAuthProvider("microsoft.com");

  microsoftBtn.disabled = true;
  microsoftBtn.innerText = "Please wait...";

  try {
    await signInWithPopup(auth, provider);
    window.location.href = "home.html";
  } catch (err) {
    showError(cleanFirebaseError(err.message));
  } finally {
    microsoftBtn.disabled = false;
    microsoftBtn.innerHTML = `
      <span class="ms">
        <i></i><i></i><i></i><i></i>
      </span>
      Microsoft
    `;
  }
};

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

  if (message.includes("auth/popup-closed-by-user")) {
    return "Microsoft sign-in was closed.";
  }

  if (message.includes("auth/account-exists-with-different-credential")) {
    return "This email is already registered with another login method.";
  }

  return message;
}