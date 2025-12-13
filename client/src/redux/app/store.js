// client/src/redux/app/store.js
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

// Import API slice and features
import { apiSlice } from "../features/api";
import authReducer from "../features/auth/authSlice";
import taskReducer from "../features/task/taskSlice";
import userReducer from "../features/user/userSlice";
import departmentReducer from "../features/department/departmentSlice";
import materialReducer from "../features/material/materialSlice";
import vendorReducer from "../features/vendor/vendorSlice";
import organizationReducer from "../features/organization/organizationSlice";
import notificationReducer from "../features/notification/notificationSlice";

const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: ["user", "isAuthenticated"],
};

const persistedAuth = persistReducer(authPersistConfig, authReducer);

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: persistedAuth,
    task: taskReducer,
    user: userReducer,
    department: departmentReducer,
    material: materialReducer,
    vendor: vendorReducer,
    organization: organizationReducer,
    notification: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }).concat(apiSlice.middleware),
  devTools: import.meta.env.MODE !== "production",
});

export const persistor = persistStore(store);
