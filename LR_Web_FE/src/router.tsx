import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { HomePage } from "./pages/HomePage";
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
      /*{ path: "o-nas", element: <AboutPage /> },
      { path: "aktuality", element: <NewsPage /> },
      { path: "kurzy", element: <CoursesPage /> },
      { path: "prihlaska", element: <ApplicationPage /> },
      { path: "klub", element: <ClubPage /> },
      { path: "carmen", element: <CarmenPage /> },
      { path: "kontakt", element: <ContactPage /> },*/
    ],
  },
]);