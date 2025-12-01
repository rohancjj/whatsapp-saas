export default function ProtectedAdmin({ children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token || user.role !== "admin") {
    window.location.href = "/auth";
    return null;
  }

  return children;
}
