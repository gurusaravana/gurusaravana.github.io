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
| `<div class="sim" data-sim="rlc"></div>` | Series RLC circuit step response (capacitor, resistor or inductor voltage) |
| `<div class="sim" data-sim="rc-ladder"></div>` | Two-loop RC network showing the loading effect |
| `<div class="sim" data-sim="two-mass"></div>` | Animated two-mass spring–damper system with a step force |
| `<div class="sim" data-sim="laplace"></div>` | Partial fractions explorer for the three root cases |

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

---

## 9. Add a research project

The Research section on the home page has **Research areas** and **Research projects**. Each project is one card with a title, status (Ongoing or Completed), period, funding, your role, a short description, and an optional photo and links.

**Using VS Code and GitHub Desktop (on your computer)**

1. In GitHub Desktop, click **Fetch origin** (or **Pull origin**) so your copy is up to date.
2. Click **Open in Visual Studio Code**, then open `index.html`.
3. Press Ctrl+F (Cmd+F on Mac) and search for `HOW TO ADD A RESEARCH PROJECT`. Just below it is a ready-made card.
4. Copy the card, from `<article class="card project">` to `</article>`.
5. Paste it on the line just below `<div class="projects">`, so the newest project shows first.
6. Change the words. Delete any line you do not need, for example the photo, the Partners line or a link.
   - For an ongoing project keep `<span class="rstatus on">Ongoing</span>` (it shows in green).
   - For a finished one use `<span class="rstatus">Completed</span>`.
7. **Optional photo:** copy the photo into the folder `assets/research/` (create it the first time) and put its file name after `src=`, for example `assets/research/2026-drone-lab.jpg`. Use no spaces in the name.
8. Save the file. In GitHub Desktop, type a short summary such as "Add drone lab project", click **Commit to master**, then **Push origin**. The website updates in about two minutes.

The ready-made card looks like this:

```html
<article class="card project">
  <img class="pimg" src="assets/research/my-project.jpg" alt="Short description of the photo" loading="lazy">
  <span class="rstatus on">Ongoing</span>
  <h3>Title of the project</h3>
  <dl class="pmeta">
    <dt>Period</dt><dd>2026 – 2028</dd>
    <dt>Funding</dt><dd>Name of the funding agency · amount (optional)</dd>
    <dt>Role</dt><dd>Principal Investigator</dd>
    <dt>Partners</dt><dd>Partner university or industry (optional)</dd>
  </dl>
  <p>Two or three sentences about the aim of the project and what it produced.</p>
  <div class="plinks"><a href="https://example.com" target="_blank" rel="noopener">Project page</a></div>
</article>
```

You can add any other line in the same style, such as `<dt>Students</dt><dd>2 MSc, 1 PhD</dd>`.

**To change a project:** search for its title in `index.html` and edit the words.
**To remove a project:** delete everything from its `<article` line to its `</article>` line.
**To change a research area:** search for its title (for example `Autonomous vehicles and robotics`) and edit the text.

---

## 10. Julia simulations (notebook page)

The Control System Engineering course has a notebook-style page, `courses/control-system-engineering/julia-simulations.html`. Each example shows the Julia code, what it prints and an interactive plot with sliders. The plots run in the visitor's browser, so nobody needs Julia installed to see them. Students can copy the code, download one example as a `.jl` file, or download all examples as one Jupyter notebook (`.ipynb`).

**Change the text or the code of an example**

1. In GitHub Desktop click **Fetch origin**, then **Open in Visual Studio Code**.
2. Open `courses/control-system-engineering/julia-simulations.html`.
3. Each example starts with a comment like `<!-- ===== EXAMPLE 3: PID control ... ===== -->`.
   - The explanation is inside `<div class="nb-md notes">`. Equations work as on the lesson pages: `$ ... $`.
   - The Julia code is between `<code class="julia">` and `</code>`. Type it normally, except write `<` as `&lt;` and `>` as `&gt;`.
4. Save, then in GitHub Desktop **Commit to master** and **Push origin**.

Note: the sliders and live plot of the six built-in examples are worked out by `assets/js/julia-notebook.js` with the same equations as the Julia code. If you change the model in the code (for example a different plant), the slider plot will not change with it. Ask Claude to update the live plot too.

**Add a new example (code only)**

1. Near the end of the file, search for `TEMPLATE`. Copy the example between the comment lines.
2. Paste it just above the `TEMPLATE` comment, remove the `<!--` and `-->` around it, and change the number, title, text and code.
3. It appears with Copy and Download buttons, and is included in the downloadable notebook. (A live slider plot needs a small addition to the JavaScript; ask Claude.)

**Running the code yourself:** install Julia from julialang.org, then in Julia run `using Pkg; Pkg.add(["ControlSystems", "Plots", "IJulia"])` once. Start Jupyter with `using IJulia; notebook()` and open the downloaded notebook.

## 11. Show a Jupyter notebook on a page (read-only view)

Students can read a whole Jupyter notebook (`.ipynb`) on the website, with its notes, equations, code and any saved plots, without installing anything or downloading the file. A **Download .ipynb** button sits at the top of the view, and every code cell has a **Copy code** button.

The Julia notebook is already set up: `courses/control-system-engineering/julia-notebook.html` shows the file `courses/control-system-engineering/notebooks/control-systems-julia.ipynb`. The Julia simulations page links to it with **Read the notebook online (no download)**.

**Show the plots too (recommended, once)**

The notebook is saved without outputs, so for now the view shows text and code only. To add the plots:

1. Open the notebook in Jupyter on your computer (`using IJulia; notebook()` in Julia) and choose **Run → Run All Cells** (or **Cell → Run All**).
2. When every cell has finished, press **Save**.
3. Copy the saved file over `courses/control-system-engineering/notebooks/control-systems-julia.ipynb` (keep the same name).
4. In GitHub Desktop: **Commit to master**, then **Push origin**. The plots now appear on the website.

**After you change an example on the Julia simulations page**

Open the Julia simulations page in your browser, click **Download all examples as a Jupyter notebook**, and save the file over `notebooks/control-systems-julia.ipynb` as in step 3 (then run it again if you want the plots).

**Add any other notebook (any course, Julia or Python)**

1. Make a folder called `notebooks` next to the course page (for example `courses/control-system-engineering/notebooks/`) and put your `.ipynb` file in it.
2. Make a copy of `julia-notebook.html` in the same folder as the page and give it a new name, for example `lab-3-notebook.html`.
3. In the copy, change `data-src="notebooks/control-systems-julia.ipynb"` to your file name, and change the title and the first paragraph at the top.
4. Link to the new page from the course page, for example `<a href="control-system-engineering/lab-3-notebook.html">Lab 3 notebook</a>`.
5. Commit and push as usual.

You can also put the view inside any existing page: add `<div class="ipynb" data-src="notebooks/my-notebook.ipynb"></div>` where it should appear and `<script src="../../assets/js/ipynb-view.js"></script>` just before `</body>`.

Tips:
- Keep notebooks small (under about 10 MB). Very large plots make the page slow.
- Clear any cell output that shows private information before you save.
- When you open a page straight from your computer (double-click), the browser blocks the notebook and shows a download link instead. It works on the live website. To preview locally, use the **Go Live** button of the VS Code "Live Server" extension.

## 12. Lab experiments page (Control System Engineering Laboratory)

The page is `courses/control-system-engineering-laboratory/experiments.html`. Each experiment is one `<section class="lsec labexp" id="expN">` block with:

- the aim in `<p class="aim">`,
- a diagram: `<figure class="diagram"><img src="../../assets/img/diagrams/lab-....svg" ...></figure>`,
- the simulation: `<div class="sim labsim" data-lab="expN"></div>` (sliders and maths are in `assets/js/lab-experiments.js`),
- the practice questions: the `<ol>` inside `<div class="card questions">`.

To add or change a question, copy one `<li>...</li>` line and change the words. LaTeX between `$ ... $` works.
To change a default slider value, open `assets/js/lab-experiments.js`, find `LAB.expN` and change `val:` for that slider.
