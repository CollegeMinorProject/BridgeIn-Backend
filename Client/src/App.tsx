import "./App.css";
import LoginForm from "./pages/Login/LoginPages";
import Home from "./pages/Profile1/Profile";
import Notification from "./pages/Notification/Notification";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Comments from "./pages/Comments/Comments";
import MainLayout from "./pages/MainLayout";
import { Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import ProfilePage from "./pages/Home/HomePage";
import Chat from "./pages/Chat/Chat";
import Conversation from "./pages/Conversation/Conversation";
import Post from "./pages/Post/Post";
import Like from "./pages/Like/Like";
import JobPost from "./pages/JobPost/JobPost";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginForm />} />

        {/* Sidebar on every page inside this group */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/comments/:id" element={<Comments />} />
          <Route path="/notification" element={<Notification />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/Chats" element={<Chat />} />
          <Route path="/Conversation/:id" element={<Conversation />} />
          <Route path="/Post/:id" element={<Post />} />
          <Route path="/JobPost/:id" element={<JobPost />} />
          <Route path="/Likes/:id" element={<Like />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}
export default App;
