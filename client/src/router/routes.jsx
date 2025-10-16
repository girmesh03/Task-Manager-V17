// client/src/router/routes.jsx
import { createBrowserRouter } from "react-router";
import RootLayout from "../layouts/RootLayout.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { LoadingFallback } from "../components/common/MuiLoading.jsx";
import NotFound from "../pages/NotFound.jsx";
import RouteError from "../components/common/RouteError.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    HydrateFallback: LoadingFallback,
    errorElement: <RouteError />,
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
          const m = await import("../pages/Login.jsx");
          return { Component: m.default };
        },
      },
      {
        path: "register",
        lazy: async () => {
          const m = await import("../pages/Register.jsx");
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
      {
        Component: DashboardLayout,
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
            path: "users",
            lazy: async () => {
              const m = await import("../pages/Users.jsx");
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
