import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getStorage, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";
import { firebaseConfig, FORM_ENDPOINT } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const form = document.getElementById("candidateForm");
const message = document.getElementById("candidateMessage");
const submit = document.getElementById("candidateSubmit");
const success = document.getElementById("candidateSuccess");

function safeName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
}

async function notify(data) {
  if (!FORM_ENDPOINT || FORM_ENDPOINT.includes("YOUR_FORM_ID")) return;
  const payload = new FormData();
  Object.entries(data).forEach(([key, value]) => payload.append(key, value ?? ""));
  await fetch(FORM_ENDPOINT, { method: "POST", body: payload, headers: { Accept: "application/json" } });
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const values = new FormData(form);
  if (values.get("website")) return;

  const file = values.get("resume");
  if (!(file instanceof File) || !file.size) {
    message.textContent = "Please select your resume.";
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    message.textContent = "Resume must be 10 MB or smaller.";
    return;
  }

  submit.disabled = true;
  submit.textContent = "Uploading securely…";
  message.textContent = "";

  try {
    const id = crypto.randomUUID();
    const path = `resumes/${new Date().getFullYear()}/${id}-${safeName(file.name)}`;
    await uploadBytes(ref(storage, path), file, { contentType: file.type });

    const record = {
      firstName: String(values.get("firstName")).trim(),
      middleName: String(values.get("middleName")).trim(),
      lastName: String(values.get("lastName")).trim(),
      phone: String(values.get("phone")).trim(),
      location: String(values.get("location")).trim(),
      email: String(values.get("email")).trim(),
      role: String(values.get("role")).trim(),
      linkedin: String(values.get("linkedin")).trim(),
      notes: String(values.get("notes")).trim(),
      resumePath: path,
      resumeFileName: file.name,
      status: "new",
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, "candidates"), record);
    await notify({
      subject: "New candidate profile",
      candidate: `${record.firstName} ${record.lastName}`,
      email: record.email,
      phone: record.phone,
      location: record.location,
      role: record.role,
      resume: `${file.name} (available securely in the TicTech admin portal)`
    });

    form.reset();
    form.style.display = "none";
    success.style.display = "block";
  } catch (error) {
    console.error(error);
    message.textContent = "Submission failed. Please email your resume to info@tictechstaffing.com.";
  } finally {
    submit.disabled = false;
    submit.textContent = "Submit Profile";
  }
});
