<div align="center">
  <h1 align="center">Adi Agarwal - Portfolio</h1>
  <p align="center">
    A personal portfolio website showcasing projects, experience, and skills.
    <br />
    <br />
    <a href="https://adiagarwal.com">View Demo</a>
    ·
    <a href="https://github.com/adiind/Porfolio/issues">Report Bug</a>
    ·
    <a href="https://github.com/adiind/Porfolio/issues">Request Feature</a>
  </p>
</div>

## About The Project

This is a comprehensive portfolio website designed to showcase my professional experience, projects, and technical skills. It features a modern, responsive design with smooth animations and a dynamic timeline.

### Built With

*   ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
*   ![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
*   ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
*   ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
*   ![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (Latest LTS version recommended)
*   npm

### Installation

1.  Clone the repo
    ```sh
    git clone https://github.com/adiind/Porfolio.git
    ```
2.  Install NPM packages
    ```sh
    npm install
    ```
3.  Set up environment variables
    *   Create a `.env` file based on `.env.example` (if available) or ensure required keys are present.

### Running Locally

Start the development server:

```sh
npm run dev
```

This will also pull the latest Notion data before starting the server.

## Scripts & Notion Workflow

This project uses a custom script to sync tasks and content from Notion.

### Notion Sync Commands

*   `npm run sync:pull`: Pull fresh tasks/data from Notion.
*   `npm run sync:push`: Push local task changes to Notion.
*   `npm run sync:list`: List cached tasks (faster, no API call).
*   `npm run sync:status`: Check for pending local changes.
*   `npm run sprint:issues`: Query Notion for sprint issues.

### Daily Workflow

1.  **Start of session**: `npm run sync:pull`
2.  **View tasks**: `npm run sync:list`
3.  **Work on tasks**: Update status via scripts (see `node scripts/notion-sync.cjs --help` for more details).
4.  **End of session**: `npm run sync:push`

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Adi Agarwal - [LinkedIn](https://linkedin.com/in/adiagarwal) - [Website](https://adiagarwal.com)
