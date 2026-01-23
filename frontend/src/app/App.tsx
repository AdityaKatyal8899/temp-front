import { useState } from "react";
import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeToggle } from "./components/ThemeToggle";
import { LandingPage } from "./components/LandingPage";
import { GetStarted } from "./components/GetStarted";
import { UploadFiles } from "./components/UploadFiles";
import { AccessFiles } from "./components/AccessFiles";
import { Dashboard } from "./components/Dashboard";

type Page = "landing" | "getStarted" | "uploadFiles" | "accessFiles" | "dashboard";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("landing");

  const renderPage = () => {
    switch (currentPage) {
      case "landing":
        return (
          <LandingPage
            onGetStarted={() => setCurrentPage("getStarted")}
            onManage={() => setCurrentPage("dashboard")}
          />
        );
      case "getStarted":
        return (
          <GetStarted
            onBack={() => setCurrentPage("landing")}
            onUploadFiles={() => setCurrentPage("uploadFiles")}
            onAccessFiles={() => setCurrentPage("accessFiles")}
          />
        );
      case "uploadFiles":
        return (
          <UploadFiles
            onBack={() => setCurrentPage("getStarted")}
            onGoDashboard={() => setCurrentPage("dashboard")}
          />
        );
      case "accessFiles":
        return <AccessFiles onBack={() => setCurrentPage("getStarted")} />;
      case "dashboard":
        return <Dashboard onBack={() => setCurrentPage("landing")} />;
      default:
        return null;
    }
  };

  return (
    <ThemeProvider>
      <div className="size-full">
        <ThemeToggle />
        {renderPage()}
      </div>
    </ThemeProvider>
  );
}
