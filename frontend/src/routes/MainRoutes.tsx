import { lazy } from "react";

import React from "react";

import type { RouteObject } from "react-router-dom";

import MinimalLayout from "../layout/MinimalLayout";

import Loadable from "../components/third-patry/Loadable";

const LoginPage = Loadable(lazy(() => import("../pages/authentication/Login")));

const Registerages = Loadable(

  lazy(() => import("../pages/authentication/Register"))

);

const MainRoutes = (): RouteObject => {

  return {

    path: "/",

    element: <MinimalLayout />,

    children: [

      {

        path: "/",

        element: <LoginPage />,

      },

      {

        path: "/signup",

        element: <Registerages />,

      },

      {

        path: "*",

        element: <LoginPage />,

      },
      


    ],

  };

};


export default MainRoutes;