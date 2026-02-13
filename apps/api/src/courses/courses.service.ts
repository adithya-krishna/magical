import { AppError } from "../common/errors";
import { getUserById } from "../users/user.repo";
import {
  addCourseTeacher,
  archiveCourse,
  createCourse,
  getCourseById,
  getTeachersByIds,
  listCourseTeachers,
  listCourses,
  removeCourseTeacher,
  updateCourse
} from "./courses.repo";
import { getInstrumentById } from "./instruments.repo";
import type {
  CourseCreateInput,
  CourseListFilters,
  CourseUpdateInput
} from "./courses.types";

async function ensureActiveInstrument(instrumentId: string) {
  const instrument = await getInstrumentById(instrumentId);
  if (!instrument) {
    throw new AppError(404, "Instrument not found");
  }

  if (!instrument.isActive) {
    throw new AppError(400, "Course must reference an active instrument");
  }

  return instrument;
}

async function ensureCourseExists(courseId: string) {
  const course = await getCourseById(courseId);
  if (!course) {
    throw new AppError(404, "Course not found");
  }

  return course;
}

export async function listCoursesService(
  filters: CourseListFilters,
  page?: number,
  pageSize?: number
) {
  return listCourses(filters, page, pageSize);
}

export async function getCourseService(courseId: string) {
  const course = await getCourseById(courseId);
  if (!course) {
    throw new AppError(404, "Course not found");
  }

  return course;
}

export async function createCourseService(input: CourseCreateInput) {
  await ensureActiveInstrument(input.instrumentId);
  return createCourse(input);
}

export async function updateCourseService(courseId: string, patch: CourseUpdateInput) {
  await ensureCourseExists(courseId);

  if (patch.instrumentId) {
    await ensureActiveInstrument(patch.instrumentId);
  }

  const updated = await updateCourse(courseId, patch);
  if (!updated) {
    throw new AppError(404, "Course not found");
  }

  return updated;
}

export async function archiveCourseService(courseId: string) {
  await ensureCourseExists(courseId);
  const archived = await archiveCourse(courseId);

  if (!archived) {
    throw new AppError(404, "Course not found");
  }

  return archived;
}

export async function listCourseTeachersService(courseId: string) {
  await ensureCourseExists(courseId);
  return listCourseTeachers(courseId);
}

export async function addCourseTeacherService(courseId: string, teacherId: string) {
  const course = await ensureCourseExists(courseId);
  if (!course.isActive) {
    throw new AppError(400, "Cannot assign teachers to an archived course");
  }

  const teacher = await getUserById(teacherId);
  if (!teacher || teacher.role !== "teacher") {
    throw new AppError(400, "CourseTeacher must reference a teacher user");
  }

  const existingTeachers = await getTeachersByIds([teacherId]);
  if (existingTeachers.length === 0) {
    throw new AppError(400, "Teacher not found");
  }

  try {
    await addCourseTeacher(courseId, teacherId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("course_teachers_unique")) {
      throw new AppError(409, "Teacher is already assigned to this course");
    }

    throw error;
  }
}

export async function removeCourseTeacherService(courseId: string, teacherId: string) {
  await ensureCourseExists(courseId);
  const removed = await removeCourseTeacher(courseId, teacherId);
  if (!removed) {
    throw new AppError(404, "Course teacher assignment not found");
  }
}
