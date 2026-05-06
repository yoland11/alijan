import {
  ALBUM_SESSION_TYPES,
  GRADUATION_PACKAGE_TYPES,
  GRADUATION_ROBE_TYPES,
  GRADUATION_SASH_TYPES,
  GRADUATION_WRITING_TYPES,
  KOSHAT_TYPES,
  ORDER_STATUSES,
  RESEARCH_BINDING_TYPES,
  SERVICE_TYPES,
} from "@/lib/constants";

export type ServiceType = (typeof SERVICE_TYPES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type AlbumSessionType = (typeof ALBUM_SESSION_TYPES)[number];
export type KoshatType = (typeof KOSHAT_TYPES)[number];
export type ResearchBindingType = (typeof RESEARCH_BINDING_TYPES)[number];
export type GraduationPackageType = (typeof GRADUATION_PACKAGE_TYPES)[number];
export type GraduationSashType = (typeof GRADUATION_SASH_TYPES)[number];
export type GraduationRobeType = (typeof GRADUATION_ROBE_TYPES)[number];
export type GraduationWritingType = (typeof GRADUATION_WRITING_TYPES)[number];

export interface ResearchFileRecord {
  name: string;
  url: string;
}

export interface ResearchDetails {
  title: string;
  student_names: string;
  supervisor_name: string;
  academic_entity: string;
  delivery_date: string;
  print_enabled: boolean;
  copy_count: number;
  binding_type: ResearchBindingType | "";
}

export interface GraduationMeasurements {
  sash_length: string;
  shoulder: string;
  robe_length: string;
  hand: string;
}

export interface GraduationDetails {
  package_type: GraduationPackageType | "";
  sash_type: GraduationSashType | "";
  robe_type: GraduationRobeType | "";
  writing_type: GraduationWritingType | "";
  measurements: GraduationMeasurements;
  has_cap: boolean;
}

export interface OrderRecord {
  id: string;
  order_code: string;
  name: string;
  phone: string;
  service_type: ServiceType;
  photographer: string;
  session_type: AlbumSessionType | "";
  koshat_type: KoshatType | "";
  research_details: ResearchDetails;
  research_files: ResearchFileRecord[];
  graduation_details: GraduationDetails;
  booking_date: string;
  status: OrderStatus;
  notes: string;
  images: string[];
  total_amount: number;
  received_amount: number;
  remaining_amount: number;
  created_at: string;
  updated_at: string;
}

export interface OrderFormValues {
  name: string;
  phone: string;
  service_type: ServiceType;
  photographer: string;
  session_type: AlbumSessionType | "";
  koshat_type: KoshatType | "";
  research_details: ResearchDetails;
  research_files: ResearchFileRecord[];
  graduation_details: GraduationDetails;
  booking_date: string;
  status: OrderStatus;
  notes: string;
  images: string[];
  total_amount: number;
  received_amount: number;
  remaining_amount: number;
}

export interface AdminTokenPayload {
  role: "admin";
  username: string;
}
