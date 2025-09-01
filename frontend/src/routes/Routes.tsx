import { lazy } from "react";

import type { RouteObject } from "react-router-dom";

import Loadable from "../components/third-patry/Loadable";

import FullLayout from "../layout/FullLayout";

const MainPages = Loadable(lazy(() => import("../pages/authentication/Login")));

const Main = Loadable(lazy(() => import("../pages/Main")));

// const Customer = Loadable(lazy(() => import("../pages/customer")));

// const CreateCustomer = Loadable(lazy(() => import("../pages/customer/create")));

// const EditCustomer = Loadable(lazy(() => import("../pages/customer/edit")));

const Contract = Loadable(lazy(() => import("../pages/Contract")));

const Billing = Loadable(lazy(() => import("../pages/Billing")));

const Payment = Loadable(lazy(() => import("../pages/Payment")));

const Student = Loadable(lazy(() => import("../pages/Student")));


const Assets = Loadable(lazy(() => import("../pages/Assets")));

const Room = Loadable(lazy(() => import("../pages/Room")));

const Maintenance = Loadable(lazy(() => import("../pages/Maintenance")));

const MaintenanceCreate = Loadable(
  lazy(() => import("../pages/Maintenance/Create"))
);

const MaintenanceEdit = Loadable(
  lazy(() => import("../pages/Maintenance/Edit"))
);

const Review = Loadable(lazy(() => import("../pages/Review")));

const ReviewCreate = Loadable(lazy(() => import("../pages/Review/Create")));

const ReviewEdit = Loadable(lazy(() => import("../pages/Review/Edit")));

const Bank = Loadable(lazy(() => import("../pages/Payment/Bank")));

const QRCode = Loadable(lazy(() => import("../pages/Payment/QRCode")));

const Evidence = Loadable(lazy(() => import("../pages/Payment/Evidence")));

const EvidenceSuccess = Loadable(lazy(() => import("../pages/Payment/Evidence/EvidenceSuccess/EvidenceSuccess")));

const EvidenceFail = Loadable(lazy(() => import("../pages/Payment/Evidence/EvidenceFail/EvidenceFail")));

const Managecontracts = Loadable(lazy(() => import("../pages/Contract/Managecontracts")));

const Extendcontract = Loadable(lazy(() => import("../pages/Contract/Extendcontract")));

const ExtendSuccess = Loadable(lazy(() => import("../pages/Contract/Extendcontract/ExtendSuccess")));

const EvidenceGallery = Loadable(lazy(() => import("../pages/Contract/Extendcontract/EvidenceGallery")));

const History = Loadable(lazy(() => import("../pages/Contract/History")));

const Announcement = Loadable(lazy(() => import("../pages/Announcement")));



const AdminRoutes = (isLoggedIn: boolean): RouteObject => {
  return {
    path: "/",

    element: isLoggedIn ? <FullLayout /> : <MainPages />,

    children: [
      {
        path: "/MainPages",

        element: <MainPages />,
      },

      {
        path: "/Main",

        element: <Main />,
      },

      // {

      //   path: "/customer",

      //   children: [

      //     {

      //       path: "/customer",

      //       element: <Customer />,

      //     },

      //     {

      //       path: "/customer/create",

      //       element: <CreateCustomer />,

      //     },

      //     {

      //       path: "/customer/edit/:id",

      //       element: <EditCustomer />,

      //     },

      //   ],

      // },

      {

        path: "/Contract",

        children: [

          {
            path: "/Contract",

            element: <Contract />,

          },

          {
            path: "/Contract/Managecontracts",

            element: <Managecontracts />,

          },

          {
            path: "/Contract/Extendcontract",

            element: <Extendcontract />,

          },

          {

            path: "/Contract/History",

            element: <History />,

          },
          {

            path: "/Contract/History",

            element: <ExtendSuccess />,

          },

          {

            path: "/Contract/Extendcontract/ExtendSuccess",

            element: <ExtendSuccess />,

          },
          
          {

            path: "/Contract/Extendcontract/EvidenceGallery",

            element: <EvidenceGallery />,

          },

        ],

      },

      {
        path: "/Billing",

        children: [
          {
            path: "/Billing",

            element: <Billing />,
          },

          {
            path: "/Billing/Payment",

            element: <Payment />,
          },
        ],
      },

      {
        path: "/Student",

        children: [
          {
            path: "/Student",

            element: <Student />,
          },

          
        ],
      },

      {
        path: "/Assets",

        element: <Assets />,
      },

      {
        path: "/Room",

        element: <Room />,
      },

      {
        path: "/Maintenance",

        children: [
          {
            path: "/Maintenance",

            element: <Maintenance />,
          },

          {
            path: "/Maintenance/Create",

            element: <MaintenanceCreate />,
          },

          {
            path: "/Maintenance/Edit",

            element: <MaintenanceEdit />,
          },
        ],
      },

      {
        path: "/Review",
        children: [
          { path: "/Review", element: <Review /> },
          { path: "/Review/Create", element: <ReviewCreate /> },
          { path: "/Review/Edit/:id", element: <ReviewEdit /> }, // ✅ ต้องมี :id
        ],
      },
      {
        path: "/Announcement",
        children: [{ path: "/Announcement", element: <Announcement /> }],
      },

      {
        path: "/Payment",
        children: [
          {
            path: "/Payment",
            element: <Payment />,
          },
          {
            path: "/Payment/Bank",
            element: <Bank />,
          },
          {
            path: "/Payment/QRCode",
            element: <QRCode />,
          },
          {
            path: "/Payment/Evidence",
            element: <Evidence />,
          },
          {
            path: "/Payment/Evidence/EvidenceSuccess",
            element: <EvidenceSuccess />,
          },
          {
            path: "/Payment/Evidence/EvidenceFail",
            element: <EvidenceFail />,
          },

        ],
      },
    ],
  };
};

export default AdminRoutes;
