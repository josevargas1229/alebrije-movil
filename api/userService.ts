import axiosClient from "./axiosClient";

export interface UserInfo {
  id: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  email: string;
  telefono: string;
  rol_id: number;
}

export const userService = {
  getUserInfo: async (): Promise<UserInfo> => {
    const res = await axiosClient.get("/users");
    return res.data as UserInfo;
  },
};
