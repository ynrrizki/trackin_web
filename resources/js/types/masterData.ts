export interface MasterDataItem {
    id: number;
    name: string;
    description?: string;
    order?: number;
}

export interface EmployeeMasterData {
    positions: MasterDataItem[];
    position_levels: MasterDataItem[];
    departments: MasterDataItem[];
    employment_statuses: MasterDataItem[];
    employee_types: MasterDataItem[];
    outsourcing_fields: MasterDataItem[];
}

export interface MasterDataResponse {
    success: boolean;
    data: EmployeeMasterData;
    message?: string;
    error?: string;
}

export interface SingleMasterDataResponse {
    success: boolean;
    data: MasterDataItem[];
    message?: string;
    error?: string;
}
