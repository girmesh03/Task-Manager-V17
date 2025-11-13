// client/src/router/routes.jsx
import { createBrowserRouter } from "react-router";
import RootLayout from "../layouts/RootLayout.jsx";
import PublicLayout from "../layouts/PublicLayout.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { ProtectedRoute, PublicRoute } from "../components/auth/index.js";
import { LoadingFallback } from "../components/common/MuiLoading.jsx";
import NotFound from "../pages/NotFound.jsx";
import ErrorBoundary from "../components/common/ErrorBoundary.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    HydrateFallback: LoadingFallback,
    ErrorBoundary: ErrorBoundary,
    children: [
      // Public routes with PublicLayout
      {
        Component: () => (
          <PublicRoute>
            <PublicLayout />
          </PublicRoute>
        ),
        children: [
          {
            index: true,
            lazy: async () => {
              const m = await import("../pages/Home.jsx");
              return { Component: m.default };
            },
          },
          {
            path: "login",
            lazy: async () => {
              const m = await import("../components/forms/auth/LoginForm.jsx");
              return { Component: m.default };
            },
          },
          {
            path: "register",
            lazy: async () => {
              const m = await import(
                "../components/forms/auth/RegisterForm.jsx"
              );
              return { Component: m.default };
            },
          },
          {
            path: "forgot-password",
            lazy: async () => {
              const m = await import("../pages/ForgotPassword.jsx");
              return { Component: m.default };
            },
          },
          {
            path: "reset-password",
            lazy: async () => {
              const m = await import("../pages/ForgotPassword.jsx");
              return { Component: m.default };
            },
          },
        ],
      },
      // Protected routes with DashboardLayout
      {
        Component: () => (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            path: "dashboard",
            lazy: async () => {
              const m = await import("../pages/Dashboard.jsx");
              return { Component: m.default };
            },
          },
          {
            path: "tasks",
            lazy: async () => {
              const m = await import("../pages/Tasks.jsx");
              return { Component: m.default };
            },
          },
          {
            path: "tasks/:taskId",
            lazy: async () => {
              const m = await import("../pages/TaskDetails.jsx");
              return { Component: m.default };
            },
          },
          {
            path: "users",
            lazy: async () => {
              const m = await import("../pages/Users.jsx");
              return { Component: m.default };
            },
          },
          // Resources Section (HODs)
          {
            path: "materials",
            lazy: async () => {
              const m = await import("../pages/Materials.jsx");
              return { Component: m.default };
            },
          },
          {
            path: "vendors",
            lazy: async () => {
              const m = await import("../pages/Vendors.jsx");
              return { Component: m.default };
            },
          },
          // Administration Section (SuperAdmins)
          {
            path: "admin/organization",
            lazy: async () => {
              const m = await import("../pages/Organization.jsx");
              return { Component: m.default };
            },
          },
          {
            path: "admin/departments",
            lazy: async () => {
              const m = await import("../pages/Departments.jsx");
              return { Component: m.default };
            },
          },
          {
            path: "admin/users",
            lazy: async () => {
              const m = await import("../pages/Users.jsx");
              return { Component: m.default };
            },
          },
          // Platform Section (Platform SuperAdmins)
          {
            path: "platform/organizations",
            lazy: async () => {
              const m = await import("../pages/Organizations.jsx");
              return { Component: m.default };
            },
          },
        ],
      },
    ],
  },
  {
    path: "*",
    Component: NotFound,
  },
]);

export default router;
