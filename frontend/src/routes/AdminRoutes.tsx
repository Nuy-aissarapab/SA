import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import Loadable from "../components/third-patry/Loadable";
import FullLayout from "../layout/FullLayout";
import Asset from "../pages/Assets";

const MainPages = Loadable(lazy(() => import("../pages/authentication/Login")));
const Dashboard = Loadable(lazy(() => import("../pages/dashboard")));
const Customer = Loadable(lazy(() => import("../pages/customer")));
const CreateCustomer = Loadable(lazy(() => import("../pages/customer/create")));
const EditCustomer = Loadable(lazy(() => import("../pages/customer/edit")));
const Contract = Loadable(lazy(() => import("../pages/Contract")));
const Billing = Loadable(lazy(() => import("../pages/Billing")));
const Payment = Loadable(lazy(() => import("../pages/Payment")));
const Student = Loadable(lazy(() => import("../pages/Student")));
const Assets = Loadable(lazy(() => import("../pages/Assets")));
const CreateAssets = Loadable(lazy(() => import("../pages/Assets/CreateAssets")));
const AssetRoom = Loadable(lazy(() => import("../pages/Assets/assetroom")));
const RoomAssetEdit = Loadable(lazy(() => import("../pages/Assets/RoomAssetEdit")));
const Room = Loadable(lazy(() => import("../pages/Room")));
const CreateRoom = Loadable(lazy(() => import("../pages/Room/createroom")));
const RoomDetails = Loadable(lazy(() => import("../pages/Room/RoomDetails")));
const Booking = Loadable(lazy(() => import("../pages/Room/Booking")));
const RoomEdit = Loadable(lazy(() => import("../pages/Room/RoomEdit")));
const Maintenance = Loadable(lazy(() => import("../pages/Maintenance")));
const Review = Loadable(lazy(() => import("../pages/Review")));

const AdminRoutes = (isLoggedIn: boolean): RouteObject => {
  return {
    path: "/",
    element: isLoggedIn ? <FullLayout /> : <MainPages />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },

      {
        path: "customer",
        children: [
          {
            index: true,
            element: <Customer />,
          },
          {
            path: "create",
            element: <CreateCustomer />,
          },
          {
            path: "edit/:id",
            element: <EditCustomer />,
          },
        ],
      },

      {
        path: "Contract",
        element: <Contract />,
      },

      {
        path: "Billing",
        children: [
          {
            index: true,
            element: <Billing />,
          },
          {
            path: "Payment",
            element: <Payment />,
          },
        ],
      },

      {
        path: "Student",
        element: <Student />,
      },

      {
        path: "Assets",
        children: [
          {
            index: true,
            element: <Assets />,
          },
          {
            path: "CreateAssets",
            element: <CreateAssets />,
          },
          {
            path: "room/:roomNumber",   // ✅ แก้เป็น room/:roomNumber
            element: <Asset />,    // ✅ ใช้คอมโพเนนต์ RoomDetail (หรือ Asset ที่คุณตั้งชื่อ)
          },
          {
            path: "assetroom",
            element: <AssetRoom />,
          },
          {
            path: "edit/:id",
            element: <RoomAssetEdit />
          },
        ],
      },

      {
        path: "Room",
        children: [
          {
            index: true,
            element: <Room />,
          },
          {
            path: "createroom",
            element: <CreateRoom />,
          },
          {
            path: "RoomDetail/:id",
            element: <RoomDetails />,
          },
          {
            path: "booking/:id",
            element: <Booking />,
          },
          {
             path:"/Room/RoomEdit/:id" ,
             element:<RoomEdit />
          }
        ],
      },

      {
        path: "Maintenance",
        element: <Maintenance />,
      },

      {
        path: "Review",
        element: <Review />,
      },
    ],
  };
};

export default AdminRoutes;
