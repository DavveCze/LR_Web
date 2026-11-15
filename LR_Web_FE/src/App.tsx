import type { FC } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { AppConvexProvider } from "./convex";

export const App: FC = () => (
  <AppConvexProvider>
    <RouterProvider router={router} />
  </AppConvexProvider>
);