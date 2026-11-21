# How to add teaching content to your website

Every course has its own page in the `courses` folder, for example `courses/control-systems.html`.
The **Control Systems** page is a finished example with materials, live simulations and an animation.
You can do everything below on the GitHub website. No software is needed.

---

## 1. Add lecture notes, slides or assignments (PDF, PowerPoint, Word)

**Step 1: Upload the file**

1. Go to https://github.com/gurusaravana/gurusaravana.github.io
2. Open the `courses` folder, then the `files` folder.
3. Click **Add file → Upload files**.
4. Drag your file in. To put it in a folder for the course, type the folder name before the file name, for example `process-control-fundamentals/lecture-1.pdf`.
   Tip: use simple file names with no spaces, like `lecture-1.pdf`.
5. Click **Commit changes**.

**Step 2: Show it on the course page**

1. Open the course page, for example `courses/process-control-fundamentals.html`, and click the **pencil icon** (Edit).
2. Find the part that says `<ul class="materials">`.
3. Just below it, paste this line and change the words and the file name:

```html
<li><span class="kind">Notes</span>Lecture 1: Introduction<a class="open" href="files/process-control-fundamentals/lecture-1.pdf" target="_blank">Open</a></li>
```

   The word in the first box can be anything short: `Notes`, `Slides`, `Task`, `Lab`, `Exam`, `Outline`.
4. Optional: delete the line `<p class="note">Materials for this course will be added soon.</p>`.
5. Click **Commit changes**. The page updates in about two minutes.

---

## 2. Add a live simulation

These simulations are built in and work on any course page:

| Paste this line | What it shows |
|---|---|
| `<div class="sim" data-sim="second-order"></div>` | Step response of a second-order system (damping ratio and natural frequency sliders) |
| `<div class="sim" data-sim="pid"></div>` | PID controller tuning on a process with dead time (Kp, Ki, Kd sliders) |
| `<div class="sim" data-sim="spring"></div>` | Animated mass–spring–damper with a live displacement plot |
| `<div class="sim" data-sim="pendulum"></div>` | Damped pendulum you can drag, with a live phase portrait (gravity, length, damping sliders) |
| `<div class="sim" data-sim="first-order"></div>` | First-order process with dead time: step response with the 63.2 % point marked |
| `<div class="sim" data-sim="tank"></div>` | Animated tank level with manual or automatic (PI) level control |
| `<div class="sim" data-sim="frequency"></div>` | Sine in, sine out: amplitude ratio and phase lag of a first-order process |

On a course page that has no simulations yet, the simulations section is switched off with two "delete this line" notes.
Delete those two lines (the one starting with `<!-- To show live simulations` and the one saying `delete this line too -->`), then put the simulation lines you want inside the section.

Ask Claude in the project whenever you want a new simulation (for example a tank level control, a robot arm, or a Bode plot). It is added to the same list and can then be used on any page.

---

## 3. Add a video or an online simulation

**YouTube video**: copy the video ID (the part after `v=` in the link, for example `dQw4w9WgXcQ`) and paste:

```html
<div class="video"><iframe src="https://www.youtube.com/embed/VIDEO-ID" allowfullscreen></iframe></div>
```

**Online simulations (PhET, GeoGebra, Falstad circuits, MATLAB Online, etc.)**: most of these sites give you an "Embed" link. Paste it the same way:

```html
<div class="video"><iframe src="PASTE-THE-EMBED-LINK-HERE" allowfullscreen></iframe></div>
```

**Your own animation file** (GIF or MP4): upload it to `courses/files/<course>/` as in section 1, then paste:

```html
<img src="files/control-systems/my-animation.gif" alt="Short description" style="max-width:100%;border-radius:12px">
<video src="files/control-systems/my-video.mp4" controls style="width:100%;border-radius:12px"></video>
```

GitHub only accepts files up to 25 MB through the website, so put long videos on YouTube and embed them.

---

## 4. Add a new course

1. Open any course page, for example `courses/nonlinear-control.html`, click **Raw**, and copy everything.
2. In the `courses` folder, click **Add file → Create new file**, name it like `my-new-course.html`, paste, and change the title and description.
3. In `index.html`, find the Teaching section and copy one course line, changing the name and the link to `courses/my-new-course.html`.

If anything goes wrong, nothing is lost: GitHub keeps every earlier version. Just ask Claude to fix it.

---

## 5. Change the website colours

The site uses the **Glass** theme. Its colours are in `assets/css/style.css`, in the block that starts with `/* ================= Glass theme`. For example, change `--accent:#4f46e5` to another colour code to change the colour used for links and highlights.

---

## 6. Add a photo to the Gallery (professional updates)

**Step 1: Upload the photo**

1. Go to https://github.com/gurusaravana/gurusaravana.github.io and open the `assets` folder, then `gallery`.
2. Click **Add file → Upload files**, drag your photo in, and click **Commit changes**.
   Tip: name it with the date and a word or two, like `2026-03-ieee-meeting.jpg` (no spaces). Photos from a phone are fine.

**Step 2: Show it on the website**

1. Open `index.html` and click the **pencil icon** (Edit).
2. Press Ctrl+F (Cmd+F on Mac) and search for `<div class="gallery">`.
3. On the line just below it, paste this block and change the words:

```html
<figure class="gitem">
  <img src="assets/gallery/2026-03-ieee-meeting.jpg" alt="Short description of the photo" loading="lazy">
  <figcaption><span class="gdate">March 2026 · Talk</span><b>Title of the event</b>One sentence about it.</figcaption>
</figure>
```

   Newest items go first. The word after the date can be anything: Talk, Award, Conference, Workshop, Students, Visit.
4. Click **Commit changes**. The gallery updates in about two minutes.

**To change a caption:** search for the title text in `index.html` and edit the words.

**To remove a card:** delete everything from its `<figure` line to its `</figure>` line.

---

## 7. The full course site (Process Dynamics and Control)

`courses/process-dynamics-and-control.html` is a complete course site, and a model for turning any other course into one:

- **Course home**: `courses/process-dynamics-and-control.html`
- **Syllabus** and **schedule**: `courses/process-dynamics-and-control/syllabus.html` and `schedule.html`
- **Lessons**: one file each, `courses/process-dynamics-and-control/01-introduction.html` to `14-introduction-to-mpc.html`

Each lesson has objectives, notes, a lecture video slot, a simulation and exercises with hidden solutions. To edit a lesson, open its file on GitHub and change the text. Equations are written in LaTeX between `$ ... $`, for example `$G(s) = K/(\tau s + 1)$`.

To put a lecture video into a lesson, find the `<div class="video-slot">` block in that lesson and replace it with the YouTube line shown in section 3.

## 8. Current and past courses

On the home page, the Teaching section has **Current courses** (Presidency University) and **Past courses**. To list a current course, find the comment `To list a current course` in `index.html` and paste a line like this inside the list:

```html
<li><a href="courses/control-systems.html">Control Systems</a></li>
```
