import axios from "axios";
import { env } from "../config/env";

const BASE = "https://maps.googleapis.com/maps/api";

export const MapsService = {
  async geocode(address: string) {
    const url = `${BASE}/geocode/json?address=${encodeURIComponent(address)}&key=${env.googleMapsApiKey}`;
    const res = await axios.get(url);
    return res.data;
  },

  async distanceMatrix(origins: string[], destinations: string[]) {
    const url = `${BASE}/distancematrix/json?origins=${origins.join("|")}&destinations=${destinations.join("|")}&key=${env.googleMapsApiKey}`;
    const res = await axios.get(url);
    return res.data;
  },

  async routeETA(origin: string, destination: string) {
    const matrix = await this.distanceMatrix([origin], [destination]);
    const element = matrix.rows?.[0]?.elements?.[0];
    return {
      distance: element?.distance?.value || 0,
      duration: element?.duration?.value || 0,
      distanceText: element?.distance?.text || "",
      durationText: element?.duration?.text || ""
    };
  }
};
