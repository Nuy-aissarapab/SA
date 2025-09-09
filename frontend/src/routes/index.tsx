import { useRoutes, type RouteObject } from "react-router-dom";

import AdminRoutes from "./AdminRoutes";
import MainRoutes from "./MainRoutes";


function ConfigRoutes() {

  // const isLoggedIn = localStorage.getItem("isLogin") === "true";
  const isLoggedIn = true;

  let routes: RouteObject[] = [];


if (isLoggedIn) {
  routes = [AdminRoutes(true)];
} else {
  routes = [MainRoutes()];
}
  return useRoutes(routes);

}


export default ConfigRoutes;