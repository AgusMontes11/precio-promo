import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://precio-promo-backend.onrender.com/api",
});

export default axiosClient;
