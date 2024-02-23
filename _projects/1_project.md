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
4. [Creating Packages](#creating-packages)

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

## Creating Packages

Creating packages in ROS2 involves a structured process to organize your robotics software's nodes, libraries, and other components. Here's a step-by-step guide to get you started with creating a new package in ROS2:

#### Setup ROS2 Environment
Ensure you have ROS2 installed on your system. Source your ROS2 installation to set up your environment:

```bash
source /opt/ros/<distro>/setup.bash
```
Replace `<distro>` with your ROS2 distribution name (e.g., foxy, galactic).

#### Create a Workspace
ROS2 packages are typically developed in a workspace. Create and navigate to a new workspace directory:

```bash
mkdir -p ~/ros2_ws/src
cd ~/ros2_ws/
```

#### Create a Package
Use the `ros2 pkg create` command to create a new package. Here is the basic syntax:

```bash
ros2 pkg create --build-type ament_cmake <package_name>
```

Replace `<package_name>` with your desired package name. The `--build-type` option specifies the build system; `ament_cmake` for C++ packages or `ament_python` for Python packages.

##### Example:
```bash
ros2 pkg create --build-type ament_cmake my_ros2_package
```

This command creates a new package directory under `~/ros2_ws/src` with some starter files, including a `package.xml` and CMakeLists.txt for C++ packages.

#### Customize Package.xml
Edit the `package.xml` file in your package directory to add package information like version, description, maintainers, and dependencies.

#### Write Package Code
Add your source code to the package. For C++ packages, place your `.cpp` files in the `src` directory and header files in the `include/<package_name>` directory. For Python packages, place your `.py` files directly in the package folder.

#### Build Your Package
Navigate back to your workspace directory and build your package using `colcon`:

```bash
cd ~/ros2_ws
colcon build --packages-select <package_name>
```

Replace `<package_name>` with the name of your package.

#### Source the Setup Script
After building, you need to source the setup script to make the ROS2 environment aware of your new package:

```bash
source install/setup.bash
```

#### Verify Package Creation
Use ROS2 CLI tools to verify that your package has been created successfully:

```bash
ros2 pkg list | grep <package_name>
```

This command should return your package name, indicating it's recognized by the ROS2 environment.

##### Tips for Package Development
- Keep your package's purpose focused; it's better to have multiple small packages than one large package.
- Follow best practices for naming and organizing your package's components.
- Regularly run tests and use continuous integration to maintain package quality.
