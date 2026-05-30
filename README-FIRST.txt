README-FIRST

Private Admin URL:
https://tictechstaffing.com/admin.html

Public website has NO Admin link.

Changes included:
- Review form with 1–5 star rating, first name, last name, email, number, comment.
- Review ticker only shows after 5 eligible reviews.
- Only 4–5 star reviews show publicly.
- After 50 total reviews, numeric review count appears.
- 30-company ticker added at bottom/trust band.
- Nationwide U.S. recruiting messaging added.
- Contact emails only: info@tictechstaffing.com and hr@tictechstaffing.com.

Important trust note:
Do not claim confirmed placements or partnerships with companies unless true. This site words the ticker carefully as major enterprise environments / recruiting focus.

GitHub upload:
1. Delete old files in your GitHub repository.
2. Upload all files from this ZIP.
3. Commit to main.
4. Wait 1–3 minutes and refresh tictechstaffing.com.

Firebase:
1. Create Firebase project.
2. Enable Authentication > Email/Password.
3. Create admin user, e.g. info@tictechstaffing.com.
4. Enable Firestore Database.
5. Replace firebaseConfig placeholders in app.js, candidate.js, admin.js.
6. Collections: jobs, candidates, reviews, employerRequests.

Formspree notifications:
1. Create Formspree account with info@tictechstaffing.com.
2. Create one form endpoint.
3. Replace PASTE_YOUR_FORMSPREE_ENDPOINT in app.js and candidate.js.


AI Chat Widget:
- The website includes a right-bottom TicTech AI Assistant widget.
- It opens with: "Welcome to TicTech Staffing, how may I assist you?"
- It answers common job, account, business hours, contact, and representative questions using built-in website logic.
- Representative requests are saved to Firebase collection: chatRequests.
- Representative requests also email info@tictechstaffing.com when you connect your Formspree endpoint in app.js.
- True two-way live chat where you reply from email and the visitor sees the reply inside the chat requires a live chat service like Tawk.to, Crisp, Intercom, or a custom backend. This ZIP includes the website-side request and notification workflow.

Business Hours Display:
- Monday-Friday, 9:30 AM-5:00 PM EST.
- Closed Saturday, Sunday, and U.S. public holidays.


SUBMIT PROFILE / RESUME EMAIL SETUP
-----------------------------------
The public button now says Submit Profile.
Candidate form fields are:
- First Name
- Middle Name (type N/A if none)
- Last Name
- Phone Number
- City
- State
- Email Address
- Resume Upload (PDF, DOC, DOCX)

To receive submissions instantly at info@tictechstaffing.com:
1. Log in at https://formspree.io using info@tictechstaffing.com.
2. Create a new form named TicTech Submit Profile.
3. Make sure file uploads are enabled/allowed in your Formspree plan.
4. Copy the form endpoint URL, for example https://formspree.io/f/abcdwxyz.
5. Open candidate.js.
6. Replace PASTE_YOUR_FORMSPREE_ENDPOINT with that URL.
7. Upload candidate.js back to GitHub and commit.
8. Test the Submit Profile form with a PDF resume.

Important: GitHub Pages alone cannot email resumes. Formspree or another backend is required for real-time email delivery and file attachment delivery.
