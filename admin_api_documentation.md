# Admin App API Documentation

This documentation includes only implemented Admin-side APIs discovered from `src/routes` and `src/modules` in the backend.

Base URL: `{{base_url}}`

Auth header (for protected endpoints):

`Authorization: Bearer {{admin_token}}`

---

## Environment Variables

- `base_url`
- `admin_token`
- `technician_id`
- `job_id`
- `spare_id`
- `category_id`
- `payout_id`
- `scope_id`
- `custom_spare_id`

---

## 1) Auth

### POST /admin/register
- Method: `POST`
- URL: `{{base_url}}/admin/register`
- Auth required: `No`
- Headers:
  - `Content-Type: application/json`
- Params: `None`
- Query params: `None`
- Request body example:
```json
{
  "name": "Super Admin",
  "email": "admin@ohmie.com",
  "mobile": "9876543210",
  "password": "StrongPass123",
  "role": "ADMIN"
}
```
- Success response example (`201`):
```json
{
  "message": "Admin registered successfully",
  "admin": {
    "id": 1,
    "name": "Super Admin",
    "email": "admin@ohmie.com",
    "mobile": "9876543210",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2026-05-18T10:00:00.000Z",
    "updatedAt": "2026-05-18T10:00:00.000Z"
  }
}
```
- Error response example (`409/400`):
```json
{
  "error": "Email or mobile already exists"
}
```
- Description: Register a new admin user.
- Notes: Role defaults to `ADMIN` when not provided.

### POST /admin/login
- Method: `POST`
- URL: `{{base_url}}/admin/login`
- Auth required: `No`
- Headers:
  - `Content-Type: application/json`
- Params: `None`
- Query params: `None`
- Request body example:
```json
{
  "email": "admin@ohmie.com",
  "password": "StrongPass123"
}
```
- Success response example (`200`):
```json
{
  "token": "jwt_token_here",
  "admin": {
    "id": 1,
    "name": "Super Admin",
    "email": "admin@ohmie.com",
    "mobile": "9876543210",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2026-05-18T10:00:00.000Z",
    "updatedAt": "2026-05-18T10:00:00.000Z"
  }
}
```
- Error response example (`401/400`):
```json
{
  "error": "Invalid credentials"
}
```
- Description: Authenticate admin and return JWT token.
- Notes: Use token in `Authorization` header for protected APIs.

### GET /admin/profile
- Method: `GET`
- URL: `{{base_url}}/admin/profile`
- Auth required: `N/A`
- Headers: `N/A`
- Params: `N/A`
- Query params: `N/A`
- Request body JSON example: `N/A`
- Success response example: `N/A`
- Error response example: `N/A`
- Description: Requested endpoint.
- Notes: **Not implemented in current backend route map.**

### POST /admin/logout
- Method: `POST`
- URL: `{{base_url}}/admin/logout`
- Auth required: `N/A`
- Headers: `N/A`
- Params: `N/A`
- Query params: `N/A`
- Request body JSON example: `N/A`
- Success response example: `N/A`
- Error response example: `N/A`
- Description: Requested endpoint.
- Notes: **Not implemented in current backend route map.**

---

## 2) Dashboard

### GET /admin/dashboard-summary
- Method: `GET`
- URL: `{{base_url}}/admin/dashboard-summary`
- Auth required: `Yes (Admin JWT)`
- Headers:
  - `Authorization: Bearer {{admin_token}}`
- Params: `None`
- Query params: `None`
- Request body JSON example: `None`
- Success response example (`200`):
```json
{
  "totalJobs": 120,
  "todayJobs": 8,
  "activeTechnicians": 15,
  "todayRevenue": 3500.75,
  "weeklyRevenue": [
    { "day": "Mon", "value": 5000 }
  ],
  "totalSpareStockValue": 42000,
  "lowStockCount": 4,
  "todaySpareUsageValue": 1300,
  "companyEarnings": 150000,
  "pendingPayouts": 35000,
  "totalWalletBalance": 70000,
  "pendingScopeCount": 6
}
```
- Error response example (`500`):
```json
{
  "error": "Failed to fetch dashboard summary"
}
```
- Description: Returns admin dashboard KPIs.
- Notes: Protected by `authenticateJWT` and `requireAdmin`.

---

## 3) Category

### GET /admin/categories
- Method: `GET`
- URL: `{{base_url}}/admin/categories`
- Auth required: `Yes (JWT)`
- Headers: `Authorization: Bearer {{admin_token}}`
- Params: `None`
- Query params: `None`
- Request body JSON example: `None`
- Success response example (`200`):
```json
{
  "data": [
    { "id": 1, "name": "AC Service", "isActive": true }
  ],
  "message": "Categories fetched successfully",
  "success": true
}
```
- Error response example (`500`):
```json
{
  "error": "List categories failed",
  "success": false
}
```
- Description: List categories.
- Notes: Route auth uses `authenticateJWT` (no explicit `requireAdmin`).

### POST /admin/categories
- Method: `POST`
- URL: `{{base_url}}/admin/categories`
- Auth required: `Yes (JWT)`
- Headers:
  - `Authorization: Bearer {{admin_token}}`
  - `Content-Type: application/json`
- Params: `None`
- Query params: `None`
- Request body example:
```json
{
  "name": "Electrical"
}
```
- Success response example (`201`):
```json
{
  "message": "Category created",
  "data": {
    "id": 2,
    "name": "Electrical",
    "isActive": true
  },
  "success": true
}
```
- Error response example (`409/400`):
```json
{
  "error": "Category already exists",
  "success": false
}
```
- Description: Create a new category.
- Notes: Name must be unique.

### PUT /admin/categories/:id
- Method: `PUT`
- URL: `{{base_url}}/admin/categories/{{category_id}}`
- Auth required: `Yes (JWT)`
- Headers:
  - `Authorization: Bearer {{admin_token}}`
  - `Content-Type: application/json`
- Params:
  - `id` (path, number)
- Query params: `None`
- Request body example:
```json
{
  "name": "Electrical Services"
}
```
- Success response example (`200`):
```json
{
  "message": "Category updated successfully",
  "data": {
    "id": 2,
    "name": "Electrical Services",
    "isActive": true
  },
  "success": true
}
```
- Error response example (`409/400`):
```json
{
  "error": "Category name already exists",
  "success": false
}
```
- Description: Update category by id.
- Notes: Soft constraints validated in service layer.

### DELETE /admin/categories/:id
- Method: `DELETE`
- URL: `{{base_url}}/admin/categories/{{category_id}}`
- Auth required: `Yes (JWT)`
- Headers: `Authorization: Bearer {{admin_token}}`
- Params:
  - `id` (path, number)
- Query params: `None`
- Request body JSON example: `None`
- Success response example (`200`):
```json
{
  "message": "Category deleted successfully",
  "success": true
}
```
- Error response example (`400`):
```json
{
  "error": "Category delete failed",
  "success": false
}
```
- Description: Soft-delete category (`isActive=false`).
- Notes: Record remains in DB.

### GET /admin/categories/:id
- Method: `GET`
- URL: `{{base_url}}/admin/categories/{{category_id}}`
- Auth required: `Yes (JWT)`
- Headers: `Authorization: Bearer {{admin_token}}`
- Params:
  - `id` (path, number)
- Query params: `None`
- Request body JSON example: `None`
- Success response example (`200`):
```json
{
  "data": {
    "id": 1,
    "name": "AC Service",
    "isActive": true
  },
  "message": "Category fetched successfully",
  "success": true
}
```
- Error response example (`404`):
```json
{
  "error": "Category not found",
  "success": false
}
```
- Description: Get category by id.
- Notes: Implemented but not in your requested list.

---

## 4) Technician

### GET /admin/technicians
- Method: `GET`
- URL: `{{base_url}}/admin/technicians`
- Auth required: `Yes (Admin JWT)`
- Headers: `Authorization: Bearer {{admin_token}}`
- Params: `None`
- Query params: `None`
- Request body JSON example: `None`
- Success response example (`200`):
```json
{
  "technicians": [
    {
      "id": 1,
      "name": "Ravi Kumar",
      "mobile": "9000000001",
      "status": "ACTIVE",
      "isActive": true
    }
  ]
}
```
- Error response example (`500`):
```json
{
  "error": "List technicians failed"
}
```
- Description: List technicians.
- Notes: Admin-only.

### POST /admin/technicians
- Method: `POST`
- URL: `{{base_url}}/admin/technicians`
- Auth required: `Yes (Admin JWT)`
- Headers:
  - `Authorization: Bearer {{admin_token}}`
  - `Content-Type: application/json`
- Params: `None`
- Query params: `None`
- Request body example:
```json
{
  "name": "Ravi Kumar",
  "mobile": "9000000001",
  "email": "ravi@ohmie.com",
  "password": "Tech@123",
  "categoryIds": [1, 2],
  "experience": 4,
  "rating": 4.8
}
```
- Success response example (`201`):
```json
{
  "message": "Technician created",
  "technician": {
    "id": 11,
    "name": "Ravi Kumar",
    "mobile": "9000000001"
  }
}
```
- Error response example (`409/400`):
```json
{
  "error": "Mobile already exists"
}
```
- Description: Create technician with categories.
- Notes: `password` is required in current flow (generated only if missing in service).

### PUT /admin/technicians/:id
- Method: `PUT`
- URL: `{{base_url}}/admin/technicians/{{technician_id}}`
- Auth required: `Yes (Admin JWT)`
- Headers:
  - `Authorization: Bearer {{admin_token}}`
  - `Content-Type: application/json`
- Params:
  - `id` (path, number)
- Query params: `None`
- Request body example:
```json
{
  "name": "Ravi K",
  "mobile": "9000000002",
  "email": "ravi.k@ohmie.com",
  "isActive": true,
  "status": "ACTIVE"
}
```
- Success response example (`200`):
```json
{
  "message": "Technician updated",
  "technician": {
    "id": 11,
    "name": "Ravi K",
    "status": "ACTIVE"
  }
}
```
- Error response example (`400`):
```json
{
  "error": "Invalid status 'UNKNOWN'. Allowed: ACTIVE, INACTIVE, WARNING, BLOCKED, SUSPENDED"
}
```
- Description: Update technician fields.
- Notes: Status enum validated in service.

### PATCH /admin/technicians/:id/block
- Method: `PATCH`
- URL: `{{base_url}}/admin/technicians/{{technician_id}}/block`
- Auth required: `Yes (Admin JWT)`
- Headers: `Authorization: Bearer {{admin_token}}`
- Params:
  - `id` (path, number)
- Query params: `None`
- Request body JSON example: `None`
- Success response example (`200`):
```json
{
  "message": "Technician blocked",
  "technician": {
    "id": 11,
    "status": "BLOCKED"
  }
}
```
- Error response example (`400`):
```json
{
  "error": "Block technician failed"
}
```
- Description: Block technician account.
- Notes: Use this instead of a generic status patch endpoint.

### PATCH /admin/technicians/:id/unblock
- Method: `PATCH`
- URL: `{{base_url}}/admin/technicians/{{technician_id}}/unblock`
- Auth required: `Yes (Admin JWT)`
- Headers: `Authorization: Bearer {{admin_token}}`
- Params:
  - `id` (path, number)
- Query params: `None`
- Request body JSON example: `None`
- Success response example (`200`):
```json
{
  "message": "Technician unblocked",
  "technician": {
    "id": 11,
    "status": "ACTIVE"
  }
}
```
- Error response example (`400`):
```json
{
  "error": "Unblock technician failed"
}
```
- Description: Unblock technician account.
- Notes: Status changes to `ACTIVE`.

### PATCH /admin/technicians/:id/toggle-active
- Method: `PATCH`
- URL: `{{base_url}}/admin/technicians/{{technician_id}}/toggle-active`
- Auth required: `Yes (Admin JWT)`
- Headers: `Authorization: Bearer {{admin_token}}`
- Params:
  - `id` (path, number)
- Query params: `None`
- Request body JSON example: `None`
- Success response example (`200`):
```json
{
  "message": "Technician active status toggled",
  "technician": {
    "id": 11,
    "isActive": false
  }
}
```
- Error response example (`400`):
```json
{
  "error": "Toggle active failed"
}
```
- Description: Toggle active/inactive switch.
- Notes: Replaces requested `/status` patch endpoint.

### DELETE /admin/technicians/:id
- Method: `DELETE`
- URL: `{{base_url}}/admin/technicians/{{technician_id}}`
- Auth required: `Yes (Admin JWT)`
- Headers: `Authorization: Bearer {{admin_token}}`
- Params:
  - `id` (path, number)
- Query params: `None`
- Request body JSON example: `None`
- Success response example (`200`):
```json
{
  "message": "Technician deleted"
}
```
- Error response example (`400`):
```json
{
  "error": "Cannot delete technician. They have existing jobs assigned."
}
```
- Description: Delete technician if no active job references.
- Notes: Hard delete in DB.

---

## 5) Jobs

### GET /admin/job
- Method: `GET`
- URL: `{{base_url}}/admin/job`
- Auth required: `Yes (Admin JWT)`
- Headers: `Authorization: Bearer {{admin_token}}`
- Params: `None`
- Query params:
  - `status`
  - `search`
  - `technicianId`
  - `categoryId`
- Request body JSON example: `None`
- Success response example (`200`):
```json
{
  "jobs": [
    {
      "id": 101,
      "jobCode": "JOB-260518-1234",
      "customerName": "Anil",
      "status": "CREATED"
    }
  ]
}
```
- Error response example (`500`):
```json
{
  "error": "Failed to list jobs"
}
```
- Description: List jobs with optional filters.
- Notes: Soft-deleted jobs are excluded.

### POST /admin/job
- Method: `POST`
- URL: `{{base_url}}/admin/job`
- Auth required: `Yes (Admin JWT)`
- Headers:
  - `Authorization: Bearer {{admin_token}}`
  - `Content-Type: application/json`
- Params: `None`
- Query params: `None`
- Request body example:
```json
{
  "customerName": "Anil",
  "customerPhone": "9000000010",
  "address": "HSR Layout, Bengaluru",
  "description": "AC not cooling",
  "categoryId": 1,
  "technicianId": 11,
  "scheduleTime": "2026-05-20T09:00:00.000Z",
  "totalAmount": 1200,
  "technicianShare": 840,
  "companyShare": 360
}
```
- Success response example (`201`):
```json
{
  "message": "Job created successfully",
  "job": {
    "id": 101,
    "jobCode": "JOB-260518-1234",
    "status": "ASSIGNED"
  }
}
```
- Error response example (`400`):
```json
{
  "error": "Job creation failed"
}
```
- Description: Create job and optionally auto-assign technician.
- Notes: `jobCode` generated in service.

### PUT /admin/job/:id
- Method: `PUT`
- URL: `{{base_url}}/admin/job/{{job_id}}`
- Auth required: `Yes (Admin JWT)`
- Headers:
  - `Authorization: Bearer {{admin_token}}`
  - `Content-Type: application/json`
- Params:
  - `id` (path, number)
- Query params: `None`
- Request body example:
```json
{
  "status": "ASSIGNED",
  "scheduleTime": "2026-05-20T10:00:00.000Z",
  "totalAmount": 1500
}
```
- Success response example (`200`):
```json
{
  "message": "Job updated successfully",
  "job": {
    "id": 101,
    "status": "ASSIGNED"
  }
}
```
- Error response example (`400`):
```json
{
  "error": "Job update failed"
}
```
- Description: Update allowed job fields.
- Notes: Allowed fields are restricted in service.

### PUT /admin/job/:id/assign
- Method: `PUT`
- URL: `{{base_url}}/admin/job/{{job_id}}/assign`
- Auth required: `Yes (Admin JWT)`
- Headers:
  - `Authorization: Bearer {{admin_token}}`
  - `Content-Type: application/json`
- Params:
  - `id` (path, number)
- Query params: `None`
- Request body example:
```json
{
  "technicianId": 11
}
```
- Success response example (`200`):
```json
{
  "message": "Technician assigned successfully",
  "job": {
    "id": 101,
    "technicianId": 11,
    "status": "ASSIGNED"
  }
}
```
- Error response example (`400`):
```json
{
  "error": "Cannot assign technician when job is IN_PROGRESS"
}
```
- Description: Assign or reassign technician to a job.
- Notes: Assignment blocked for in-progress/finalized statuses.

### DELETE /admin/job/:id
- Method: `DELETE`
- URL: `{{base_url}}/admin/job/{{job_id}}`
- Auth required: `Yes (Admin JWT)`
- Headers: `Authorization: Bearer {{admin_token}}`
- Params:
  - `id` (path, number)
- Query params: `None`
- Request body JSON example: `None`
- Success response example (`200`):
```json
{
  "message": "Job deleted (soft) successfully"
}
```
- Error response example (`400`):
```json
{
  "error": "Job delete failed"
}
```
- Description: Soft-delete job.
- Notes: Sets `isDeleted=true`.

### POST /admin/technicians/job/:id/send-otp
- Method: `POST`
- URL: `{{base_url}}/admin/technicians/job/{{job_id}}/send-otp`
- Auth required: `Yes (Admin JWT)`
- Headers: `Authorization: Bearer {{admin_token}}`
- Params:
  - `id` (path, job id)
- Query params: `None`
- Request body JSON example: `None`
- Success response example (`200`):
```json
{
  "message": "OTP sent",
  "jobId": 101,
  "otpCode": "4821",
  "customerPhone": "9000000010",
  "technicianId": 11,
  "jobCode": "JOB-260518-1234"
}
```
- Error response example (`400`):
```json
{
  "error": "Failed to send OTP"
}
```
- Description: Trigger OTP generation for job in `WAITING_OTP` state.
- Notes: Route lives under technician router but is admin-protected.

### GET /admin/job/:id
- Method: `GET`
- URL: `{{base_url}}/admin/job/{{job_id}}`
- Auth required: `N/A`
- Headers: `N/A`
- Params: `N/A`
- Query params: `N/A`
- Request body JSON example: `N/A`
- Success response example: `N/A`
- Error response example: `N/A`
- Description: Requested endpoint.
- Notes: **Not implemented in current backend route map.**

---

## 6) Spare Management

### GET /admin/spares
- Method: `GET`
- URL: `{{base_url}}/admin/spares`
- Auth required: `Yes (Admin JWT)`
- Headers: `Authorization: Bearer {{admin_token}}`
- Params: `None`
- Query params:
  - `page`
  - `limit`
  - `search`
  - `lowStock`
- Request body JSON example: `None`
- Success response example (`200`):
```json
[
  {
    "id": 10,
    "name": "Compressor",
    "sku": "SP-1001",
    "stockQty": 4,
    "minStock": 5
  }
]
```
- Error response example (`400`):
```json
{
  "error": "Failed to fetch spares"
}
```
- Description: List spares with pagination and search.
- Notes: Includes category/brand relations.

### POST /admin/spares
- Method: `POST`
- URL: `{{base_url}}/admin/spares`
- Auth required: `Yes (Admin JWT)`
- Headers:
  - `Authorization: Bearer {{admin_token}}`
  - `Content-Type: application/json`
- Params: `None`
- Query params: `None`
- Request body example:
```json
{
  "name": "Compressor",
  "sku": "SP-1001",
  "categoryId": 1,
  "spareCategoryId": 2,
  "brandId": 1,
  "costPrice": 900,
  "sellingPrice": 1200,
  "stockQty": 12,
  "minStock": 5
}
```
- Success response example (`201`):
```json
{
  "id": 10,
  "name": "Compressor",
  "sku": "SP-1001",
  "stockQty": 12,
  "isActive": true
}
```
- Error response example (`400`):
```json
{
  "error": "Unique constraint failed on the fields: (`sku`)"
}
```
- Description: Create new spare inventory item.
- Notes: Supports either `categoryId` or `category` (name upsert).

### PUT /admin/spares/:id
- Method: `PUT`
- URL: `{{base_url}}/admin/spares/{{spare_id}}`
- Auth required: `Yes (Admin JWT)`
- Headers:
  - `Authorization: Bearer {{admin_token}}`
  - `Content-Type: application/json`
- Params:
  - `id` (path, number)
- Query params: `None`
- Request body example:
```json
{
  "sellingPrice": 1300,
  "stockQty": 20,
  "minStock": 6
}
```
- Success response example (`200`):
```json
{
  "id": 10,
  "name": "Compressor",
  "sellingPrice": 1300,
  "stockQty": 20
}
```
- Error response example (`400`):
```json
{
  "error": "Spare not found"
}
```
- Description: Update spare fields.
- Notes: Partial updates allowed.

### DELETE /admin/spares/:id
- Method: `DELETE`
- URL: `{{base_url}}/admin/spares/{{spare_id}}`
- Auth required: `Yes (Admin JWT)`
- Headers: `Authorization: Bearer {{admin_token}}`
- Params:
  - `id` (path, number)
- Query params: `None`
- Request body JSON example: `None`
- Success response example (`200`):
```json
{
  "message": "Spare deleted (soft)"
}
```
- Error response example (`400`):
```json
{
  "error": "Spare not found"
}
```
- Description: Soft-delete spare.
- Notes: Sets `isActive=false`.

### GET /admin/spares/low-stock
- Method: `GET`
- URL: `{{base_url}}/admin/spares/low-stock`
- Auth required: `Yes (Admin JWT)`
- Headers: `Authorization: Bearer {{admin_token}}`
- Params: `None`
- Query params: `None`
- Request body JSON example: `None`
- Success response example (`200`):
```json
[
  {
    "id": 10,
    "name": "Compressor",
    "stockQty": 4,
    "minStock": 5
  }
]
```
- Error response example (`400`):
```json
{
  "error": "Failed to fetch low stock spares"
}
```
- Description: Returns spares where `stockQty <= minStock`.
- Notes: Admin-only.

---

## 7) Custom Spare Request

### GET /custom-spare/admin/requests
- Method: `GET`
- URL: `{{base_url}}/custom-spare/admin/requests`
- Auth required: `Yes (Admin JWT)`
- Headers: `Authorization: Bearer {{admin_token}}`
- Params: `None`
- Query params:
  - `status` (optional)
- Request body JSON example: `None`
- Success response example (`200`):
```json
{
  "requests": [
    {
      "id": 1,
      "name": "Custom Motor",
      "status": "PENDING",
      "technicianId": 11
    }
  ]
}
```
- Error response example (`400`):
```json
{
  "error": "Failed to fetch requests"
}
```
- Description: List all custom spare requests.
- Notes: Admin endpoint exists under `/custom-spare` root.

### PUT /custom-spare/admin/:id/approve
- Method: `PUT`
- URL: `{{base_url}}/custom-spare/admin/{{custom_spare_id}}/approve`
- Auth required: `Yes (Admin JWT)`
- Headers: `Authorization: Bearer {{admin_token}}`
- Params:
  - `id` (path, number)
- Query params: `None`
- Request body JSON example: `None`
- Success response example (`200`):
```json
{
  "message": "Request approved and spare created",
  "request": {
    "id": 1,
    "status": "APPROVED"
  }
}
```
- Error response example (`400/404`):
```json
{
  "error": "Request is not pending"
}
```
- Description: Approve custom spare request; may auto-create spare.
- Notes: If spare name exists, request still approved with note.

### PUT /custom-spare/admin/:id/reject
- Method: `PUT`
- URL: `{{base_url}}/custom-spare/admin/{{custom_spare_id}}/reject`
- Auth required: `Yes (Admin JWT)`
- Headers:
  - `Authorization: Bearer {{admin_token}}`
  - `Content-Type: application/json`
- Params:
  - `id` (path, number)
- Query params: `None`
- Request body example:
```json
{
  "adminNote": "Not suitable for inventory"
}
```
- Success response example (`200`):
```json
{
  "message": "Request rejected",
  "request": {
    "id": 1,
    "status": "REJECTED",
    "adminNote": "Not suitable for inventory"
  }
}
```
- Error response example (`400/404`):
```json
{
  "error": "Request not found"
}
```
- Description: Reject custom spare request.
- Notes: `adminNote` is optional.

---

## 8) Scope of Work

### GET /scope-of-work/pending
- Method: `GET`
- URL: `{{base_url}}/scope-of-work/pending`
- Auth required: `No (as currently implemented)`
- Headers: `None`
- Params: `None`
- Query params: `None`
- Request body JSON example: `None`
- Success response example (`200`):
```json
[
  {
    "id": 21,
    "name": "Outdoor Unit Deep Clean",
    "jobCategoryId": 1,
    "status": "PENDING"
  }
]
```
- Error response example (`500`):
```json
{
  "error": "Failed to fetch pending scopes"
}
```
- Description: List pending scope requests for admin review.
- Notes: Should ideally be admin-protected; currently public.

### GET /scope-of-work/by-category/:jobCategoryId
- Method: `GET`
- URL: `{{base_url}}/scope-of-work/by-category/{{category_id}}`
- Auth required: `No (as currently implemented)`
- Headers: `None`
- Params:
  - `jobCategoryId` (path, number)
- Query params: `None`
- Request body JSON example: `None`
- Success response example (`200`):
```json
[
  {
    "id": 5,
    "name": "Gas Top-up",
    "jobCategoryId": 1,
    "status": "APPROVED"
  }
]
```
- Error response example (`500`):
```json
{
  "error": "Failed to fetch scopes"
}
```
- Description: Fetch approved scopes by category.
- Notes: Used by job/category context.

### PUT /scope-of-work/:id/approve
- Method: `PUT`
- URL: `{{base_url}}/scope-of-work/{{scope_id}}/approve`
- Auth required: `No (as currently implemented)`
- Headers:
  - `Content-Type: application/json`
- Params:
  - `id` (path, number)
- Query params: `None`
- Request body JSON example: `None`
- Success response example (`200`):
```json
{
  "message": "Scope approved",
  "scope": {
    "id": 21,
    "status": "APPROVED"
  }
}
```
- Error response example (`500`):
```json
{
  "error": "Failed to approve scope"
}
```
- Description: Approve pending scope.
- Notes: Should ideally require admin auth.

### PUT /scope-of-work/:id/reject
- Method: `PUT`
- URL: `{{base_url}}/scope-of-work/{{scope_id}}/reject`
- Auth required: `No (as currently implemented)`
- Headers:
  - `Content-Type: application/json`
- Params:
  - `id` (path, number)
- Query params: `None`
- Request body JSON example: `None`
- Success response example (`200`):
```json
{
  "message": "Scope rejected",
  "scope": {
    "id": 21,
    "status": "REJECTED"
  }
}
```
- Error response example (`500`):
```json
{
  "error": "Failed to reject scope"
}
```
- Description: Reject pending scope.
- Notes: Should ideally require admin auth.

---

## 9) Payment

### GET /admin/payment
- Method: `GET`
- URL: `{{base_url}}/admin/payment`
- Auth required: `Yes (Admin JWT)`
- Headers: `Authorization: Bearer {{admin_token}}`
- Params: `None`
- Query params:
  - `jobId`
  - `status`
- Request body JSON example: `None`
- Success response example (`200`):
```json
{
  "payments": [
    {
      "id": 31,
      "jobId": 101,
      "amount": 1200,
      "method": "UPI",
      "status": "PENDING"
    }
  ]
}
```
- Error response example (`400`):
```json
{
  "error": "Failed to list payments"
}
```
- Description: List payments with optional filters.
- Notes: Includes job + technician + category relation in service.

### POST /admin/payment/create
- Method: `POST`
- URL: `{{base_url}}/admin/payment/create`
- Auth required: `Yes (Admin JWT)`
- Headers:
  - `Authorization: Bearer {{admin_token}}`
  - `Content-Type: application/json`
- Params: `None`
- Query params: `None`
- Request body example:
```json
{
  "jobId": 101,
  "amount": 1200,
  "method": "UPI"
}
```
- Success response example (`201`):
```json
{
  "message": "Payment created",
  "payment": {
    "id": 31,
    "jobId": 101,
    "amount": 1200,
    "method": "UPI",
    "status": "PENDING"
  }
}
```
- Error response example (`404/400`):
```json
{
  "error": "Job not found"
}
```
- Description: Create payment entry for a job.
- Notes: Initial status is `PENDING`.

### PUT /admin/payment/:id/mark-paid
- Method: `PUT`
- URL: `{{base_url}}/admin/payment/{{payment_id}}/mark-paid`
- Auth required: `Yes (Admin JWT)`
- Headers:
  - `Authorization: Bearer {{admin_token}}`
  - `Content-Type: application/json`
- Params:
  - `id` (path, number)
- Query params: `None`
- Request body example:
```json
{
  "transactionId": "TXN123456"
}
```
- Success response example (`200`):
```json
{
  "message": "Payment marked as paid",
  "payment": {
    "id": 31,
    "status": "PAID",
    "transactionId": "TXN123456"
  }
}
```
- Error response example (`400/404`):
```json
{
  "error": "Payment already marked as paid"
}
```
- Description: Mark payment as paid.
- Notes: Requested path `/admin/payment/mark-paid` is not implemented.

### GET /admin/payment/:id
- Method: `GET`
- URL: `{{base_url}}/admin/payment/{{payment_id}}`
- Auth required: `Yes (Admin JWT)`
- Headers: `Authorization: Bearer {{admin_token}}`
- Params:
  - `id` (path, number)
- Query params: `None`
- Request body JSON example: `None`
- Success response example (`200`):
```json
{
  "payment": {
    "id": 31,
    "jobId": 101,
    "amount": 1200,
    "method": "UPI",
    "status": "PAID"
  }
}
```
- Error response example (`404`):
```json
{
  "error": "Payment not found"
}
```
- Description: Get payment details by id.
- Notes: Implemented extra endpoint.

---

## 10) Wallet / Payout

### GET /wallet/admin/payouts
- Method: `GET`
- URL: `{{base_url}}/wallet/admin/payouts`
- Auth required: `Yes (Admin JWT)`
- Headers: `Authorization: Bearer {{admin_token}}`
- Params: `None`
- Query params:
  - `technicianId`
  - `status`
- Request body JSON example: `None`
- Success response example (`200`):
```json
{
  "payouts": [
    {
      "id": 51,
      "technicianId": 11,
      "amount": 2500,
      "status": "PENDING"
    }
  ]
}
```
- Error response example (`400`):
```json
{
  "error": "Failed to list payouts"
}
```
- Description: List payout requests.
- Notes: Implemented path differs from requested `/admin/payout`.

### PUT /wallet/admin/payout/:id/approve
- Method: `PUT`
- URL: `{{base_url}}/wallet/admin/payout/{{payout_id}}/approve`
- Auth required: `Yes (Admin JWT)`
- Headers:
  - `Authorization: Bearer {{admin_token}}`
  - `Content-Type: application/json`
- Params:
  - `id` (path, number)
- Query params: `None`
- Request body example:
```json
{
  "adminNote": "Approved after verification"
}
```
- Success response example (`200`):
```json
{
  "message": "Payout approved",
  "payout": {
    "id": 51,
    "status": "APPROVED",
    "adminNote": "Approved after verification"
  }
}
```
- Error response example (`400/404`):
```json
{
  "error": "Payout is not in pending state"
}
```
- Description: Approve payout request.
- Notes: Requires payout in `PENDING` status.

### PUT /wallet/admin/payout/:id/pay
- Method: `PUT`
- URL: `{{base_url}}/wallet/admin/payout/{{payout_id}}/pay`
- Auth required: `Yes (Admin JWT)`
- Headers: `Authorization: Bearer {{admin_token}}`
- Params:
  - `id` (path, number)
- Query params: `None`
- Request body JSON example: `None`
- Success response example (`200`):
```json
{
  "message": "Payout marked as paid",
  "payout": {
    "id": 51,
    "status": "PAID"
  },
  "walletBalance": 18000
}
```
- Error response example (`400/404`):
```json
{
  "error": "Payout must be approved before marking as paid"
}
```
- Description: Mark approved payout as paid.
- Notes: Debits technician wallet.

### GET /wallet/admin/wallets
- Method: `GET`
- URL: `{{base_url}}/wallet/admin/wallets`
- Auth required: `Yes (Admin JWT)`
- Headers: `Authorization: Bearer {{admin_token}}`
- Params: `None`
- Query params: `None`
- Request body JSON example: `None`
- Success response example (`200`):
```json
{
  "wallets": [
    {
      "id": 1,
      "technicianId": 11,
      "balance": 20500,
      "technician": {
        "id": 11,
        "name": "Ravi Kumar",
        "mobile": "9000000001"
      }
    }
  ]
}
```
- Error response example (`400`):
```json
{
  "error": "Failed to get wallets"
}
```
- Description: Wallet overview for admin.
- Notes: This is the implemented equivalent of requested wallet overview API.

---

## 11) Reports

### GET /admin/revenue/report
- Method: `GET`
- URL: `{{base_url}}/admin/revenue/report`
- Auth required: `Yes (Admin JWT)`
- Headers: `Authorization: Bearer {{admin_token}}`
- Params: `None`
- Query params: `None`
- Request body JSON example: `None`
- Success response example (`200`):
```json
{
  "serviceRevenue": 50000,
  "spareRevenue": 12000,
  "totalRevenue": 62000,
  "platformCommission": 50000,
  "technicianPayout": 30000
}
```
- Error response example (`500`):
```json
{
  "error": "Failed to fetch revenue report"
}
```
- Description: Revenue summary report.
- Notes: Implemented path differs from requested `/admin/revenue-report`.

---

## Route Differences vs Requested Paths

The following requested endpoints are not implemented exactly as requested, but equivalents exist:

- Requested: `GET /admin/category` -> Implemented: `GET /admin/categories`
- Requested: `POST /admin/category` -> Implemented: `POST /admin/categories`
- Requested: `PUT /admin/category/:id` -> Implemented: `PUT /admin/categories/:id`
- Requested: `DELETE /admin/category/:id` -> Implemented: `DELETE /admin/categories/:id`
- Requested: `GET /admin/technician` -> Implemented: `GET /admin/technicians`
- Requested: `POST /admin/technician` -> Implemented: `POST /admin/technicians`
- Requested: `PUT /admin/technician/:id` -> Implemented: `PUT /admin/technicians/:id`
- Requested: `PATCH /admin/technician/:id/status` -> Implemented as:
  - `PATCH /admin/technicians/:id/block`
  - `PATCH /admin/technicians/:id/unblock`
  - `PATCH /admin/technicians/:id/toggle-active`
- Requested: `DELETE /admin/technician/:id` -> Implemented: `DELETE /admin/technicians/:id`
- Requested: `GET /admin/job/:id` -> Not implemented
- Requested: `POST /admin/job/:id/send-otp` -> Implemented: `POST /admin/technicians/job/:id/send-otp`
- Requested: `GET /admin/spare` -> Implemented: `GET /admin/spares`
- Requested: `POST /admin/spare` -> Implemented: `POST /admin/spares`
- Requested: `PUT /admin/spare/:id` -> Implemented: `PUT /admin/spares/:id`
- Requested: `DELETE /admin/spare/:id` -> Implemented: `DELETE /admin/spares/:id`
- Requested: `GET /admin/spare/low-stock` -> Implemented: `GET /admin/spares/low-stock`
- Requested: `GET /admin/custom-spare` -> Implemented: `GET /custom-spare/admin/requests`
- Requested: `PUT /admin/custom-spare/:id/approve` -> Implemented: `PUT /custom-spare/admin/:id/approve`
- Requested: `PUT /admin/custom-spare/:id/reject` -> Implemented: `PUT /custom-spare/admin/:id/reject`
- Requested: `GET /admin/scope-of-work` -> Implemented: `GET /scope-of-work/pending`
- Requested: `POST /admin/payment/mark-paid` -> Implemented: `PUT /admin/payment/:id/mark-paid`
- Requested: `GET /admin/payout` -> Implemented: `GET /wallet/admin/payouts`
- Requested: `PUT /admin/payout/:id/approve` -> Implemented: `PUT /wallet/admin/payout/:id/approve`
- Requested: `PUT /admin/payout/:id/pay` -> Implemented: `PUT /wallet/admin/payout/:id/pay`
- Requested: `GET /admin/wallet-overview` -> Implemented: `GET /wallet/admin/wallets`
- Requested: `GET /admin/revenue-report` -> Implemented: `GET /admin/revenue/report`
- Requested: `GET /admin/profile` -> Not implemented
- Requested: `POST /admin/logout` -> Not implemented
