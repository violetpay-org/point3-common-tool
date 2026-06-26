export enum ManagerRoleType {
    ADMIN = 'admin-manager',
    MANAGEMENT = 'management-manager',
    CHECKOUT = 'checkout-manager',
    DEVELOPER = 'developer-manager',
    DEFAULT = 'default-manager',

    // Point3 매니저 역할 (임시)
    POINT3_ADMIN = 'p3-CISO-0',
    POINT3_DEVELOPER = 'p3-DEV-0',
    POINT3_INFRA = 'p3-INFRA-0',
    POINT3_SECURITY = 'p3-SECURITY-0',
    POINT3_OPERATOR = 'p3-OPS-0',

    // KC-era merchant roles (merchant-api client roles)
    MERCHANT_ADMIN = 'merchant:admin',
    MERCHANT_ACCOUNT_MANAGER = 'merchant:account-manager',
    MERCHANT_CONTRACT_MANAGER = 'merchant:contract-manager',
    MERCHANT_DEVELOPER = 'merchant:developer',
    MERCHANT_FIN_OPERATOR = 'merchant:fin-operator',
    MERCHANT_BASE_MEMBER = 'merchant:base-member',

    // KC-era staff roles (platform-api client roles)
    STAFF_ADMIN = 'staff:admin',
    STAFF_SUPPORT = 'staff:support',
    STAFF_DEVELOPER = 'staff:developer',
    STAFF_COMPLIANCE = 'staff:compliance',
    STAFF_FINANCE = 'staff:finance',
}

export enum Point3ManagerRoleType {
    POINT3_ADMIN = 'p3-CISO-0',
    POINT3_DEVELOPER = 'p3-DEV-0',
    POINT3_INFRA = 'p3-INFRA-0',
    POINT3_SECURITY = 'p3-SECURITY-0',
    POINT3_OPERATOR = 'p3-OPS-0',
}

