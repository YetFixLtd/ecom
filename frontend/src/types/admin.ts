export interface Administrator {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

export interface AdminLoginResponse {
  message?: string;
  data: {
    administrator: Administrator;
    token: string;
  };
}
