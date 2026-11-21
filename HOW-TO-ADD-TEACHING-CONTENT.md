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
