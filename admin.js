import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit,
  deleteDoc, doc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";
import { firebaseConfig, ADMIN_EMAIL } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const $ = id => document.getElementById(id);
const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[char]));
let unsubscribers = [];

$("loginBtn").addEventListener("click", async () => {
  $("loginMessage").textContent = "Signing in…";
  try {
    const credential = await signInWithEmailAndPassword(auth, $("adminEmail").value.trim(), $("adminPass").value);
    if (credential.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      await signOut(auth);
      throw new Error("This account is not authorized.");
    }
  } catch (error) {
    console.error(error);
    $("loginMessage").textContent = error.message.replace("Firebase: ", "");
  }
});

$("adminPass").addEventListener("keydown", event => {
  if (event.key === "Enter") $("loginBtn").click();
});
$("logoutBtn").addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, user => {
  const authorized = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  $("loginBox").style.display = authorized ? "none" : "grid";
  $("dashboard").style.display = authorized ? "block" : "none";
  $("adminIdentity").textContent = authorized ? user.email : "";
  unsubscribers.forEach(unsubscribe => unsubscribe());
  unsubscribers = [];
  if (authorized) subscribeToData();
});

$("jobForm").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form).entries());
  $("jobMessage").textContent = "Publishing…";
  try {
    await addDoc(collection(db, "jobs"), {
      title: values.title.trim(),
      location: values.location.trim(),
      type: values.type,
      salary: values.salary.trim(),
      skills: values.skills.trim(),
      summary: values.summary.trim(),
      applyUrl: values.applyUrl.trim() || "candidate.html",
      createdAt: serverTimestamp()
    });
    form.reset();
    $("jobMessage").textContent = "Job published successfully.";
  } catch (error) {
    console.error(error);
    $("jobMessage").textContent = error.message;
  }
});

function subscribeToData() {
  unsubscribers.push(onSnapshot(
    query(collection(db, "jobs"), orderBy("createdAt", "desc"), limit(100)),
    snapshot => {
      $("adminJobs").innerHTML = snapshot.empty ? "No jobs posted." : snapshot.docs.map(item => {
        const job = item.data();
        return `<article class="admin-item">
          <div class="admin-item-top"><div><strong>${escapeHTML(job.title)}</strong><p>${escapeHTML(job.location)} • ${escapeHTML(job.type)}</p></div>
          <button class="mini-button danger" data-delete-job="${item.id}">Delete</button></div>
          <p>${escapeHTML(job.summary)}</p>
        </article>`;
      }).join("");
      document.querySelectorAll("[data-delete-job]").forEach(button => button.addEventListener("click", async () => {
        if (confirm("Delete this job?")) await deleteDoc(doc(db, "jobs", button.dataset.deleteJob));
      }));
    }
  ));

  unsubscribers.push(onSnapshot(
    query(collection(db, "candidates"), orderBy("createdAt", "desc"), limit(100)),
    snapshot => {
      $("candidateList").innerHTML = snapshot.empty ? "No candidate submissions." : snapshot.docs.map(item => {
        const person = item.data();
        return `<article class="admin-item">
          <div class="admin-item-top">
            <div><strong>${escapeHTML(person.firstName)} ${escapeHTML(person.middleName)} ${escapeHTML(person.lastName)}</strong>
            <p>${escapeHTML(person.role)} • ${escapeHTML(person.location)}</p></div>
            ${person.resumePath ? `<button class="mini-button" data-resume="${escapeHTML(person.resumePath)}">Resume</button>` : ""}
          </div>
          <p>${escapeHTML(person.email)} • ${escapeHTML(person.phone)}</p>
          ${person.linkedin ? `<p><a href="${escapeHTML(person.linkedin)}" target="_blank" rel="noopener">LinkedIn profile</a></p>` : ""}
          ${person.notes ? `<p>${escapeHTML(person.notes)}</p>` : ""}
        </article>`;
      }).join("");
      document.querySelectorAll("[data-resume]").forEach(button => button.addEventListener("click", async () => {
        try {
          const url = await getDownloadURL(ref(storage, button.dataset.resume));
          open(url, "_blank", "noopener");
        } catch (error) {
          alert(error.message);
        }
      }));
    }
  ));

  unsubscribers.push(onSnapshot(
    query(collection(db, "employerRequests"), orderBy("createdAt", "desc"), limit(100)),
    snapshot => {
      $("employerList").innerHTML = snapshot.empty ? "No employer requests." : snapshot.docs.map(item => {
        const request = item.data();
        return `<article class="admin-item">
          <strong>${escapeHTML(request.company)} — ${escapeHTML(request.role)}</strong>
          <p>${escapeHTML(request.name)} • ${escapeHTML(request.email)} • ${escapeHTML(request.phone)}</p>
          <p>${escapeHTML(request.details)}</p>
        </article>`;
      }).join("");
    }
  ));

  unsubscribers.push(onSnapshot(
    query(collection(db, "reviewSubmissions"), orderBy("createdAt", "desc"), limit(100)),
    snapshot => {
      const pending = snapshot.docs.filter(item => item.data().status !== "approved");
      $("reviewList").innerHTML = pending.length ? pending.map(item => {
        const review = item.data();
        return `<article class="admin-item">
          <strong>${escapeHTML(review.firstName)} ${escapeHTML(review.lastName)} — ${escapeHTML(review.rating)}★</strong>
          <p>${escapeHTML(review.email)} • ${escapeHTML(review.phone)}</p>
          <p>${escapeHTML(review.comment)}</p>
          <div class="mini-actions">
            ${Number(review.rating) >= 4 ? `<button class="mini-button approve" data-approve-review="${item.id}">Approve Publicly</button>` : ""}
            <button class="mini-button danger" data-reject-review="${item.id}">Reject</button>
          </div>
        </article>`;
      }).join("") : "No pending reviews.";

      document.querySelectorAll("[data-approve-review]").forEach(button => button.addEventListener("click", async () => {
        const source = snapshot.docs.find(item => item.id === button.dataset.approveReview);
        if (!source) return;
        const review = source.data();
        await addDoc(collection(db, "reviews"), {
          firstName: review.firstName,
          lastInitial: (review.lastName || "").charAt(0).toUpperCase(),
          rating: Number(review.rating),
          comment: review.comment,
          createdAt: serverTimestamp()
        });
        await updateDoc(doc(db, "reviewSubmissions", source.id), { status: "approved" });
      }));

      document.querySelectorAll("[data-reject-review]").forEach(button => button.addEventListener("click", async () => {
        if (confirm("Reject and delete this review?")) {
          await deleteDoc(doc(db, "reviewSubmissions", button.dataset.rejectReview));
        }
      }));
    }
  ));
}

document.querySelectorAll("[data-tab]").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll("[data-tab]").forEach(item => item.classList.toggle("active", item === button));
  document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.toggle("active", panel.id === `tab-${button.dataset.tab}`));
}));
