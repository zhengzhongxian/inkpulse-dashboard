import { authClient } from './auth';
import type { ResultRes } from './orders';

export interface SystemSettingDto {
  id: string;
  settingKey: string;
  settingValue: string;
  description: string;
}

export const getSystemSettings = () => {
  return authClient.get<ResultRes<SystemSettingDto[]>>(`/system-settings`);
};

export const updateSystemSetting = (id: string, settingValue: string) => {
  return authClient.put<ResultRes<any>>(`/system-settings/${id}`, { settingValue });
};
