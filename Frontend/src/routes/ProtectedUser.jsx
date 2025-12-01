export default function ProtectedUser({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/auth";
    return null;
  }

  return children;
}
