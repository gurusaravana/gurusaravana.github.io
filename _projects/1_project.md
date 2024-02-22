---
layout: page
title: Robotics Operating System (ROS2) - Control Framework
description: Concept and Research related to Robotics using (ROS2)
img: assets/img/ROS2.png
importance: 1
category: Research
related_publications: true
---

## Table of Contents
1. [Key Features and Improvements over ROS 1](#key-features-and-improvements-over-ros-1)
2. [Use Cases](#use-cases)
3. [Getting Started](#getting-started)

ROS 2 (Robot Operating System 2) is the second generation of the Robot Operating System (ROS), which is an open-source set of software libraries and tools that help you build robot applications. ROS 2 builds upon the successes of ROS 1 and addresses some of its limitations, especially in terms of real-time processing, security, scalability, and system architecture. It is designed to be more flexible and adaptable to the needs of modern robotics projects, including those that require real-time performance or operate in distributed environments.

## Key Features and Improvements over ROS 1:

- **DDS (Data Distribution Service) for Real-Time Communication:** ROS 2 uses DDS as its middleware, which provides a standardized communication mechanism. This allows for improved real-time capabilities, more robust and scalable distributed systems, and better control over message passing and data sharing.

- **Improved Security:** With the introduction of SROS2 (Secure ROS 2), the system includes tools and mechanisms to ensure secure communication between nodes. This includes encryption, authentication, and authorization, addressing the growing need for cybersecurity in robotics.

- **Cross-platform:** While ROS 1 was primarily focused on Unix-based systems (specifically Ubuntu), ROS 2 aims to support a wider range of operating systems, including Windows, Linux, and macOS, making it more accessible to a broader audience.

- **Quality of Service (QoS) Settings:** ROS 2 provides more control over the network behavior of your applications through QoS settings. This allows developers to specify the reliability, durability, and other communication parameters, making it easier to build robust and efficient distributed systems.

- **Modularity and Flexibility:** ROS 2 has been re-architected to be more modular, allowing developers to use only the parts they need for their application. This makes it lighter and more flexible for various use cases, from small embedded devices to large scale robotic systems.

- **Improved Tooling and Client Libraries:** ROS 2 continues to improve upon the development tools and client libraries available in ROS 1, making development easier and more efficient. This includes better support for simulation environments, visualization tools, and debugging.

## Use Cases:

ROS 2 is used in a wide range of robotic applications, including but not limited to:

- Industrial automation and robotics
- Autonomous vehicles and drones
- Service robots for healthcare, hospitality, and education
- Research and development in academic and industrial settings

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/ROS21.png" title="ROS2 (a)" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/ROS22.png" title="ROS2 (b)" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/ROS23.png" title="ROS2 (c)" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

## Getting Started:

To get started with ROS 2, you would typically follow these steps:

1. **Installation:** Download and install ROS 2 from the official [ROS 2 website](https://wiki.ros.org/ROS/Installation), selecting the version and OS that fits your project needs.
2. **Learn the Basics:** Go through the tutorials and documentation available on the ROS 2 website to understand the core concepts, tools, and functionalities.
3. **Build Your Application:** Start building your robot applications using ROS 2 libraries and tools, customizing and extending the system as needed for your specific project requirements.

ROS 2 represents a significant step forward in the development of robotic systems, offering a more robust, secure, and flexible framework for both research and commercial projects in the field of robotics.

