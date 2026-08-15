export interface ScheduleEntry {
  slot: string;
  activity: string;
  description: string;
}

export interface ReportData {
  employee_name: string;
  position: string;
  date: string;
  schedule: ScheduleEntry[];
}

export interface GenerateReportRequest {
  tasks: string;
  employee_name: string;
  position: string;
  report_date: string;
  provider: string;
  api_key?: string;
  model_name?: string;
  template?: string;
}

export interface HistoryEntry extends ReportData {
  id: string;
  timestamp: string;
}

export interface Employee {
  name: string;
  position: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface GenerateReportResponse {
  report: ReportData;
  excel: string;
  pdf: string;
}