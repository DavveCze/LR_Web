import { createBrowserRouter } from "react-router-dom";
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
import { AboutPage } from "./pages/AboutPage";
import { NewsPage } from "./pages/NewsPage";
import { CoursesPage } from "./pages/CoursesPage";
import { CarmenPage } from "./pages/CarmenPage";
import { ContactPage } from "./pages/ContactPage";
import { GalleryPage } from "./pages/GalleryPage";
import { CalendarPage } from "./pages/CalendarPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "o-nas", element: <AboutPage /> },
      { path: "aktuality", element: <NewsPage /> },
      { path: "prihlaska", element: <RegistrationPage /> },

      // Nabídka kurzů a aliasy
      { path: "nabidka-kurzu", element: <CoursesPage /> },
      { path: "nabidka-kurzu/:categorySlug", element: <CoursesPage /> },
      { path: "kurzy", element: <CoursesPage /> },
      { path: "kurzy/:categorySlug", element: <CoursesPage /> },

      // Klub LR Dance a aliasy
      { path: "klub", element: <ClubPage /> },
      { path: "klub/treneri", element: <ClubTrainersPage /> },
      { path: "klub/pary", element: <ClubPairsPage /> },
      { path: "klub/nase-pary", element: <ClubPairsPage /> },
      { path: "klub/rozvrh", element: <TrainingPage /> },
      { path: "rozvrh", element: <TrainingPage /> },
      { path: "klub/fotogalerie", element: <GalleryPage /> },
      { path: "klub/vysledky-soutezi", element: <ClubResultsPage /> },
      { path: "vysledky-soutezi", element: <ClubResultsPage /> },

      // Carmen a tábory
      { path: "carmen", element: <CarmenPage /> },
      { path: "carmen/fotogalerie", element: <CarmenPage /> },
      { path: "carmen/:subSection", element: <CarmenPage /> },
      { path: "tabory", element: <CarmenPage /> },

      // Kalendář akcí a aliasy
      { path: "kalendar-akci", element: <CalendarPage /> },
      { path: "kalendar", element: <CalendarPage /> },

      // Kontakt
      { path: "kontakt", element: <ContactPage /> },

      // Právní informace & GDPR
      { path: "zasady-ochrany-osobnich-udaju", element: <PrivacyPolicyPage /> },
      { path: "gdpr", element: <PrivacyPolicyPage /> },

      // Login
      { path: "login", element: <LoginPage /> },

      // Jakákoliv nenalezená cesta
      { path: "*", element: <ConstructionPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "admin/dashboard", element: <DashboardPage /> },
      { path: "*", element: <ConstructionPage /> },
    ],
  },
]);