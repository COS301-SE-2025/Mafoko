# Marito: A PWA for Multilingual Lexicons, Term Banks, and Glossaries
<p align="center">
    <img src="frontend/public/DFSI_Logo.png" alt="banner"/>
</p>

<div align="center">
<code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/figma.png" alt="Figma"/></code><code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/react.png" alt="Figma"/></code><code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/typescript.png" alt="Figma"/></code><code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/vite.png" alt="Figma"/></code><code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/python.png" alt="Figma"/></code><code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/gcp.png" alt="Figma"/></code>
</div>



## Project Description
**Marito** is a progressive web application (PWA) developed for the COS 301 Capstone project at the University of Pretoria. It serves as a unified platform for accessing, browsing, and contributing to multilingual glossaries, dictionaries, and terminology banks. Designed with an offline-first approach and scalable architecture, Marito aims to support South Africa’s low-resource languages and empower linguistic research, NLP development, and language preservation.

---
## Demo 4 Documentation

*  [Project Board](https://github.com/orgs/COS301-SE-2025/projects/112)
*  [Architecture](https://github.com/COS301-SE-2025/Marito/blob/main/Documentation/demo_4/Architecture)
*  [SRS Document](https://github.com/COS301-SE-2025/Marito/blob/main/Documentation/demo_4/Software_Requirement_Document.pdf)
*  [Architectural requirements](https://github.com/COS301-SE-2025/Marito/blob/main/Documentation/demo_4/Architectural_Specifications_v4.pdf)
*  [User Manual ](https://github.com/COS301-SE-2025/Marito/blob/main/Documentation/demo_4/UserManualv2.pdf)
*  [Technical Installation Manual](https://github.com/COS301-SE-2025/Marito/blob/main/Documentation/demo_4/Technical%20Installation%20Manual.pdf)
*  [Coding Standards Document](https://github.com/COS301-SE-2025/Marito/blob/main/Documentation/demo_4/Coding%20Standards.pdf)
*  [Testing Policy](https://github.com/COS301-SE-2025/Marito/blob/main/Documentation/demo_4/Testing%20Policy.pdf)
*  [Service Contract](https://github.com/COS301-SE-2025/Marito/blob/main/Documentation/demo_4/service_Contract_Marito.pdf)
---

## Git Structure & Branching Strategy

#### **Repository Type**: Monorepo
#### **Structure**:

```
/frontend       → React + TypeScript UI  
/backend        → Python FastAPI backend  
/Documentation  → Design and documentation  
/.github        → GitHub Actions workflows and configuration  
```

#### **GitFlow Branching Model**
  * `main` – Stable, production-ready code
  * `develop` – Active development integration branch
  * `feature/*` – New features and enhancements
  * `release/*` – Pre-release testing and stabilization
  * `hotfix/*` – Critical fixes applied directly to production

This structure ensures clean separation between environments, supports parallel feature development, and maintains a stable deployment process. All code changes are merged into `develop` through pull requests, and releases are carefully tested before merging into `main`.

---

## Velox Team Members

| Name              | Role                        | Student Number | Description                             | LinkedIn                                                                 |
|-------------------|-----------------------------|----------------|--------------------------------------------|--------------------------------------------------------------------------|
| Hayley Dodkins    | DevOps Engineer / UI Engineer | 21528790       |  I’m a developer passionate about systems programming and distributed systems. Some of my most impressive projects include a custom kernel implemented in Rust, a graph database built in C++, and a DAG-based blockchain written in OCaml. I have a strong interest in CRDT-based distributed systems and the unique consistency and synchronization problems they solve. I’m drawn to challenges that let me explore system internals, optimize performance, and solve complex concurrency problems. I’m always looking to expand my knowledge and tackle exciting, technically challenging work.      | [![LinkedIn](https://img.shields.io/badge/LinkedIn-blue?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/hayley-dodkins-867126222/) |
| Zainab Abdulrasaq | Project Manager            | 22566202       | I’m a Computer Science student and developer passionate about data security, database systems, and cybersecurity. My projects include designing a NoSQL database system with a focus on performance and security, developing a certificate management app with robust architecture, and contributing to web applications using the LAMP stack. I thrive on challenges that involve optimizing data structures, securing systems, and solving real-world problems through technology. Eager to leverage my technical skills and analytical mindset to make a meaningful impact in the world of cybersecurity and data innovation.    | [![LinkedIn](https://img.shields.io/badge/LinkedIn-blue?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/zainab-abdulrasaq) |
| Arnaud Strydom    | Integration Engineer           | 23536013       | I am a third-year BSc Computer Science student at the University of Pretoria, majoring in Software Engineering. My passion for software development, web development (net-centric development), cybersecurity, and artificial intelligence drives me to be a dedicated and diligent worker. I am committed to expanding my knowledge and improving my skills every day. Striving for excellence is one of my core values. I aim to master the technical aspects of software engineering while also developing essential soft skills such as problem-solving, critical thinking, and effective communication. A great software engineer must understand and address user needs, work collaboratively with team members, and clearly articulate ideas and solutions. My dedication to continuous learning, desire to excel, and commitment to making a lasting impact set me apart. I am eager to take on new challenges, collaborate with like-minded individuals, and contribute to the ever-evolving field of software development.    | [![LinkedIn](https://img.shields.io/badge/LinkedIn-blue?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/arnaud-zander-strydom-44a95a319/) |
| Palesa Thabane    | Services Engineer / Business Analyst           | 21540838       | I am a data science and cybersecurity enthusiast with hands-on experience in systems programming, particularly in distributed computing (e.g., actor models, inter-server communication), and backend development, including NoSQL database engineering and RESTful API design. My technical projects and coursework reflect a strong foundation in secure software practices, which I aim to apply at the intersection of fintech , data science and cybersecurity.     | [![LinkedIn](https://img.shields.io/badge/LinkedIn-blue?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/palesa-thabane-943604364/) |
| Eugen Vosloo      | Data Engineer               | 20445696        | I'm a BSc Computer Science student with a focus on Data Science and a passion for backend development. My project experience includes designing and implementing multiple RESTful APIs, as well as using image processing in Python for mining applications. I’m always eager to broaden my skillset and am especially driven to grow in areas like backend development and data science.   | [![LinkedIn](https://img.shields.io/badge/LinkedIn-blue?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/eugen-vosloo-aa2522353/) |

---
## Demo Videos

- 🎥 [Demo 1 Video](https://youtu.be/mwc1rmwkWEI)
- 🎥 [Demo 2 Video](https://youtu.be/92OJ90uNvXY)
- 🎥 [Demo 3 Video](https://www.youtube.com/watch?v=LGxcyR1eAgk)
- 🎥 [Demo 4 Video](https://google.com)

---

## Badges

<p align="center">
  <a href="https://choosealicense.com/licenses/mit/">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License"/>
  </a>
  <a href="https://github.com/COS301-SE-2025/Marito/actions">
    <img src="https://github.com/COS301-SE-2025/Marito/actions/workflows/actions.yml/badge.svg?branch=main" alt="Build Status"/>
  </a>
  <a href="https://codecov.io/gh/COS301-SE-2025/Marito">
    <img src="https://img.shields.io/codecov/c/github/COS301-SE-2025/Marito" alt="Code Coverage"/>
  </a>
  <a href="https://github.com/COS301-SE-2025/Marito">
    <img src="https://img.shields.io/badge/requirements-purple" alt="Requirements"/>
  </a>
  <a href="https://github.com/COS301-SE-2025/Marito/issues">
    <img src="https://img.shields.io/github/issues/COS301-SE-2025/Marito" alt="GitHub Issues"/>
  </a>
  <a href="https://uptimerobot.com/">
    <img src="https://img.shields.io/uptimerobot/status/m788123456-123456789abcdef" alt="Uptime Robot"/>
  </a>
</p>








