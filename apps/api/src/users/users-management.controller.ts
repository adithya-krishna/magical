import { Request, Response } from "express";
import { z } from "zod";
import { isAppError } from "../common/errors";
import {
  studentProgressSchema,
  userAttendanceSchema,
  userCreateSchema,
  userDeleteSchema,
  userListSchema,
  userProfilePatchSchema
} from "./users-management.schemas";
import {
  createUserByRoleService,
  deleteUserByRoleService,
  createStudentProgressService,
  createUserAttendanceService,
  deleteStudentProgressService,
  deleteUserAttendanceService,
  getUserByRoleService,
  listStudentProgressService,
  listStudentRescheduleRequestsService,
  listUserAttendanceService,
  listUsersByRoleService,
  patchStudentProgressService,
  patchUserAttendanceService,
  patchUserProfileService,
  setStudentTemporaryPasswordService
} from "./users-management.service";
import type { ManagedRole } from "./users-management.types";

function handleError(res: Response, error: unknown) {
  if (isAppError(error)) {
    res.status(error.status).json({ error: error.message, details: error.details });
    return;
  }

  res.status(500).json({ error: "Internal server error" });
}

function parseIdParams(req: Request, res: Response) {
  const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return null;
  }

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return { id: params.data.id, requester: req.user };
}

function parseAttendanceParams(req: Request, res: Response) {
  const params = z
    .object({ id: z.string().uuid(), attendanceId: z.string().uuid() })
    .safeParse(req.params);

  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return null;
  }

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return { params: params.data, requester: req.user };
}

function parseProgressParams(req: Request, res: Response) {
  const params = z
    .object({ id: z.string().uuid(), progressId: z.string().uuid() })
    .safeParse(req.params);

  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return null;
  }

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return { params: params.data, requester: req.user };
}

export function makeListUsersHandler(role: ManagedRole) {
  return async (req: Request, res: Response) => {
    const parsed = userListSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const { page, pageSize, ...filters } = parsed.data;
      const result = await listUsersByRoleService(role, filters, page, pageSize, req.user);
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  };
}

export function makeCreateUserHandler(role: ManagedRole) {
  return async (req: Request, res: Response) => {
    const parsed = userCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const data = await createUserByRoleService(role, parsed.data, req.user);
      res.status(201).json({ data });
    } catch (error) {
      handleError(res, error);
    }
  };
}

export function makeGetUserHandler(role: ManagedRole) {
  return async (req: Request, res: Response) => {
    const parsed = parseIdParams(req, res);
    if (!parsed) {
      return;
    }

    try {
      const data = await getUserByRoleService(role, parsed.id, parsed.requester);
      res.json({ data });
    } catch (error) {
      handleError(res, error);
    }
  };
}

export function makePatchUserHandler(role: ManagedRole) {
  return async (req: Request, res: Response) => {
    const parsed = parseIdParams(req, res);
    if (!parsed) {
      return;
    }

    const body = userProfilePatchSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.flatten() });
      return;
    }

    try {
      const data = await patchUserProfileService(role, parsed.id, body.data, parsed.requester);
      res.json({ data });
    } catch (error) {
      handleError(res, error);
    }
  };
}

export function makeDeleteUserHandler(role: ManagedRole) {
  return async (req: Request, res: Response) => {
    const parsed = parseIdParams(req, res);
    if (!parsed) {
      return;
    }

    const query = userDeleteSchema.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: query.error.flatten() });
      return;
    }

    try {
      await deleteUserByRoleService(role, parsed.id, parsed.requester, query.data?.hardDelete === true);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  };
}

export function makeListAttendanceHandler(role: ManagedRole) {
  return async (req: Request, res: Response) => {
    const parsed = parseIdParams(req, res);
    if (!parsed) {
      return;
    }

    try {
      const data = await listUserAttendanceService(role, parsed.id, parsed.requester);
      res.json({ data });
    } catch (error) {
      handleError(res, error);
    }
  };
}

export function makeCreateAttendanceHandler(role: ManagedRole) {
  return async (req: Request, res: Response) => {
    const parsed = parseIdParams(req, res);
    if (!parsed) {
      return;
    }

    const body = userAttendanceSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.flatten() });
      return;
    }

    try {
      const data = await createUserAttendanceService(role, parsed.id, body.data, parsed.requester);
      res.status(201).json({ data });
    } catch (error) {
      handleError(res, error);
    }
  };
}

export function makePatchAttendanceHandler(role: ManagedRole) {
  return async (req: Request, res: Response) => {
    const parsed = parseAttendanceParams(req, res);
    if (!parsed) {
      return;
    }

    const body = userAttendanceSchema.partial().safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.flatten() });
      return;
    }

    try {
      const data = await patchUserAttendanceService(
        role,
        parsed.params.id,
        parsed.params.attendanceId,
        body.data,
        parsed.requester
      );
      res.json({ data });
    } catch (error) {
      handleError(res, error);
    }
  };
}

export function makeDeleteAttendanceHandler(role: ManagedRole) {
  return async (req: Request, res: Response) => {
    const parsed = parseAttendanceParams(req, res);
    if (!parsed) {
      return;
    }

    try {
      await deleteUserAttendanceService(
        role,
        parsed.params.id,
        parsed.params.attendanceId,
        parsed.requester
      );
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  };
}

export async function listStudentProgress(req: Request, res: Response) {
  const parsed = parseIdParams(req, res);
  if (!parsed) {
    return;
  }

  try {
    const data = await listStudentProgressService(parsed.id, parsed.requester);
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function createStudentProgress(req: Request, res: Response) {
  const parsed = parseIdParams(req, res);
  if (!parsed) {
    return;
  }

  const body = studentProgressSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }

  try {
    const data = await createStudentProgressService(parsed.id, body.data, parsed.requester);
    res.status(201).json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function patchStudentProgress(req: Request, res: Response) {
  const parsed = parseProgressParams(req, res);
  if (!parsed) {
    return;
  }

  const body = studentProgressSchema.partial().safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }

  try {
    const data = await patchStudentProgressService(
      parsed.params.id,
      parsed.params.progressId,
      body.data,
      parsed.requester
    );
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function deleteStudentProgress(req: Request, res: Response) {
  const parsed = parseProgressParams(req, res);
  if (!parsed) {
    return;
  }

  try {
    await deleteStudentProgressService(parsed.params.id, parsed.params.progressId, parsed.requester);
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}

export async function listStudentRescheduleRequests(req: Request, res: Response) {
  const parsed = parseIdParams(req, res);
  if (!parsed) {
    return;
  }

  try {
    const data = await listStudentRescheduleRequestsService(parsed.id, parsed.requester);
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function setStudentTemporaryPassword(req: Request, res: Response) {
  const parsed = parseIdParams(req, res);
  if (!parsed) {
    return;
  }

  const body = z.object({ password: z.string().min(8) }).safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }

  try {
    await setStudentTemporaryPasswordService(parsed.id, body.data.password, parsed.requester);
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}
