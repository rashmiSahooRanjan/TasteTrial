import { createSlice } from "@reduxjs/toolkit";

const getSavedAdminData = () => {
    try {
        const saved = localStorage.getItem("adminData");
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
};

const savedToken = localStorage.getItem("adminToken");
const savedAdminData = getSavedAdminData();

const adminSlice = createSlice({
    name: "admin",
    initialState: {
        adminData: savedAdminData,
        isAuthenticated: Boolean(savedToken && savedAdminData),
        sidebarOpen: true,
    },
    reducers: {
        setAdminData: (state, action) => {
            state.adminData = action.payload;
            state.isAuthenticated = true;
            try {
                localStorage.setItem("adminData", JSON.stringify(action.payload));
                if (action.payload?.token) {
                    localStorage.setItem("adminToken", action.payload.token);
                }
            } catch (e) {
                console.error("Failed to save admin auth to localStorage", e);
            }
        },
        clearAdminData: (state) => {
            state.adminData = null;
            state.isAuthenticated = false;
            try {
                localStorage.removeItem("adminData");
                localStorage.removeItem("adminToken");
            } catch (e) {
                console.error("Failed to clear admin auth from localStorage", e);
            }
        },
        toggleSidebar: (state) => {
            state.sidebarOpen = !state.sidebarOpen;
        }
    }
});

export const { setAdminData, clearAdminData, toggleSidebar } = adminSlice.actions;
export default adminSlice.reducer;

