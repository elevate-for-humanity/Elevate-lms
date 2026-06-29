export interface FranchiseTypes {
  id?: string;
}

export interface CreateOfficeInput {
  office_code: string;
  office_name: string;
  owner_name: string;
  owner_email: string;
  address?: string;
  phone?: string;
  is_active?: boolean;
}

export interface CreatePreparerInput {
  preparer_name: string;
  preparer_email: string;
  office_id?: string;
  is_active?: boolean;
}