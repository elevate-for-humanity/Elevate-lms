export interface FranchiseTypes {
  id?: string;
}

export interface CreateOfficeInput {
  office_code?: string;
  office_name?: string;
  owner_name?: string;
  owner_email?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  name?: string;
  address?: string;
  owner_id?: string;
}

export interface CreatePreparerInput {
  name: string;
  email: string;
  efin: string;
  office_id: string;
}