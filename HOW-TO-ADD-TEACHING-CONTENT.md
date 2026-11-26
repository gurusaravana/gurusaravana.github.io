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

## 13. Module 1 lecture content (Control System Engineering, Lessons 1, 5 and 6)

The Module 1 slide decks (Lecture 1, block diagram reduction, signal flow graphs) are written out as web pages in:

- `courses/control-system-engineering/01-introduction.html` (what a control system is, open vs closed loop, thermostat, bimetallic strip, classification, regulator vs servo, design process),
- `courses/control-system-engineering/05-block-diagrams.html` (elements, RLC example, the nine reduction rules, superposition, the "knot" case study and 7 figure problems),
- `courses/control-system-engineering/06-signal-flow-graphs.html` (terms, Mason's gain formula, block diagram to SFG conversion, worked example and 4 problems).

All diagrams are SVG files in `assets/img/diagrams/` whose names start with `cs-` (Lesson 1), `bd-` (Lesson 5) or `sfg-` (Lesson 6). To add a problem with a figure, copy one `<li>...</li>` from the Exercises list. The figure goes inside the question like this:
`<figure class="diagram"><img src="../../assets/img/diagrams/bd-ex1.svg" alt="describe the figure"></figure>`
and the worked answer goes inside `<div class="sol">...</div>`.

## 14. Module 2 and 3 lecture content (Control System Engineering, Lessons 7 to 12)

The Module 2 PDF (time response, steady-state error, PID), the PID slide deck, the Routh-Hurwitz solved problems and the root locus rules are written out as web pages in:

- `07-first-order-response.html` (transient vs steady state, poles and zeros, order vs type, test signals, first-order system),
- `08-second-order-response.html` (standard form, the four damping cases, time specifications, worked example, case study, exercise problems 1 to 3 and the homework),
- `09-steady-state-errors.html` (final value theorem, system type, error constants, error matrix, non-unity feedback, the four exercise problems),
- `10-p-pi-pid-controllers.html` (control loop, ON/OFF, P, I, D, PID forms, op-amp PI circuit, pneumatic controller, Ziegler–Nichols and Cohen–Coon tuning with a worked example),
- `11-routh-stability.html` (stability definitions, Routh array, the three solved practice problems),
- `12-root-locus.html` (rules table, complementary root locus, two worked examples).

All diagrams are SVG files in `assets/img/diagrams/` whose names start with `tr-` (time response), `sse-` (steady-state error), `pid-`, `rh-` (Routh-Hurwitz) or `rl-` (root locus). The plots were computed from the real transfer functions, so they match the numbers in the notes.

The row of small pictures at the top of each lesson is a "figure strip": each picture jumps to that figure. To add one, copy an `<a href="#...">...</a>` inside `<nav class="figstrip">` and point it at the `id` of a figure. The course home page has the same kind of strip in its "Figures and worked problems" section.

Boxes in the notes: `<p class="key">` shows "Key insight", `<p class="warn">` shows "Watch out" and `<p class="tip">` shows "Try this".

Three textbook exercises in the source slides have an unstable closed loop (Lesson 9: problem 1(c), problem 2 and problem 4). The pages give the formula answer and then explain why it does not hold.

## 15. Linear Control Systems (EACT 533) lessons

The FTI course materials (Chapter 1, Mechanical Translational Systems, Time Domain Analysis, Chapters 3a, 3b and 4, and the handwritten OneNote class notebook) are written out as six lesson pages in `courses/linear-control-systems/`:

- `01-transfer-functions.html` (control systems, history, open and closed loop, classification, models, transfer functions, block diagram reduction, Mason's rule),
- `02-mechanical-translational.html` (spring, damper and mass, one- and two-mass systems, car suspension, rotational systems and analogies),
- `03-time-domain-analysis.html` (test signals, first- and second-order responses, the step-by-step derivation from the class notebook, specifications, steady-state error with the class example),
- `04-stability-routh-hurwitz.html` (stability, Routh array, the four special cases, examples 1 to 11, the k1/k2 signal flow graph problem and the class exercise),
- `05-root-locus.html` (angle and magnitude conditions, construction rules, three worked loci, root contours),
- `06-frequency-response.html` (frequency specifications, Bode plots with margins, polar plots, the Nyquist criterion).

The course home page `courses/linear-control-systems.html` lists the lessons and has a "Figures and worked problems" gallery. New diagrams start with `lcs-` in `assets/img/diagrams/`; the pages also reuse some Control System Engineering diagrams. Edit a lesson's notes between the `NOTES START` and `NOTES END` comments.

The phone number and email addresses on the original title slides are not on the site. Where a slide had a slip, the page gives the corrected value and says so in a "Watch out" box (Lesson 2: the damped mass-spring denominator; Lesson 5: the departure angle in the root contour example; Lesson 6: the polar plot gain margin).

## 16. Module 3 Bode deck and the root locus lecture (Control System Engineering, Lessons 12 and 13)

- The **Bode deck** (PUx EEE2510 Module 3 Bode) is now the notes of `courses/control-system-engineering/13-bode-plots.html`: why a sine gives a sine, the y = 2u + ∫u example done both ways, decibels, the three kinds of frequency response, the six specifications, the second-order formulas with a worked example, the factor table, how to draw a Bode plot (four stages, seven steps), the K s² gain-shifting example, and reading the margins. Diagrams start with `bode-` in `assets/img/diagrams/`.
- The **root locus lecture** was compared with Lesson 12; only the new parts were added to `12-root-locus.html`, after worked example 2: choosing K for K/(s(s+3)) three ways, the s = jω crossing method, worked examples 3 (poles 0, −1, −2) and 4 (the circle round a zero), designing K for an overshoot limit, varying a parameter other than K, and the MATLAB commands. New diagrams: `rl-s-s3`, `rl-steps`, `rl-three-poles`, `rl-circle`.
- The deck's pictures were redrawn rather than copied. Where a slide had a slip, Lesson 13 gives the corrected numbers in a "Watch out" box (the Mr, ωr and ωb of the second-order example, and the bandwidth chart). The Bode sketch of (2s + 1)/s is drawn with the correct shape (falling at −20 dB/decade, then flat at 6 dB).

## 17. Textbook practice problems at the end of each lesson (Control System Engineering)

Every lesson in `courses/control-system-engineering/` now ends with a **Practice problems from the textbook** section, placed between the comments `PRACTICE START` and `PRACTICE END`. The problems are the end-of-chapter Problems of N. S. Nise, *Control Systems Engineering*, 7th edition (Wiley, 2015). Each line shows:

- the problem number, for example `Nise 4.24` (Chapter 4, Problem 24),
- the textbook section it practises (`§4.6`),
- a one-line summary of what the problem asks,
- a hint, and for some problems a short answer, behind a "Hint" button.

Students work from the book's own statement and figure. Only short hints and answers written for this course are on the site; the book's full problem text, figures and solutions are not copied (they are copyrighted).

To add a problem, copy one `<li>...</li>` inside `<ol class="exlist practice">` and change the number, section, summary and hint. To give an answer as well, add `<br><b>Answer.</b> ...` after the hint and change the button text from `Hint` to `Hint and answer`.

## 18. Industrial process simulations (Control System Engineering)

The page `courses/control-system-engineering/industrial-simulations.html` has five simulations of typical industrial problems:

1. tank level control (nonlinear draining tank, P or PI with anti-windup),
2. two interacting tanks (the liquid-level system of D'Azzo, Houpis and Sheldon, Section 2.11),
3. temperature of a steam-heated tank with dead time (on/off, P, PI, PID),
4. conveyor drive speed with a 100 V voltage limit (integrator windup and anti-windup),
5. a PID tuning workbench (reaction curve, Ziegler–Nichols, Cohen–Coon and AMIGO rules on three example processes).

Each simulation is one `<section class="lsec labexp indsim">` block with the problem, a diagram (`assets/img/diagrams/ind-*.svg`, plus the existing `tank-level-control.svg` and `pid-reaction-curve.svg`), the model, the simulation, a **Sources** line and open questions. The full reference list is at the bottom of the page. If you add a simulation, always add its sources in the same style.

The maths is in `assets/js/industrial-sims.js`. It uses the same slider engine as the lab experiments page (`assets/js/lab-experiments.js`), so the page must load `industrial-sims.js` first, then Plotly, then `lab-experiments.js`. To change a default value, find the simulation in `industrial-sims.js` (for example `LAB['ind-tank']`) and change `val:` for that slider. Drop-down lists use `type: 'select'` with an `options` list.

The process numbers are example values chosen for teaching and are labelled as such on the page. Lessons 1, 4, 7, 8 and 10 link to the matching simulation, and the course home page lists them under Simulations.

## 19. Course map and outcome (OBE) mapping (Control System Engineering)

The course home page has a **Course map and outcomes** section. It shows:

- a mind map of all 19 lessons grouped by module. Clicking a topic opens its lesson. On a phone the map turns into a branching list.
- buttons CO1 to CO6. Pressing one lights up the topics that build that outcome (solid outline = main outcome, dashed = the topic also supports it) and shows the outcome statement, Bloom level, assessments and programme outcomes.
- a lesson × CO table and the CO × PO/PSO table (H, M, L from Tables 2a and 2b of the course plan).

You can link straight to one outcome: `control-system-engineering.html#co4` opens the page with CO4 lit up.

All of it is drawn by `assets/js/course-map.js` from the data block inside `<div class="cmap">` on the course page. To change the mapping, edit only that data block:

- `"co": ["CO3"]` is the main outcome of a lesson (taken from the lesson plan table of the course plan),
- `"also": ["CO5"]` lists outcomes the lesson also supports (my reading of the lesson content; change freely),
- `"label"` is the short name shown on the map, `"title"` the full name used in the list and tables,
- each outcome has `"text"`, `"bloom"`, `"assess"` and `"map"` (its PO/PSO levels).

Keep the quotes and commas exactly as they are. If the data has a typing error, the page shows a short message in place of the map.

To add a map to another course page, copy the whole `<section id="map">` block, change the data, and add `<script src="../assets/js/course-map.js"></script>` before `</body>`.

## 20. Nonlinear Control (EACT 633) lessons

The EACT 633 chapter decks are written out as lesson pages in `courses/nonlinear-control/`, one or two lessons per chapter:

- `01-introduction.html` and `02-phase-plane-analysis.html` (Chapter 1: why nonlinear control, hard nonlinearities, nonlinear phenomena, phase portraits, isoclines, singular points, limit cycles). Built from "Chapter 1 Phase plane analysis v2" (the v1 file is the same apart from its header) and TVTIx_Chapter1_NLC.
- `03-linearization.html` and `04-describing-function.html` (Chapter 2: tangent-line and Jacobian linearization, the pendulum, a tank, l'Hôpital's rule, linearizing about a trajectory; describing functions of saturation, dead zone, relays, hysteresis and backlash, and limit-cycle prediction). Built from TVTIx_Chapter2_NLC and the "Chapter2 Linearization" lecture (rewritten in our own words).
- `05-lyapunov-stability.html` (Chapter 3: equilibria, stability definitions, the Vinograd–Hahn example, positive definite functions and quadratic forms, Lyapunov theorems, the Lyapunov equation and how not to use it, LaSalle, Barbalat, instability and converse theorems, finding Lyapunov functions). Covers the same ground as the Chapter 3 Lyapunov tutorial, in our own words.
- `06-absolute-stability.html` (Chapter 4: sector nonlinearities, the Lur'e system, quadratic Lyapunov functions and the S-procedure LMI, positive real and SPR functions, the KYP lemma, the circle criterion with Examples 7.13 to 7.15, the Popov criterion, input-to-state stability and input-output stability). Built from the "Chapter 4 Sector Nonlinearity", "Chapter 4 Materials" and "Popov Circle" decks, rewritten in our own words.
- `07-feedback-linearization.html` (Chapter 5: cancelling nonlinearities, change of variables, input-state and input-output linearization, internal dynamics, relative degree and Lie derivatives, the normal form, zero dynamics and minimum phase, tracking, limits of exact cancellation, the two-tank example). Built from the "Chapter 5 tutorials" deck; its Exercises 12.1 to 12.3 are on the page with our own short answers.

The course home page `courses/nonlinear-control.html` lists every lesson by chapter (lessons not written yet show "coming soon"), has a "Figures and worked problems" gallery and the live simulations (phase plane, pendulum, describing function and circle criterion). New diagrams start with `nlc-` in `assets/img/diagrams/`. Edit a lesson's notes between the `NOTES START` and `NOTES END` comments.

**Phase plane explorer.** `assets/js/nonlinear-sims.js` draws an interactive phase plane. Put this line in any page (and load the script before `</body>`):

    <div class="sim nls" data-nls="phase-plane" data-preset="vdp"></div>

`data-preset` picks the starting system: `ex7` to `ex13` (the linear portraits of Lesson 2), `star`, `linear`, `pendulum`, `vdp` (Van der Pol), `duffing`, `quad`, `relay`.

**Describing function explorer.** In the same script:

    <div class="sim nls" data-nls="describing-function" data-preset="relay"></div>

It shows the output wave and fundamental for a chosen nonlinearity and amplitude, and the polar plot of K/(s(s+1)(s+2)) with the critical locus, listing every predicted limit cycle. Presets: `saturation`, `deadzone`, `relay`, `relaydz`, `hyst`, `dzhyst`, `backlash`, `cubic`.

**Circle criterion explorer.** In the same script:

    <div class="sim nls" data-nls="circle" data-preset="ex713"></div>

Pick a linear part and move the sector slopes alpha and beta. It draws the Nyquist plot with the disk or line of the circle criterion, picks the right case, counts encirclements and says whether the test passes. Presets: `ex713`, `ex714`, `c45`, `ex715`, `c46a`, `popov` (the plants of Lesson 6 and its practice problems). To add a plant, copy a line in the `CIRC` list in the script and give its numerator and denominator coefficients and its number of unstable poles `m`.

**Practice problems.** Each lesson ends with practice problems from the exercise compendium *Exercises in Nonlinear Control Systems* (Johansson, Bernhardsson and Johansson, Lund University), between the comments `PRACTICE START` and `PRACTICE END`. "Ex 2.5" means Chapter 2, Exercise 5 of the compendium. Only a one-line summary, a hint and a short answer written for this course are on the site; the compendium's statements, figures and solutions are not copied. To add one, copy a `<li>...</li>` line in that list.

The phone numbers, e-mail addresses, institute logos and title-slide contact blocks of the decks are not on the site. Where a slide had a slip, the page gives the corrected statement in a "Watch out" box.

## 21. Digital Control Systems (EACT 534) lessons

The FTI EACT534 slide decks are written out as seven lesson pages in `courses/digital-control-systems/`, in three modules:

| Lesson | Page | From |
|---|---|---|
| 1 | `01-discrete-time-and-z-transform.html`: why digital control, difference equations, z-transform, s-to-z mapping, inverse z-transform | Chapter 1, first half |
| 2 | `02-sampling-and-pulse-transfer.html`: sampling theorem, choosing T, ADC and DAC (ZOH) models, $G_{ZAS}(z)$, digital closed loop | Chapter 1, second half |
| 3 | `03-pulse-transfer-and-discretization.html`: pulse transfer functions of sampled loops, eight loop configurations, impulse/step invariance, forward/backward difference, Tustin | Chapter 2 |
| 4 | `04-stability.html`: BIBO and internal stability, pole-zero cancellation, Routh test with $w = (z-1)/(z+1)$, Jury test | Chapter 3 |
| 5 | `05-state-space-analysis.html`: discrete state model, state space to transfer function, companion and Jordan forms, state transition matrix | Chapter 4 |
| 6 | `06-state-space-preliminaries.html`: continuous state-space review, canonical forms, eigenvalues, similarity transforms, controllability and observability tests | Chapter 5a (preliminaries) |
| 7 | `07-pole-placement-and-observers.html`: discrete controllability and observability, pole placement, Ackermann, prediction and reduced-order observers, integral control, deadbeat control | Chapter 5 and the Chapter 5 tutorial sheet |

The course page `courses/digital-control-systems.html` lists the lessons and has a "Figures and worked problems" gallery between the `LESSONS START` and `LESSONS END` comments. New diagrams start with `dcs-` in `assets/img/diagrams/` (Lesson 6 also reuses `mass-spring-damper.svg` and `rlc-series.svg`). Edit a lesson's notes between the `NOTES START` and `NOTES END` comments, and add exercises by copying a list item in the `exlist` list.

The email address, institute name and logos on the original slides are not on the site. Every worked number on the pages was checked by calculation. Where a slide had a slip, the page gives the corrected value in a "Watch out" box:

- Lesson 1: the exponential sequence $a^k$ and its region of convergence; the sequence 4, 8, 16, 32.
- Lesson 2: the gain at 7ωb; 2π written as "2 × 3141"; T = 1 in the position-control result.
- Lesson 3: cascade figure (b); the closed-loop formula missing $X(z)$; loop configuration 4; backward-difference numerator; forward-difference $G(z)$; trapezoid limits.
- Lesson 4: $G_{ZAS}(z)$ and the sign of $D$ in the internal-stability loop; the w-polynomial of the Routh example; $b_4$ and the $|d_0| > |d_2|$ check in the Jury example.
- Lesson 5: the output row of the first companion form; the state matrix of the second companion form (it is the transpose of the first).
- Lesson 6: state order in the observable form example; the matrix $A$ in the diagonalization example (+4, not −4); $CA = [0\ -8]$ in the observability example.
- Lesson 7: desired poles in the satellite example (0.795 ± j0.256); the lead compensator $-27.5(z - 0.818)/(z - 0.2375)$; swapped terms in the reduced-order observer; the integral-state definition, $e^{-0.25}$ and the gains in the integral-control example; $Fg$ in the deadbeat example.

## 22. Exam formula sheet (Control System Engineering)

The page `courses/control-system-engineering/formula-sheet.html` collects the key formulas of all 19 lessons, in the lessons' own notation. It is linked from the course home page (the **Formula sheet** card and the **Formulas** menu link).

- Each module is one `<section class="fs-sec" data-mod="1">` block (data-mod 1 to 4).
- Each box is one `<div class="fbox">`. Its heading `<h3>` ends with a small link to the lesson it comes from, such as `<a class="src" href="08-second-order-response.html">L8</a>`.
- To add a formula, copy a whole `<div class="fbox"> ... </div>` and change the text. Write equations in LaTeX between `$ ... $` (in a line) or `$$ ... $$` (on its own line), exactly as in the lessons. Add `fwide` to the class (`class="fbox fwide"`) for a box that should span the full width.
- The buttons at the top show all modules, only the midterm modules (1 and 2), or only modules 3 and 4.
- **Print / save as PDF** prints whatever is shown, in two compact columns on A4, with the menu and colours removed. Choose "Save as PDF" in the print window to get a file to share with students.

If you change a formula in a lesson, change it here too.
