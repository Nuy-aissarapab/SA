// src/components/Guards/AdminGuard.tsx
import React from "react";
import { Navigate } from "react-router-dom";

interface AdminGuardProps {
  children: React.ReactNode; // รองรับ JSX element หรือหลาย element
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const role = localStorage.getItem("role");

  if (role !== "admin") {
    // ถ้าไม่ใช่ admin ส่งไปหน้า home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>; // แสดง element ที่ถูกส่งมา
};

export default AdminGuard;
