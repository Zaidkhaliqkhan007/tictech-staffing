import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { firebaseConfig, FORM_ENDPOINT } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const state = { jobs: [], rating: 0 };

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[char]));

const header = $(".site-header");
addEventListener("scroll", () => header.classList.toggle("scrolled", scrollY > 18), { passive: true });

const menuButton = $("#menuButton");
const navLinks = $("#navLinks");
menuButton?.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});
$$(".nav-links a").forEach(link => link.addEventListener("click", () => {
  navLinks.classList.remove("open");
  menuButton?.setAttribute("aria-expanded", "false");
}));

const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) {
    entry.target.classList.add("visible");
    revealObserver.unobserve(entry.target);
  }
}), { threshold: .12 });
$$(".reveal").forEach(item => revealObserver.observe(item));

const countObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  const element = entry.target;
  const target = Number(element.dataset.count || 0);
  const suffix = target === 50 ? "" : "+";
  let value = 0;
  const step = Math.max(1, Math.ceil(target / 35));
  const timer = setInterval(() => {
    value = Math.min(target, value + step);
    element.textContent = `${value}${suffix}`;
    if (value >= target) clearInterval(timer);
  }, 34);
  countObserver.unobserve(element);
}), { threshold: .6 });
$$("[data-count]").forEach(item => countObserver.observe(item));

function friendlyDate(timestamp) {
  if (!timestamp?.toDate) return "Recently posted";
  return timestamp.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function renderJobs() {
  const grid = $("#jobsGrid");
  if (!grid) return;
  const search = ($("#jobSearch")?.value || "").trim().toLowerCase();
  const type = $("#jobTypeFilter")?.value || "";
  const jobs = state.jobs.filter(job => {
    const haystack = `${job.title} ${job.location} ${job.summary} ${job.skills}`.toLowerCase();
    return (!search || haystack.includes(search)) && (!type || job.type === type);
  });

  if (!jobs.length) {
    grid.innerHTML = `<div class="jobs-state">${state.jobs.length ? "No opportunities match that search." : "No live roles are posted right now. Submit your profile to join our talent network."}</div>`;
    return;
  }

  grid.innerHTML = jobs.map(job => `
    <article class="job-card">
      <div class="job-card-top">
        <span class="job-type">${escapeHTML(job.type || "Opportunity")}</span>
        <small>${friendlyDate(job.createdAt)}</small>
      </div>
      <h3>${escapeHTML(job.title)}</h3>
      <p class="job-meta">${escapeHTML(job.location || "United States")} ${job.salary ? `• ${escapeHTML(job.salary)}` : ""}</p>
      <p>${escapeHTML(job.summary || "View this opportunity and submit your profile for consideration.")}</p>
      <a class="text-link" href="${escapeHTML(job.applyUrl || "candidate.html")}">View opportunity <span>→</span></a>
    </article>
  `).join("");
}

$("#jobSearch")?.addEventListener("input", renderJobs);
$("#jobTypeFilter")?.addEventListener("change", renderJobs);

try {
  onSnapshot(
    query(collection(db, "jobs"), orderBy("createdAt", "desc"), limit(30)),
    snapshot => {
      state.jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderJobs();
    },
    error => {
      console.error(error);
      $("#jobsGrid").innerHTML = `<div class="jobs-state">Live jobs are temporarily unavailable. Please submit your profile or contact our team.</div>`;
    }
  );
} catch (error) {
  console.error(error);
}

async function notify(payload) {
  if (!FORM_ENDPOINT || FORM_ENDPOINT.includes("YOUR_FORM_ID")) return;
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => formData.append(key, value ?? ""));
  await fetch(FORM_ENDPOINT, { method: "POST", body: formData, headers: { Accept: "application/json" } });
}

$("#employerForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $("#employerMessage");
  const data = Object.fromEntries(new FormData(form).entries());
  if (data.website) return;
  message.textContent = "Submitting your request…";
  try {
    const record = {
      company: data.company.trim(),
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      role: data.role.trim(),
      details: data.details.trim(),
      status: "new",
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, "employerRequests"), record);
    await notify({ subject: "New employer request", ...data });
    form.reset();
    message.textContent = "Your request was received. Our team will follow up during business hours.";
  } catch (error) {
    console.error(error);
    message.textContent = "We could not submit the request. Please email info@tictechstaffing.com.";
  }
});

const stars = $$("#stars button");
stars.forEach(button => button.addEventListener("click", () => {
  state.rating = Number(button.dataset.rating);
  stars.forEach(star => {
    const active = Number(star.dataset.rating) <= state.rating;
    star.classList.toggle("active", active);
    star.setAttribute("aria-checked", String(Number(star.dataset.rating) === state.rating));
  });
}));

$("#reviewForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $("#reviewMessage");
  const data = Object.fromEntries(new FormData(form).entries());
  if (data.website) return;
  if (!state.rating) {
    message.textContent = "Please select a star rating.";
    return;
  }
  message.textContent = "Submitting your review…";
  try {
    await addDoc(collection(db, "reviewSubmissions"), {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      rating: state.rating,
      comment: data.comment.trim(),
      status: "pending",
      createdAt: serverTimestamp()
    });
    await notify({ subject: "New website review", rating: state.rating, ...data });
    form.reset();
    state.rating = 0;
    stars.forEach(star => star.classList.remove("active"));
    message.textContent = "Thank you. Your review was submitted for verification.";
  } catch (error) {
    console.error(error);
    message.textContent = "We could not submit your review. Please try again.";
  }
});

try {
  onSnapshot(
    query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(20)),
    snapshot => {
      const reviews = snapshot.docs.map(doc => doc.data()).filter(review => Number(review.rating) >= 4);
      const display = $("#reviewsDisplay");
      if (!display || reviews.length < 5) return;
      display.hidden = false;
      $("#reviewCount").textContent = reviews.length >= 50 ? `${reviews.length}+ verified reviews` : "Verified feedback";
      $("#reviewStack").innerHTML = reviews.map(review => `
        <article class="review-item">
          <strong>${escapeHTML(review.firstName)} ${escapeHTML(review.lastInitial || "")}.</strong>
          <span>${"★".repeat(Math.min(5, Number(review.rating) || 5))}</span>
          <p>${escapeHTML(review.comment)}</p>
        </article>
      `).join("");
    }
  );
} catch (error) {
  console.error(error);
}

const widget = $("#assistantWidget");
const panel = $("#assistantPanel");
const messages = $("#assistantMessages");
const assistantInput = $("#assistantInput");

function openAssistant() {
  panel.hidden = false;
  setTimeout(() => assistantInput?.focus(), 50);
}
function closeAssistant() { panel.hidden = true; }
$("#assistantBubble")?.addEventListener("click", openAssistant);
$("#assistantClose")?.addEventListener("click", closeAssistant);

function addChatMessage(text, type = "bot") {
  const node = document.createElement("div");
  node.className = `assistant-message ${type}`;
  node.textContent = text;
  messages.appendChild(node);
  messages.scrollTop = messages.scrollHeight;
}

function answerChat(message) {
  const text = message.toLowerCase();
  if (text.includes("job") || text.includes("role") || text.includes("opening")) {
    if (!state.jobs.length) return "No live roles are posted right now. You can submit your profile to join our talent network.";
    return `We currently have ${state.jobs.length} live role${state.jobs.length === 1 ? "" : "s"}. The newest is ${state.jobs[0].title} in ${state.jobs[0].location || "the United States"}. See the Jobs section for details.`;
  }
  if (text.includes("profile") || text.includes("account") || text.includes("resume")) {
    return "Select Submit Profile in the website menu. Complete the form and upload a PDF or Word resume.";
  }
  if (text.includes("representative") || text.includes("human") || text.includes("person")) {
    return "Email info@tictechstaffing.com or call (516) 667-0017. Business hours are Monday–Friday, 9:30 AM–5:00 PM EST.";
  }
  if (text.includes("hour") || text.includes("open")) {
    return "Business hours are Monday–Friday, 9:30 AM–5:00 PM EST. We are closed weekends and U.S. public holidays.";
  }
  return "I can help with current jobs, profile and resume questions, business hours, or connecting you with a representative.";
}

$("#assistantForm")?.addEventListener("submit", event => {
  event.preventDefault();
  const message = assistantInput.value.trim();
  if (!message) return;
  addChatMessage(message, "user");
  assistantInput.value = "";
  setTimeout(() => addChatMessage(answerChat(message)), 320);
});
$$("[data-chat]").forEach(button => button.addEventListener("click", () => {
  const type = button.dataset.chat;
  const prompt = type === "jobs" ? "Show current jobs" : type === "profile" ? "How do I submit my profile?" : "I want to talk with a representative";
  addChatMessage(prompt, "user");
  setTimeout(() => addChatMessage(answerChat(prompt)), 250);
}));

const now = new Date();
const day = now.getDay();
const hour = now.getHours() + now.getMinutes() / 60;
const open = day >= 1 && day <= 5 && hour >= 9.5 && hour < 17;
$("#assistantStatus").textContent = open ? "Online during business hours" : "After-hours support";
