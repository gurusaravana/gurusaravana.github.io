---
layout: page
permalink: /teaching/
title: Teaching
description: Course Materials for the courses that i taught in UG and PG Level in KARE, UoG and FTI
nav: true
nav_order: 3
display_categories: [UG, PG]
horizontal: false
---
<!---
<<<<<<< HEAD
comments syntax
=======
>>>>>>> e9d3ff5 (xx)
- ### Undergraduate Level Courses Taught at KARE, UOG:
1. **Electrical Measurement and Instrumentation** - Focused on principles and applications of measuring electrical quantities.
2. **Virtual Instrumentation** - Explored software and hardware for creating flexible measurement systems.
3. **System Identification** - Covered methods for building mathematical models from measured data.
4. **Introduction to Robotics** - Aimed at the design, operation, and application of robots.
5. **Industrial Automation** - Focused on automation technologies and systems in industrial processes.
6. **Computer Control of Process** - Explored computer applications in controlling industrial processes.
7. **Instrumentation Engineering - I & II** - A comprehensive course covering fundamentals to advanced topics in instrumentation engineering.
8. **Process Control** - Covered techniques and technologies used in industrial process control.
9. **Microprocessor and Microcontroller** - 
10. **Control systems** - A comprehensive course covering fundamentals to Linear contol topics.
- ### Postgraduate Level Courses Taught at KARE, FTI:
1. **Nonlinear Control** - Advanced study on control systems with nonlinear dynamics.
2. **Adaptive Control** - Covered control systems that adapt to changing environments and parameters.
3. **Advanced Process Control** - Focused on advanced process control techniques and technologies.
4. **Linear Control System** - Detailed study on linear control theory and applications.
5. **Optimal Control System** - Explored optimization methods in control system design.
6. **Intelligent Control** - Studied fuzzy, ANN, ANFIS and artificial intelligence applications in control systems.
7. **Industrial Automation and Robotics** - Aimed at the design, operation, and application of robots in automation.
8. **System Identification and Adaptive Control** - Covered methods for building mathematical models from measured data and ontrol systems that adapt to changing environments and parameters.
--->

<!-- pages/projects.md -->
<div class="projects">
{% if site.enable_project_categories and page.display_categories %}
  <!-- Display categorized projects -->
  {% for category in page.display_categories %}
  <a id="{{ category }}" href=".#{{ category }}">
    <h2 class="category">{{ category }}</h2>
  </a>
  {% assign categorized_projects = site.teaching | where: "category", category %}
  {% assign sorted_projects = categorized_projects | sort: "importance" %}
  <!-- Generate cards for each project -->
  {% if page.horizontal %}
  <div class="container">
    <div class="row row-cols-2">
    {% for project in sorted_projects %}
      {% include projects_horizontal.liquid %}
    {% endfor %}
    </div>
  </div>
  {% else %}
  <div class="grid">
    {% for project in sorted_projects %}
      {% include projects.liquid %}
    {% endfor %}
  </div>
  {% endif %}
  {% endfor %}

{% else %}

<!-- Display projects without categories -->

{% assign sorted_projects = site.teaching | sort: "importance" %}

  <!-- Generate cards for each project -->

{% if page.horizontal %}

  <div class="container">
    <div class="row row-cols-2">
    {% for project in sorted_projects %}
      {% include projects_horizontal.liquid %}
    {% endfor %}
    </div>
  </div>
  {% else %}
  <div class="grid">
    {% for project in sorted_projects %}
      {% include projects.liquid %}
    {% endfor %}
  </div>
  {% endif %}
{% endif %}
</div>


