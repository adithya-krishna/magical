import { Request, Response } from "express";
import { z } from "zod";
import { isAppError } from "../common/errors";
import {
  courseCreateSchema,
  courseListSchema,
  courseTeacherCreateSchema,
  courseUpdateSchema
} from "./courses.schemas";
import {
  addCourseTeacherService,
  archiveCourseService,
  createCourseService,
  getCourseService,
  listCoursesService,
  listCourseTeachersService,
  removeCourseTeacherService,
  updateCourseService
} from "./courses.service";

function handleError(res: Response, error: unknown) {
  if (isAppError(error)) {
    res.status(error.status).json({ error: error.message, details: error.details });
    return;
  }

  res.status(500).json({ error: "Internal server error" });
}

export async function listCourses(req: Request, res: Response) {
  const parsed = courseListSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const { page, pageSize, ...filters } = parsed.data;
    const result = await listCoursesService(filters, page, pageSize);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

export async function getCourse(req: Request, res: Response) {
  const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  try {
    const data = await getCourseService(params.data.id);
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function createCourse(req: Request, res: Response) {
  const parsed = courseCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const data = await createCourseService(parsed.data);
    res.status(201).json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function patchCourse(req: Request, res: Response) {
  const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  const parsed = courseUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const data = await updateCourseService(params.data.id, parsed.data);
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function deleteCourse(req: Request, res: Response) {
  const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  try {
    await archiveCourseService(params.data.id);
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}

export async function getCourseTeachers(req: Request, res: Response) {
  const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  try {
    const data = await listCourseTeachersService(params.data.id);
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function postCourseTeacher(req: Request, res: Response) {
  const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  const parsed = courseTeacherCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    await addCourseTeacherService(params.data.id, parsed.data.teacherId);
    res.status(201).send();
  } catch (error) {
    handleError(res, error);
  }
}

export async function deleteCourseTeacher(req: Request, res: Response) {
  const params = z
    .object({ id: z.string().uuid(), teacherId: z.string().uuid() })
    .safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  try {
    await removeCourseTeacherService(params.data.id, params.data.teacherId);
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}
