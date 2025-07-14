# AssuredLife - Life Insurance Management Platform - Server Side

This is the backend server for the Life Insurance Management Platform, a modern, role-based web application built with the MERN stack. It provides a secure and robust REST API to support the client-side application.

## Admin Credentials (for Testing)

For development and testing purposes, you can use the following administrator credentials to access protected admin routes:

-   **Email:** `admin@lifesure.com`
-   **Password:** `adminpassword`

## Live Site URL

The frontend application is deployed and accessible at the following URL:

-   **Live Site:** [https://assured-life.web.app/](https://assured-life.web.app/)

## Key Features (API Endpoints)

-   **Secure Authentication:** JWT-based authentication using Firebase for user sign-up, login, and session management.
-   **Role-Based Access Control:** Middleware to protect routes based on user roles (Admin, Agent, Customer).
-   **User Management:** Endpoints for admins to view all users and manage their roles (promote/demote).
-   **Policy Management:** Full CRUD (Create, Read, Update, Delete) functionality for insurance policies, managed by admins.
-   **Application Workflow:** Customers can apply for policies; admins can view, assign agents to, and approve/reject applications.
-   **Agent Management:** Admins can review applications from users wanting to become agents and manage their status.
-   **Dynamic Content:** API support for dynamic homepage sections, including popular policies, customer reviews, and featured agents.
-   **Blog & FAQs:** Agents can manage blog posts, and admins can manage the FAQ section.
-   **Claim Processing:** Authenticated users can submit insurance claims, which are then managed by admins.
-   **Stripe Payment Integration:** Secure endpoints for processing premium payments via Stripe.
-   **Transaction Tracking:** Admins can view a history of all successful payments made through the platform.
-   **Profile Management:** Users can view and update their profile information (name, photo).
-   **Newsletter Subscription:** Endpoint to collect and store newsletter sign-ups.
