import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCxcXHrPkRt2N0xjdImX-BzoM-VCODdwqy",
  authDomain: "microclimate-monitoring.firebaseapp.com",
  databaseURL: "https://microclimate-monitoring-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "microclimate-monitoring",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
