import { UsersListPage } from "@/pages/users/users-list-page"
import { UserDetailPage } from "@/pages/users/user-detail-page"
import { useParams } from "@tanstack/react-router"

export function StudentsPage() {
  return (
    <UsersListPage
      role="student"
      title="Students"
      description="Manage student profiles, attendance, progress, and reschedule requests."
    />
  )
}

export function TeachersPage() {
  return (
    <UsersListPage
      role="teacher"
      title="Teachers"
      description="Manage teacher profiles and attendance."
    />
  )
}

export function StaffPage() {
  return (
    <UsersListPage
      role="staff"
      title="Staff"
      description="Manage staff profiles and attendance."
    />
  )
}

export function AdminsPage() {
  return (
    <UsersListPage
      role="admin"
      title="Admins"
      description="Manage admin profiles and attendance."
    />
  )
}

export function StudentDetailPage() {
  const { id, tab } = useParams({ strict: false }) as { id: string; tab: string }
  return <UserDetailPage role="student" id={id} tab={tab} />
}

export function TeacherDetailPage() {
  const { id, tab } = useParams({ strict: false }) as { id: string; tab: string }
  return <UserDetailPage role="teacher" id={id} tab={tab} />
}

export function StaffDetailPage() {
  const { id, tab } = useParams({ strict: false }) as { id: string; tab: string }
  return <UserDetailPage role="staff" id={id} tab={tab} />
}

export function AdminDetailPage() {
  const { id, tab } = useParams({ strict: false }) as { id: string; tab: string }
  return <UserDetailPage role="admin" id={id} tab={tab} />
}
