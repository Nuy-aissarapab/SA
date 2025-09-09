import { lazy } from "react";

import React from "react";

import type { RouteObject } from "react-router-dom";

import MinimalLayout from "../layout/MinimalLayout";

import Loadable from "../components/third-patry/Loadable";


const MainPages = Loadable(lazy(() => import("../pages/authentication/Login")));

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

        element: <MainPages />,

      },

      {

        path: "/signup",

        element: <Registerages />,

      },

      {

        path: "*",

        element: <MainPages />,

      },

    ],

  };

};


export default MainRoutes;