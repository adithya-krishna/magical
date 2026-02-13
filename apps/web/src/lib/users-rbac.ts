export type AppRole = "super_admin" | "admin" | "staff" | "teacher" | "student"
export type ManagedUserRole = "student" | "teacher" | "staff" | "admin"

export function canViewUserList(role: AppRole, managedRole: ManagedUserRole) {
  if (role === "super_admin") {
    return true
  }

  if (managedRole === "admin") {
    return false
  }

  if (managedRole === "staff") {
    return role === "admin"
  }

  if (managedRole === "teacher") {
    return role === "admin" || role === "staff"
  }

  return role === "admin" || role === "staff"
}

export function canViewOwnProfile(role: AppRole, managedRole: ManagedUserRole) {
  return role === managedRole
}

export function canManageUsers(role: AppRole, managedRole: ManagedUserRole) {
  if (role === "super_admin") {
    return true
  }

  if (role !== "admin") {
    return false
  }

  return managedRole === "staff" || managedRole === "teacher" || managedRole === "student"
}
