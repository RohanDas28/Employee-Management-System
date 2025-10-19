# Employee Management System

An Employee Management System (EMS) built with Next.js, TypeScript, and MongoDB. This application provides a comprehensive suite of tools for managing employees, departments, attendance, leaves, and internal messaging.

## Features

*   **Authentication:** Secure user authentication with Next-Auth.
*   **Dashboard:** An overview of key statistics and information.
*   **Employee Management:**
    *   Add, edit, and view employee profiles.
    *   Assign employees to departments.
*   **Department Management:**
    *   Create and manage departments.
*   **Attendance Tracking:**
    *   Mark and view employee attendance.
    *   View attendance statistics.
*   **Leave Management:**
    *   Request and approve/reject leave applications.
    *   View leave statistics.
*   **Internal Messaging:**
    *   Send and receive messages between employees.
*   **Audit Logs:**
    *   Track important actions performed within the system.
*   **User Roles:**
    *   Admin role with full access to all features.
    *   Employee role with access to personal information, attendance, leaves, and messaging.

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
*   **Authentication:** [Next-Auth](https://next-auth.js.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
*   **State Management:** [SWR](https://swr.vercel.app/)
*   **Form Management:** [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/en/) (v18 or later)
*   [pnpm](https://pnpm.io/)
*   [MongoDB](https://www.mongodb.com/try/download/community)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/RohanDas28/Employee-Management-System.git
    cd ems
    ```

2.  Install dependencies:
    ```bash
    pnpm install
    ```

3.  Set up environment variables:
    Create a `.env.local` file in the root of the project and add the following variables:

    ```env
    MONGODB_URI=your_mongodb_connection_string
    NEXTAUTH_SECRET=your_nextauth_secret
    NEXTAUTH_URL=http://localhost:3000
    ```

4.  Run the development server:
    ```bash
    pnpm dev
    ```

    The application will be available at `http://localhost:3000`.

## Environment Variables

*   `MONGODB_URI`: The connection string for your MongoDB database.
*   `NEXTAUTH_SECRET`: A secret key for Next-Auth to sign and encrypt tokens. You can generate one using `openssl rand -base64 32`.
*   `NEXTAUTH_URL`: The base URL of your application.

## Scripts

*   `pnpm dev`: Starts the development server.
*   `pnpm build`: Builds the application for production.
*   `pnpm start`: Starts the production server.
*   `pnpm lint`: Lints the codebase.
*   `pnpm seed:superadmin`: Seeds the database with a superadmin user.
