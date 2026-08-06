import { createBrowserRouter, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { ConstructionPage } from "./pages/ConstructionPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RegistrationPage } from "./pages/RegistrationPage";
import { ClubTrainersPage } from "./pages/ClubTrainersPage";
import { ClubPage } from "./pages/ClubPage";
import { ClubResultsPage } from "./pages/ClubResultPage";
import { ClubPairsPage } from "./pages/ClubPairsPage";
import { TrainingPage } from "./pages/Schedule";
/*import { AboutPage } from "./pages/AboutPage";
import { NewsPage } from "./pages/NewsPage";
import { CoursesPage } from "./pages/CoursesPage";
import { ApplicationPage } from "./pages/ApplicationPage";
import { ClubPage } from "./pages/ClubPage";
import { CarmenPage } from "./pages/CarmenPage";
import { ContactPage } from "./pages/ContactPage";*/

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "prihlaska", element: <RegistrationPage /> },
      { path: "klub", element: <ClubPage /> },
      { path: "klub/treneri", element: <ClubTrainersPage /> },
      { path: "klub/pary", element: <ClubPairsPage /> },
      { path: "klub/vysledky-soutezi", element: <ClubResultsPage /> },
      { path: "klub/rozvrh", element: <TrainingPage /> },
      // if invalid path, redirect to construction page
      { path: "*", element: <ConstructionPage /> },
      /*{ path: "o-nas", element: <AboutPage /> },
      { path: "aktuality", element: <NewsPage /> },
      { path: "kurzy", element: <CoursesPage /> },
      { path: "prihlaska", element: <ApplicationPage /> },
      { path: "klub", element: <ClubPage /> },
      { path: "carmen", element: <CarmenPage /> },
      { path: "kontakt", element: <ContactPage /> },*/
    ],
  },
  {
        element: <ProtectedRoute />,
        children: [
          { index: true, path: "admin/dashboard", element: <DashboardPage /> },
          // if invalid path, redirect to construction page
          { path: "*", element: <ConstructionPage /> },
        ]
      },
]);