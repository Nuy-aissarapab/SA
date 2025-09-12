import React from "react";




const StudentGuard = ({ children }: { children: React.ReactNode }) => {
  const role = localStorage.getItem("role")?.toLowerCase(); // แปลงเป็น lowercase

  console.log("StudentGuard role =", role);  // 👈 debug ดูค่า role จริง

  

  return <>{children}</>;
};
export default StudentGuard;



