import { useRoutes } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import AdminRoutes from "./Routes";
import MainRoutes from "./MainRoutes"; // Corrected import path for MainRoutes

function ConfigRoutes() {
  const isLoggedIn = localStorage.getItem("isLogin") === "true";
  let routes: RouteObject[] = [];

  if (isLoggedIn) {
    routes = [AdminRoutes(isLoggedIn), MainRoutes()];
  } else {
    routes = [MainRoutes()]; // Pass isLoggedIn as a parameter to MainRoutes
  }

  return useRoutes(routes);
}

export default ConfigRoutes;
