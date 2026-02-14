export type SelectUser = {
  id: string
  firstName: string
  lastName: string
  role: "super_admin" | "admin" | "staff" | "teacher" | "student"
}

export type UserListResponse = {
  data: SelectUser[]
}
