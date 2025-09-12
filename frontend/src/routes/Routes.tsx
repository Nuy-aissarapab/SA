import { lazy } from "react";

import type { RouteObject } from "react-router-dom";

import Loadable from "../components/third-patry/Loadable";

import FullLayout from "../layout/FullLayout";

import AdminGuard from "../components/guards/AdminGuard";

import StudentGuard from "../components/guards/StudentGuard";

const MainPages = Loadable(lazy(() => import("../pages/authentication/Login")));

const Main = Loadable(lazy(() => import("../pages/Main")));

// const Customer = Loadable(lazy(() => import("../pages/customer")));

// const CreateCustomer = Loadable(lazy(() => import("../pages/customer/create")));

// const EditCustomer = Loadable(lazy(() => import("../pages/customer/edit")));

const Contract = Loadable(lazy(() => import("../pages/Contract")));

const Billing = Loadable(lazy(() => import("../pages/Billing")));

const Payment = Loadable(lazy(() => import("../pages/Payment")));

const Student = Loadable(lazy(() => import("../pages/Student")));

const Asset = Loadable(lazy(() => import("../pages/Assets")));
const CreateRoomAssetsForm = Loadable(lazy(() => import("../pages/Assets/CreateAssets")));
const AssetRoom = Loadable(lazy(() => import("../pages/Assets/assetroom")));
const RoomAssetEdit = Loadable(lazy(() => import("../pages/Assets/RoomAssetEdit")));


const RoomPage = Loadable(lazy(() => import("../pages/Room")));
const CreateRoomForm = Loadable(lazy(() => import("../pages/Room/CreateRoom")));
const RoomDetails = Loadable(lazy(() => import("../pages/Room/RoomDetails")));
const Booking = Loadable(lazy(() => import("../pages/Room/Booking")));
const RoomEdit = Loadable(lazy(() => import("../pages/Room/RoomEdit")));

const Maintenance = Loadable(lazy(() => import("../pages/Maintenance")));

const MaintenanceCreate = Loadable(lazy(() => import("../pages/Maintenance/Create")));

const MaintenanceEdit = Loadable(lazy(() => import("../pages/Maintenance/Edit")));

const MaintenanceStatus = Loadable(lazy(() => import("../pages/Maintenance/Status")));

const Review = Loadable(lazy(() => import("../pages/Review")));

const ReviewCreate = Loadable(lazy(() => import("../pages/Review/Create")));

const ReviewEdit = Loadable(lazy(() => import("../pages/Review/Edit")));

const Bank = Loadable(lazy(() => import("../pages/Payment/Bank")));

const QRCode = Loadable(lazy(() => import("../pages/Payment/QRCode")));

const Evidence = Loadable(lazy(() => import("../pages/Payment/Evidence")));

const Managepayment = Loadable(lazy(() => import("../pages/Payment/Managepayment")));

const EvidenceSuccess = Loadable(lazy(() => import("../pages/Payment/Evidence/EvidenceSuccess/EvidenceSuccess")));

const EvidenceFail = Loadable(lazy(() => import("../pages/Payment/Evidence/EvidenceFail/EvidenceFail")));

const Managecontracts = Loadable(lazy(() => import("../pages/Contract/Managecontracts")));

const Extendcontract = Loadable(lazy(() => import("../pages/Contract/Extendcontract")));

const ExtendSuccess = Loadable(lazy(() => import("../pages/Contract/Extendcontract/ExtendSuccess")));

const EvidenceGallery = Loadable(lazy(() => import("../pages/Contract/Extendcontract/EvidenceGallery")));

const Announcement = Loadable(lazy(() => import("../pages/Announcement")));

const MeterList = Loadable(lazy(() => import("../pages/Meter")));

const MeterDetail = Loadable(lazy(() => import("../pages/Meter/MeterDetail")));

const MeterCreate = Loadable(lazy(() => import("../pages/Meter/MeterDetail/Create")));

const MeterEdit = Loadable(lazy(() => import("../pages/Meter/MeterDetail/Edit")));

const BillList = Loadable(lazy(() => import("../pages/Billing")));

const BillHistory = Loadable(lazy(() => import("../pages/Billing/BillHistory")));

const BillingDetail = Loadable(lazy(() => import("../pages/Billing/BillHistory/BillingDetail")));

const BillingCreate = Loadable(lazy(() => import("../pages/Billing/BillHistory/BillingCreate")));

const UpdateInfo = Loadable(
  lazy(() => import("../pages/Student/UpdateInfo/UpdateInfo"))
);

const ViewEditStudent = Loadable(
  lazy(() => import("../pages/Student/ViewEdit/ViewEdit"))
);

const CreateStudentPage = Loadable(
  lazy(() => import("../pages/Student/CreateStudentPage/CreateStudentPage"))
);

const CreateAnnouncementPage = Loadable(
  lazy(() => import("../pages/Announcement/CreateAnnouncementPage/CreateAnnouncementPage"))
);

const EditAnnouncementPage = Loadable(
  lazy(() => import("../pages/Announcement/EditAnnouncementPage/EditAnnouncementPage"))
);

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
          {
            path: "/Student/UpdateInfo/UpdateInfo/:id",

            element: <UpdateInfo />, // ✅ ต้องมี :id
          },
          {
            path: "/Student/ViewEdit/ViewEdit/:id",

            element: <ViewEditStudent />, // ✅ ต้องมี :id
          },
        ],
      },
      {
        path: "/admin/students/create",

        element: <CreateStudentPage />,
      },

      {
        path: "/Assets",  
        children: [
          { path: "", element: <Asset /> },
          { path: "assetroom", element: <AssetRoom /> },
          { path: "room/:roomNumber", element: <Asset /> },
          { path: "create", element: <CreateRoomAssetsForm /> },
          { path: "edit/:id", element: <RoomAssetEdit /> }, // ✅ ต้องมี :id
           // เพิ่มเส้นทางสำหรับ CreateAssets โดยมีพารามิเตอร์ roomNumber
        ],
      },

      {
        path: "/Room",
        children: [
          {
            path: "",
            element: <RoomPage />,
          },
                    {
            path: "createroom",
            element: <CreateRoomForm />,
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
             path:"RoomEdit/:id" ,
             element:<RoomEdit />
          }
        ],
      },

       {
    path: "Meter",
    children: [
      {
        path: "", // -> /Meter
        element: <AdminGuard><MeterList /></AdminGuard>,
      },
      {
        path: "MeterDetail/:id", // -> /Meter/MeterDetail/:id
        element: <AdminGuard><MeterDetail /></AdminGuard>,
      },
      {
        path: "MeterDetail/:id/Create", // -> /Meter/MeterDetail/:id/create
        element: <AdminGuard><MeterCreate /></AdminGuard>,
      },
      {
        path: "MeterDetail/:id/Edit/:meterId", // -> /Meter/MeterDetail/:id/create
        element: <AdminGuard><MeterEdit /></AdminGuard>,
      },
      
        ],
      },

      {
    path: "Billing",
    children: [
      // ✅ Admin เห็นทั้งหมด
      {
        path: "",
        element: <AdminGuard><BillList /></AdminGuard>,
      },
      {
        path: "BillHistory/:room_id/BillingCreate",
        element: <AdminGuard><BillingCreate /></AdminGuard>,
      },
      {
        path: "Payment",
        element: <AdminGuard><Payment /></AdminGuard>,
      },

      // ✅ Student เห็นเฉพาะประวัติ & รายละเอียดบิล
      {
        path: "BillHistory/:room_id",
        element: <StudentGuard><BillHistory /></StudentGuard>,
      },
      {
        path: "BillHistory/:room_id/BillingDetail/:billId",
        element: <StudentGuard><BillingDetail /></StudentGuard>,
      },
    ],
  },

      {
        path: "/Maintenance",
        children: [
          { path: "/Maintenance", element: <Maintenance /> },
          { path: "/Maintenance/Create", element: <MaintenanceCreate /> },
          { path: "/Maintenance/Edit/:id", element: <MaintenanceEdit /> }, // ✅ มี :id
          { path: "/Maintenance/Status/:id", element:<MaintenanceStatus /> }, 
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
        children: [{ path: "/Announcement", element: <Announcement /> }


        ],
      },
      {
        path: "/announcements/create",

        element: <CreateAnnouncementPage  />,
      },
      {
        path: "/announcements/:id/edit",

        element: <EditAnnouncementPage  />,
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
            path: "/Payment/Managepayment",
            element: <Managepayment />,
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
