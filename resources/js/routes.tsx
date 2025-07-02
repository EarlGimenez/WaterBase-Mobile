import { BrowserRouter, Route, Routes } from "react-router-dom";
import * as VIEWS from "./pages";
import { ROUTE } from "./constants";

export const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* PUBLIC ROUTES */}
                <Route path="/" element={<VIEWS.Home />} />
                <Route path={ROUTE.REGISTER.path} element={<VIEWS.Register />} />
                <Route path={ROUTE.LOGIN.path} element={<VIEWS.Login />} />
                
                {/* PRIVATE ROUTES - All with Navigation */}
                <Route path={ROUTE.MAP.path} element={<VIEWS.MapView />} />
                <Route path={ROUTE.RESEARCH_MAP.path} element={<VIEWS.ResearchMap />} />
                <Route path={ROUTE.REPORT_POLLUTION.path} element={<VIEWS.ReportPollution />} />
                <Route path={ROUTE.COMMUNITY.path} element={<VIEWS.Community />} />
                <Route path={ROUTE.DASHBOARD.path} element={<VIEWS.Dashboard />} />
                <Route path={ROUTE.ORGANIZER_PORTAL.path} element={<VIEWS.OrganizerPortal />} />
                <Route path={ROUTE.VOLUNTEER_PORTAL.path} element={<VIEWS.VolunteerPortal />} />
                <Route path={ROUTE.ADMIN_DASHBOARD.path} element={<VIEWS.AdminDashboard />} />
                <Route path={ROUTE.ADMIN_REPORTS.path} element={<VIEWS.AdminReports />} />
                <Route path={ROUTE.ADMIN_USERS.path} element={<VIEWS.AdminUsers />} />
                <Route path={ROUTE.PROFILE.path} element={<VIEWS.Profile />} />
                
                {/* 404 ROUTE */}
                <Route path="*" element={<VIEWS.NotFound />} />   
            </Routes>
        </BrowserRouter>
    );
};