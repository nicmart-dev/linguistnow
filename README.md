# Table of content

[Overview](#overview)<br>
[Implementation](#implementation)<br>
[Roadmap](#roadmap)<br>
[Nice-to-haves](#nice-to-haves)<br>
[Install](#install)<br>
[Behind the scene](#behind-the-scene)

# LinguistNow

## Overview

LinguistNow simplifies the hassle of finding available linguists for translation projects.

### Problem

Linguists, often freelancers, work for many translation agencies or language service providers (LSPs). Managing tasks based on their schedule is a nightmare both for them and the project managers assigning them work (ie. the "client").

Why?

- They have enter their availability manually in many apps for some, send it by email to others,
- They have to remember to notify them when going on holiday
- Invariably that availability is bound to be out of date as not relying on a single source of truth like their Google Calendar.
- Some linguists may hoard work, and accept tasks even before checking their calendar, to avoid someone else accepting it, and then have to contact the client, who then have to source someone else, incurring delays.

### User Profile

- Project managers in translation agencies or LSPs, who need to add linguists and then find those available to assign to translation projects
- Linguists, also more commonly referred to as translators, who need to ensure project managers know they are available for work.

### Features

1. **User Authentication:**

   - Secure login and registration for project managers and linguists.
   - Role-based access control.

2. **Linguist Management:**

   - Project managers can find available linguist, using CRUD operations to add, edit, delete, and view their profiles.

3. **Scheduling:**

   - Connect linguists own Google Calendar using n8n integration

## Implementation

[Tech Stack](#implementation)<br>
[GitHub process](#github-process)<br>
[APIs](#apis)<br>
[Sitemap](#sitemap)<br>
[Project Plan](#project-plan)<br>
[Mockups](#mockups)<br>
[Data](#data)<br>
[Endpoints](#endpoints)<br>
[Auth](#auth)

### Tech Stack

- **Front-end:** React.js, React Router (for navigation), Tailwind CSS (for styling), Axios
- **Back-end:** Node.js, Express.js, Knex.js, bcrypt (for password hashing)
- **Database:** MySQL
- **Authentication:** JWT (JSON Web Tokens)
- **Localization:** [react-intl](https://www.npmjs.com/package/react-intl) library for internationalization, using AI translations
- **Calendar Integration:** built-in Google Calendar integration of [n8n](https://www.npmjs.com/package/n8n) workflow automation library
- **Deployment:** Heroku or Vercel (for front-end), DigitalOcean or AWS (for back-end)

### GitHub process

#### Feature branch naming convention

I decided to follow [this](https://dev.to/varbsan/a-simplified-convention-for-naming-branches-and-commits-in-git-il4) naming convention:

`git branch <category/reference/description-in-kebab-case>`

Example: `git branch -b feature/issue-5/setup-n8n`

#### GitHub repository structure

```
your-repo/
│
├── client/
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ └── ...
│ ├── public/
│ └── ...
│
├── server/
│ ├── controllers/
│ ├── models/
│ ├── routes/
│ └── ...
│
├── n8n/
│ ├── workflows/
│ ├── settings/
│ └── ...
│
├── README.md
├── .gitignore
├── package.json
└── ...
```

### APIs

I will be using n8n built-in Google Calendar integration to get linguist up to date availability.

### Sitemap

##### Home

- Landing Page
- Login
- Signup

##### Project Manager Dashboard

- Add/edit/Delete linguist
- Find available linguist

##### Linguist Dashboard

- Profile Settings
- Account Settings
  - Set availability / connect with Google Calendar

##### Settings

- Profile Settings
- Account Settings
- Logout

### Project Plan

#### Condensed Project Plan:

1. **Day 1-3: Setup and Planning**

- Define the minimum viable product (MVP) scope.
- Set up project repository and initialize React and Express apps.
- Configure MySQL database.
- Try to get n8n set up and working

2. **Day 4-5: User Authentication**

   - Implement user authentication (signup, login).
   - Set up role-based access control.

3. **Day 6-8: Scheduling**

   - Set up n8n and configure Google Calendar integration.
   - Develop a simple scheduling UI.

4. **Day 9-10: Linguist Management**

   - Create CRUD operations for managing linguists.
   - Develop linguist management UI (add new, edit, find) with React and Tailwind CSS.

5. **Day 11-12: Testing and Deployment**
   - Conduct testing of all features.
   - Deploy the application to Heroku/Vercel and DigitalOcean/AWS.
   - Prepare project documentation and presentation.

#### Implementation Details:

##### 1. Setup and Planning:

- **Repository Initialization:**

  - Create a new GitHub repository.
  - Set up a basic React app using Create React App.
  - Set up a basic Express server.

- **Database Setup:**
  - Configure MySQL database with tables for users, translators, and projects.

##### 2. User Authentication:

- **Backend:**

  - Implement JWT-based authentication.
  - Create routes for user signup and login.

- **Frontend:**
  - Create signup and login forms.
  - Handle authentication state using React Context or useState.

##### 3. Linguist Management:

- **Backend:**

  - Implement CRUD operations for linguists.
  - Create routes to add, edit, delete, and fetch linguists.

- **Frontend:**
  - Create components for listing, adding, editing, and deleting linguists.
  - Use Tailwind CSS for styling.

##### 4. Scheduling with n8n:

- **Setup n8n:**

  - Deploy n8n on a cloud service or use n8n Cloud.
  - Configure Google Calendar integration in n8n.

- **Create Workflows:**

  - Set up workflows to handle creating, updating, and deleting calendar events based on actions in your application.

- **Frontend:**
  - Create a scheduling interface that interacts with n8n endpoints.
  - Display scheduled events and allow users to create and manage schedules.

##### 5. Testing and Deployment:

- **Testing:**

  - Ensure all features are functional and bug-free.

- **Deployment:**

  - Deploy the frontend to Heroku or Vercel.
  - Deploy the backend to DigitalOcean or AWS.
  - Ensure proper configuration and environment variables for production.

-

### Mockups

TODO: Provide visuals of your app's screens. You can use tools like Figma or pictures of hand-drawn sketches.

### Data

TODO: Describe your data and the relationships between them. You can show this visually using diagrams, or write it out.

### Endpoints

TODO: List endpoints that your server will implement, including HTTP methods, parameters, and example responses.

### Auth

- JWT auth
  - Before adding auth, all API requests will be using a fake user with id 1
  - Added after core features have first been implemented
  - Store JWT in localStorage, remove when a user logs out
  - Add states for logged in showing different UI in places listed in mockups

## Roadmap

I am using GitHub Project to manage the roadmap and Kanban board.
Please see the public roadmap here: https://github.com/users/nicmart-dev/projects/1/views/6

## Nice-to-haves

- Localization: Use `react-intl` to support English and French interfaces, with language toggle functionality.
- Admin page: Add/Edit/Delete project manager users
- Connect to [Calendly](https://calendly.com/) to support a wider range of calendar providers
- Manage projects:
  - directly in the app and create event in linguist calendar
  - Integrate with BMS like [XTRF](https://xtrf.eu/) using `n8n`
- Auto accept/reject translation tasks in [BeLazy](https://belazy.cat/) automated translation project management, based on calendar availability
- Unit and Integration Tests

## Install

To install and run the LinguistNow application, follow these steps:

### Client

1. Navigate to the `client` directory.

2. Install dependencies using npm.

   ```
   npm install
   ```

3. Start the React development server.
   ```
   npm start
   ```

### Server

1. Navigate to the `server` directory.

2. Install dependencies using npm.

   ```
   npm install
   ```

3. Start the Express server.
   ```
   npm start
   ```

### n8n

1. Ensure you have Node.js and npm installed on your system.

2. Install n8n globally.

   ```
   npm install n8n -g
   ```

3. Start n8n.
   ```
   n8n start
   ```

After following these steps, you should have the LinguistNow application up and running, along with the n8n workflow automation tool.

# Behind the scene

## About me

This capstone project is being developed by Nicolas Martinez as part of the 3-month Web Development Diploma Program at BrainStation.
It serves as a demonstration of newly acquired modern development skills, following a 20+ year journey of providing customer solutions.

With extensive experience in the Localization & Translation industry spanning two decades, coupled with 7 years as a Technical Product Manager overseeing workflow management and productivity-oriented products, I aim to approach this project with a product manager's outcome-driven mindset.

## Credits
