import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://backend-nuevo.montesagus2001.workers.dev",
});

export default axiosClient;
