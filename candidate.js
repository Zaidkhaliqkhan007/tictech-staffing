import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_PROJECT.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};

// Put your Formspree endpoint here. Example: https://formspree.io/f/abcdwxyz
const FORM_ENDPOINT = "PASTE_YOUR_FORMSPREE_ENDPOINT";

let db;
try { db = getFirestore(initializeApp(firebaseConfig)); } catch (e) {}

const form = document.getElementById("candidateForm");
const msg = document.getElementById("candidateMsg");

form.onsubmit = async (e) => {
  e.preventDefault();
  msg.textContent = "Submitting your profile...";

  const formData = new FormData(form);
  const middle = (formData.get("middleName") || "").trim();
  if (!middle) formData.set("middleName", "N/A");
  formData.set("submissionType", "New Candidate Profile");
  formData.set("sentTo", "info@tictechstaffing.com");
  formData.set("submittedAt", new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));

  const email = formData.get("email") || "";
  const replyto = form.querySelector('input[name="_replyto"]');
  if (replyto) replyto.value = email;

  const resume = formData.get("resume");
  const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  const nameOk = resume && /\.(pdf|doc|docx)$/i.test(resume.name || "");
  if (!resume || (!allowed.includes(resume.type) && !nameOk)) {
    msg.textContent = "Please upload a PDF, DOC, or DOCX resume file.";
    return;
  }

  try {
    if (db && !firebaseConfig.apiKey.includes("PASTE_")) {
      await addDoc(collection(db, "candidateProfiles"), {
        firstName: formData.get("firstName"),
        middleName: formData.get("middleName"),
        lastName: formData.get("lastName"),
        phone: formData.get("phone"),
        city: formData.get("city"),
        state: formData.get("state"),
        email: formData.get("email"),
        resumeFileName: resume.name || "resume",
        createdAt: serverTimestamp()
      });
    }

    if (FORM_ENDPOINT.includes("PASTE_")) {
      msg.textContent = "Profile form is ready. Add your Formspree endpoint in candidate.js to receive submissions at info@tictechstaffing.com.";
      return;
    }

    const response = await fetch(FORM_ENDPOINT, {
      method: "POST",
      body: formData,
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) throw new Error("Formspree submission failed");

    msg.textContent = "Thank you. Your profile and resume have been submitted to TicTech Staffing.";
    form.reset();
  } catch (err) {
    console.error(err);
    msg.textContent = "Something went wrong. Please email your resume to info@tictechstaffing.com.";
  }
};
